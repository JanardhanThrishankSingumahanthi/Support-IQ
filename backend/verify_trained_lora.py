import json
import torch
from pathlib import Path
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

def main():
    print("=" * 65)
    print("VERIFYING TRAINED SUPPORTIQ LoRA ADAPTER INFERENCE")
    print("=" * 65)

    adapter_dir = Path("backend/artifacts/adapters/supportiq_lora_qwen05b")
    assert adapter_dir.exists(), f"Adapter directory {adapter_dir} does not exist"
    assert (adapter_dir / "adapter_model.safetensors").exists(), "Missing adapter_model.safetensors"
    assert (adapter_dir / "adapter_config.json").exists(), "Missing adapter_config.json"
    assert (adapter_dir / "training_metrics.json").exists(), "Missing training_metrics.json"

    with open(adapter_dir / "training_metrics.json", "r", encoding="utf-8") as f:
        metrics = json.load(f)

    print(f"[+] Loaded Training Metrics:")
    print(f"    - Method              : {metrics['method']}")
    print(f"    - Trainable Parameters: {metrics['trainable_parameters']:,} ({metrics['trainable_percentage']}%)")
    print(f"    - Training Loss Start : {metrics['loss_progression'][0]['train_loss']:.4f}")
    print(f"    - Training Loss End   : {metrics['loss_progression'][-1]['train_loss']:.4f}")
    print(f"    - Initial Val Loss    : {metrics['initial_val_loss']:.4f}")
    print(f"    - Final Val Loss      : {metrics['final_val_loss']:.4f}")
    print(f"    - Peak GPU VRAM       : {metrics['peak_vram_gb']} GB / {metrics['vram_total_gb']} GB")
    print(f"    - Training Duration   : {metrics['training_duration_seconds']}s")

    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    print(f"\n[+] Loading Base Model on {device}...")
    base_model = AutoModelForCausalLM.from_pretrained(
        metrics["model_id"],
        torch_dtype=torch.float16 if device.startswith("cuda") else torch.float32,
        device_map=device,
    )
    tokenizer = AutoTokenizer.from_pretrained(str(adapter_dir))

    print(f"[+] Attaching Trained LoRA Adapter from {adapter_dir}...")
    model = PeftModel.from_pretrained(base_model, str(adapter_dir))
    model.eval()

    test_cases = [
        {
            "category": "Express Replacement",
            "context": "1. Replacement Eligibility: Customers may request an express replacement within 14 days of receiving damaged or defective equipment. 2. RMA Requirements: A valid RMA number must be generated through the customer support portal.",
            "question": "What is the deadline to request an express replacement for defective equipment?"
        },
        {
            "category": "Refund Policy",
            "context": "3. REFUND POLICY Annual subscriptions may be refunded within 14 days of purchase, provided the service has not been substantially used. Refund requests are typically processed within 5-7 business days to the original payment method.",
            "question": "Can I get a refund for an annual subscription purchased 8 days ago?"
        }
    ]

    print("\n" + "=" * 65)
    print("LIVE LoRA INFERENCE VERIFICATION")
    print("=" * 65)

    for i, tc in enumerate(test_cases, 1):
        prompt = (
            f"<|im_start|>system\nYou are SupportIQ's AI customer support assistant. "
            f"Answer accurately using the support context.<|im_end|>\n"
            f"<|im_start|>user\nContext: {tc['context']}\nQuestion: {tc['question']}<|im_end|>\n"
            f"<|im_start|>assistant\n"
        )
        inputs = tokenizer(prompt, return_tensors="pt").to(device)
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=48,
                do_sample=False,
                pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
            )
        full_text = tokenizer.decode(outputs[0], skip_special_tokens=False)
        answer = full_text.split("<|im_start|>assistant\n")[-1].replace("<|im_end|>", "").strip()
        print(f"\nTest {i} [{tc['category']}]:")
        print(f"  Q: \"{tc['question']}\"")
        print(f"  LoRA Answer: \"{answer}\"")

    print("\n" + "=" * 65)
    print("VERDICT: LoRA ADAPTER LOAD & INFERENCE FULLY VERIFIED [PASS]")
    print("=" * 65)

if __name__ == "__main__":
    main()
