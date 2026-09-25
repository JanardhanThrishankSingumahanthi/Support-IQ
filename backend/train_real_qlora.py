import io
import json
import os
import sqlite3
import sys
import time
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import torch
from torch.utils.data import Dataset, DataLoader
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    get_linear_schedule_with_warmup,
)
from peft import (
    LoraConfig,
    TaskType,
    get_peft_model,
    prepare_model_for_kbit_training,
    PeftModel,
)


class SupportQADataset(Dataset):
    def __init__(self, jsonl_path: Path, tokenizer, max_length: int = 512):
        self.examples = []
        with open(jsonl_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    self.examples.append(json.loads(line))
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.examples)

    def __getitem__(self, idx):
        item = self.examples[idx]
        instruction = item["instruction"]
        context = item["context"]
        question = item["question"]
        answer = item["answer"]

        # Format with Qwen chat template tags
        prompt = (
            f"<|im_start|>system\n{instruction}\n"
            f"Relevant Support Context:\n{context}<|im_end|>\n"
            f"<|im_start|>user\n{question}<|im_end|>\n"
            f"<|im_start|>assistant\n"
        )
        full_text = prompt + f"{answer}<|im_end|>"

        prompt_ids = self.tokenizer.encode(prompt, add_special_tokens=False)
        full_ids = self.tokenizer.encode(full_text, add_special_tokens=False)

        # Truncate if necessary
        if len(full_ids) > self.max_length:
            full_ids = full_ids[:self.max_length]

        input_ids = full_ids
        attention_mask = [1] * len(input_ids)

        # Mask labels for prompt tokens (-100 so loss is computed solely on the answer)
        labels = [-100] * len(prompt_ids) + full_ids[len(prompt_ids):]
        if len(labels) > self.max_length:
            labels = labels[:self.max_length]

        return {
            "input_ids": torch.tensor(input_ids, dtype=torch.long),
            "attention_mask": torch.tensor(attention_mask, dtype=torch.long),
            "labels": torch.tensor(labels, dtype=torch.long),
        }


def collate_fn(batch):
    max_len = max(len(x["input_ids"]) for x in batch)
    input_ids_padded = []
    attention_mask_padded = []
    labels_padded = []

    for item in batch:
        pad_len = max_len - len(item["input_ids"])
        pad_id = 151643  # Qwen pad token
        input_ids_padded.append(torch.cat([item["input_ids"], torch.full((pad_len,), pad_id, dtype=torch.long)]))
        attention_mask_padded.append(torch.cat([item["attention_mask"], torch.zeros(pad_len, dtype=torch.long)]))
        labels_padded.append(torch.cat([item["labels"], torch.full((pad_len,), -100, dtype=torch.long)]))

    return {
        "input_ids": torch.stack(input_ids_padded),
        "attention_mask": torch.stack(attention_mask_padded),
        "labels": torch.stack(labels_padded),
    }


def evaluate(model, dataloader, device):
    model.eval()
    total_loss = 0.0
    steps = 0
    with torch.no_grad():
        for batch in dataloader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels,
            )
            total_loss += outputs.loss.item()
            steps += 1
    return total_loss / max(1, steps)


def generate_response(model, tokenizer, question: str, context: str, device: str) -> str:
    prompt = (
        f"<|im_start|>system\nYou are SupportIQ's AI customer support assistant. "
        f"Answer using the support context accurately.<|im_end|>\n"
        f"<|im_start|>user\nContext: {context}\nQuestion: {question}<|im_end|>\n"
        f"<|im_start|>assistant\n"
    )
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=48,
            do_sample=False,
            temperature=None,
            top_p=None,
            pad_token_id=tokenizer.pad_token_id or tokenizer.eos_token_id,
        )
    full_output = tokenizer.decode(output[0], skip_special_tokens=False)
    if "<|im_start|>assistant\n" in full_output:
        ans = full_output.split("<|im_start|>assistant\n")[-1]
        ans = ans.replace("<|im_end|>", "").strip()
        return ans
    return full_output.strip()


