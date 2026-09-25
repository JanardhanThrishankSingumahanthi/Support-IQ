import sys
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, TaskType, get_peft_model, prepare_model_for_kbit_training

def test_qlora():
    print("Testing QLoRA prerequisites on RTX 2050...")
    model_id = "Qwen/Qwen2.5-0.5B-Instruct"
    
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )
    
    print("Loading 4-bit NF4 quantized model...")
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=bnb_config,
        device_map={"": 0},
    )
    
    vram_alloc = torch.cuda.memory_allocated(0) / (1024**3)
    print(f"[PASS] 4-bit Base Model Loaded. VRAM Allocated: {vram_alloc:.2f} GB")
    
    print("Preparing model for kbit training...")
    model = prepare_model_for_kbit_training(model)
    
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=8,
        lora_alpha=16,
        lora_dropout=0.05,
        target_modules=["q_proj", "v_proj"],
        bias="none",
    )
    
    model = get_peft_model(model, lora_config)
    trainable_params, all_params = model.get_nb_trainable_parameters()
    print(f"[PASS] PEFT QLoRA Model created. Trainable: {trainable_params:,} / {all_params:,} ({100*trainable_params/all_params:.3f}%)")
    
    # Test dummy forward and backward pass
    inputs = tokenizer("Hello SupportIQ!", return_tensors="pt").to("cuda:0")
    outputs = model(**inputs, labels=inputs["input_ids"])
    loss = outputs.loss
    loss.backward()
    print(f"[PASS] Dummy forward/backward successful. Loss: {loss.item():.4f}")
    
    # Test generation
    prompt = "<|im_start|>user\nHello SupportIQ!<|im_end|>\n<|im_start|>assistant\n"
    gen_in = tokenizer(prompt, return_tensors="pt").to("cuda:0")
    with torch.no_grad():
        out = model.generate(**gen_in, max_new_tokens=10)
    print(f"[PASS] Generation successful: {tokenizer.decode(out[0], skip_special_tokens=True)}")
    print("[ALL QLORA PREREQUISITES PASS]")

if __name__ == "__main__":
    test_qlora()
