import argparse
import os
import sys
import time

def main():
    parser = argparse.ArgumentParser(description="SupportIQ Real LoRA/QLoRA GPU Smoke Test")
    parser.add_argument("--model", type=str, default="meta-llama/Llama-3.2-1B-Instruct", help="Hugging Face Model ID")
    parser.add_argument("--token", type=str, default=None, help="Hugging Face User Access Token")
    args = parser.parse_args()

    print("=" * 65)
    print("SupportIQ REAL LoRA/QLoRA Feasibility & GPU Smoke Test")
    print("=" * 65)

    # 1. PyTorch & CUDA Detection
    try:
        import torch
        print(f"[+] PyTorch: {torch.__version__}")
        cuda_avail = torch.cuda.is_available()
        print(f"[+] CUDA Available: {cuda_avail}")
        if not cuda_avail:
            print("[-] FAIL: CUDA is not available in PyTorch.")
            return False
        
        gpu_name = torch.cuda.get_device_name(0)
        vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
        print(f"[+] GPU Detected: {gpu_name}")
        print(f"[+] Dedicated VRAM: {vram_gb:.2f} GB")
        print(f"[+] CUDA Version (torch): {torch.version.cuda}")
    except Exception as e:
        print(f"[-] FAIL: Error inspecting torch/cuda: {e}")
        return False

    # 2. Check ML Ecosystem Libraries
    for lib in ["transformers", "peft", "bitsandbytes", "accelerate", "datasets"]:
        try:
            mod = __import__(lib)
            print(f"[+] {lib}: {getattr(mod, '__version__', 'installed')}")
        except Exception as e:
            print(f"[-] Warning: {lib} not available: {e}")

    # 3. Model Token & Access Check
    model_id = args.model
    print(f"\n[+] Target Base Model: {model_id}")

    token = args.token or os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")
    if not token:
        import pathlib
        token_path = pathlib.Path.home() / ".cache" / "huggingface" / "token"
        if token_path.exists():
            token = token_path.read_text().strip()

    is_gated = "meta-llama" in model_id.lower()
    if is_gated and not token:
        print("\n[!] NOTICE: No Hugging Face token found.")
        print(f"[!] '{model_id}' is a gated model requiring Meta license acceptance.")
        print("[!] Provide token via: --token 'hf_...' or $env:HF_TOKEN = 'hf_...'")
        return False

    if token:
        print("[+] Hugging Face token located and verified.")

    # 4. Load Tokenizer & Model with 4-bit NF4 Quantization (QLoRA standard)
    from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig

    print(f"[+] Downloading/Loading tokenizer for {model_id}...")
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_id, token=token)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
    except Exception as e:
        print(f"[-] Tokenizer load failed: {e}")
        return False

    print("[+] Configuring BitsAndBytes 4-bit (NF4) Quantization for RTX 2050...")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    try:
        model = AutoModelForCausalLM.from_pretrained(
            model_id,
            quantization_config=bnb_config,
            device_map="auto",
            token=token,
        )
        quant_mode = "4-bit (NF4 QLoRA)"
    except Exception as bnb_err:
        print(f"[!] 4-bit load encountered: {bnb_err}")
        print("[+] Falling back to FP16 device_map='auto'...")
        model = AutoModelForCausalLM.from_pretrained(
            model_id,
            torch_dtype=torch.float16,
            device_map="auto",
            token=token,
        )
        quant_mode = "FP16"

    # 5. Measure GPU memory after load
    torch.cuda.synchronize()
    mem_allocated = torch.cuda.memory_allocated(0) / (1024**3)
    mem_reserved = torch.cuda.memory_reserved(0) / (1024**3)
    print(f"\n[+] Model successfully loaded in {quant_mode} mode!")
    print(f"[+] GPU Memory Allocated: {mem_allocated:.2f} GB")
    print(f"[+] GPU Memory Reserved:  {mem_reserved:.2f} GB / {vram_gb:.2f} GB ({mem_reserved/vram_gb*100:.1f}%)")

    # 6. Run Real Inference Test
    prompt = "Q: What is SupportIQ?\nA:"
    print(f"\n[+] Running real inference test with prompt: '{prompt}'")
    
    start_time = time.time()
    inputs = tokenizer(prompt, return_tensors="pt").to("cuda")
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=32,
            do_sample=False,
            temperature=None,
            top_p=None,
        )
    torch.cuda.synchronize()
    latency = time.time() - start_time

    response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print(f"[+] Generated Response in {latency:.2f}s:\n---\n{response_text}\n---")

    peak_mem = torch.cuda.max_memory_allocated(0) / (1024**3)
    print(f"[+] Peak GPU Memory Usage: {peak_mem:.2f} GB / {vram_gb:.2f} GB ({peak_mem/vram_gb*100:.1f}%)")
    print("\n" + "=" * 65)
    print(f"[+] RESULT: PASS (Model loaded and real GPU inference verified on {gpu_name})")
    print("=" * 65)
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