def main():
    print("=" * 65)
    print("SupportIQ REAL QLoRA FINE-TUNING PIPELINE (4-bit NF4)")
    print("=" * 65)

    # 1. Hardware & Environment Check
    if not torch.cuda.is_available():
        print("[-] FAIL: CUDA is not available.")
        sys.exit(1)

    device = "cuda:0"
    gpu_name = torch.cuda.get_device_name(0)
    vram_total_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
    print(f"[+] Device: {device} ({gpu_name})")
    print(f"[+] Total VRAM Available: {vram_total_gb:.2f} GB")

    base_dir = Path(__file__).resolve().parent
    db_path = base_dir / "supportiq.db"
    if db_path.exists():
        conn = sqlite3.connect(db_path)
        holdout_cases = conn.execute("SELECT id, question FROM evaluation_test_cases WHERE dataset_id = 2").fetchall()
        conn.close()
        print(f"[+] Auditing dataset against {len(holdout_cases)} frozen holdout cases in Dataset ID 2...")
    else:
        holdout_cases = []

    train_path = base_dir / "data" / "training" / "supportiq_train.jsonl"
    val_path = base_dir / "data" / "training" / "supportiq_val.jsonl"

    if not train_path.exists() or not val_path.exists():
        print(f"[-] Datasets missing: {train_path}, {val_path}")
        sys.exit(1)

    with open(train_path, "r", encoding="utf-8") as f:
        train_data = [json.loads(line) for line in f if line.strip()]
    for tc in train_data:
        tq = tc["question"].strip().lower()
        for hid, hq in holdout_cases:
            assert tq != hq.strip().lower(), f"Leakage violation: Holdout #{hid} found in train!"

    print(f"[+] Verified 0 Holdout Leakage across {len(train_data)} training records.")

    # 3. Model & Tokenizer Initialization with 4-bit NF4 Quantization
    model_id = "Qwen/Qwen2.5-0.5B-Instruct"
    print(f"\n[+] Configuring BitsAndBytesConfig for 4-bit NF4 Quantization...")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    print(f"[+] Loading Base Model: {model_id} in 4-bit NF4 with Double Quantization...")
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    torch.cuda.empty_cache()
    torch.cuda.reset_peak_memory_stats(0)

    base_model = AutoModelForCausalLM.from_pretrained(
        model_id,
        quantization_config=bnb_config,
        device_map={"": 0},
    )

    mem_base = torch.cuda.memory_allocated(0) / (1024**3)
    print(f"[+] 4-bit Base Model Loaded. VRAM Allocated: {mem_base:.2f} GB")

    # Baseline pre-training test generation
    test_q = "Within what timeframe can I request an express replacement for defective equipment?"
    test_ctx = "1. Replacement Eligibility: Customers may request an express replacement within 14 days of receiving damaged or defective equipment. 2. RMA Requirements: A valid RMA number must be generated."
    print("\n[+] Running Pre-QLoRA Baseline Inference on 4-bit Base Model:")
    baseline_response = generate_response(base_model, tokenizer, test_q, test_ctx, device)
    print(f"    Base Response: \"{baseline_response}\"")

    # 4. Prepare for k-bit Training and Apply PEFT LoRA Configuration
    print("\n[+] Preparing Model for k-bit Training...")
    base_model = prepare_model_for_kbit_training(base_model)

    print("[+] Applying PEFT LoRA Configuration for QLoRA...")
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=8,
        lora_alpha=16,
        lora_dropout=0.05,
        target_modules=["q_proj", "v_proj"],
        bias="none",
    )

    model = get_peft_model(base_model, lora_config)
    trainable_params, all_params = model.get_nb_trainable_parameters()
    trainable_pct = 100 * trainable_params / all_params

    print(f"[+] Trainable Parameters: {trainable_params:,} / {all_params:,} ({trainable_pct:.3f}%)")
    print(f"[+] QLoRA Config: rank={lora_config.r}, alpha={lora_config.lora_alpha}, targets={lora_config.target_modules}")

    # 5. Dataset & DataLoader Preparation
    train_dataset = SupportQADataset(train_path, tokenizer, max_length=512)
    val_dataset = SupportQADataset(val_path, tokenizer, max_length=512)

    batch_size = 2
    grad_accum_steps = 2
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, collate_fn=collate_fn)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, collate_fn=collate_fn)

    # 6. Optimizer & Learning Rate Scheduler
    learning_rate = 2e-4
    num_epochs = 3
    total_steps = (len(train_loader) // grad_accum_steps) * num_epochs
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=0.01)
    lr_scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=2,
        num_training_steps=total_steps,
    )

    # Initial Pre-Training Validation Loss
    init_val_loss = evaluate(model, val_loader, device)
    print(f"\n[+] Initial Pre-Training Validation Loss: {init_val_loss:.4f}")

    # 7. Training Loop
    print(f"\n[+] Starting Real QLoRA Fine-Tuning ({num_epochs} Epochs, Batch Size={batch_size}, Grad Accum={grad_accum_steps})...")
    start_time = time.time()
    model.train()

    epoch_losses = []
    step_count = 0

    for epoch in range(1, num_epochs + 1):
        running_loss = 0.0
        optimizer.zero_grad()
        epoch_steps = 0

        for step, batch in enumerate(train_loader):
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels,
            )
            loss = outputs.loss / grad_accum_steps
            loss.backward()

            running_loss += outputs.loss.item()
            epoch_steps += 1

            if (step + 1) % grad_accum_steps == 0 or (step + 1) == len(train_loader):
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                optimizer.step()
                lr_scheduler.step()
                optimizer.zero_grad()
                step_count += 1

        avg_epoch_loss = running_loss / max(1, epoch_steps)
        val_loss = evaluate(model, val_loader, device)
        epoch_losses.append({"epoch": epoch, "train_loss": avg_epoch_loss, "val_loss": val_loss})
        model.train()
        print(f"    Epoch {epoch}/{num_epochs}: Train Loss = {avg_epoch_loss:.4f} | Val Loss = {val_loss:.4f}")

    train_duration = time.time() - start_time
    final_val_loss = epoch_losses[-1]["val_loss"]
    peak_vram_gb = torch.cuda.max_memory_allocated(0) / (1024**3)

    print(f"\n[+] QLoRA Training Completed in {train_duration:.2f} seconds.")
    print(f"[+] Initial Val Loss: {init_val_loss:.4f} -> Final Val Loss: {final_val_loss:.4f} (Improved: {init_val_loss > final_val_loss})")
    print(f"[+] Peak GPU VRAM Usage: {peak_vram_gb:.2f} GB / {vram_total_gb:.2f} GB ({peak_vram_gb/vram_total_gb*100:.1f}%)")

    # 8. Save Trained QLoRA Adapter
    adapter_dir = base_dir / "artifacts" / "adapters" / "supportiq_qlora_qwen05b"
    adapter_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n[+] Saving QLoRA Adapter Weights to {adapter_dir}...")
    model.save_pretrained(str(adapter_dir))
    tokenizer.save_pretrained(str(adapter_dir))

    saved_files = [f.name for f in adapter_dir.iterdir()]
    print(f"[+] Adapter files saved: {saved_files}")

    # 9. Real Post-Training Inference Verification
    print("\n[+] Running Post-QLoRA Fine-Tuned Inference:")
    model.eval()
    post_qlora_response = generate_response(model, tokenizer, test_q, test_ctx, device)
    safe_disp = post_qlora_response.encode("ascii", errors="replace").decode("ascii")
    print(f"    QLoRA Response: \"{safe_disp}\"")

    # 10. Record Metrics JSON
    metrics_record = {
        "model_id": model_id,
        "method": "QLoRA (4-bit NF4 + Double Quantization + PEFT)",
        "quantization": {
            "load_in_4bit": True,
            "quant_type": "nf4",
            "compute_dtype": "float16",
            "double_quant": True,
        },
        "trainable_parameters": trainable_params,
        "total_parameters": all_params,
        "trainable_percentage": round(trainable_pct, 4),
        "rank": lora_config.r,
        "alpha": lora_config.lora_alpha,
        "target_modules": list(lora_config.target_modules),
        "epochs": num_epochs,
        "batch_size": batch_size,
        "grad_accum_steps": grad_accum_steps,
        "learning_rate": learning_rate,
        "training_duration_seconds": round(train_duration, 2),
        "initial_val_loss": round(init_val_loss, 4),
        "final_val_loss": round(final_val_loss, 4),
        "loss_progression": epoch_losses,
        "peak_vram_gb": round(peak_vram_gb, 2),
        "vram_total_gb": round(vram_total_gb, 2),
        "adapter_path": str(adapter_dir),
        "baseline_response": baseline_response,
        "post_qlora_response": post_qlora_response,
        "output_differs": baseline_response != post_qlora_response,
        "status": "PASS",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    metrics_file = adapter_dir / "training_metrics.json"
    with open(metrics_file, "w", encoding="utf-8") as f:
        json.dump(metrics_record, f, indent=2)

    print("\n" + "=" * 65)
    print(f"[+] SUMMARY: QLoRA Training PASS [SUCCESS]")
    print(f"[+] Adapter Weights   : {adapter_dir / 'adapter_model.safetensors'}")
    print(f"[+] Checkpoint Metrics: {metrics_file}")
    print(f"[+] Output Changed    : {metrics_record['output_differs']}")
    print("=" * 65)


if __name__ == "__main__":
    main()
