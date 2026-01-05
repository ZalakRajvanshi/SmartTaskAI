# train_local_model.py

from pathlib import Path
import json
import os
import sys
import gc
import random

import torch
from torch.utils.data import Dataset

from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    Trainer,
    TrainingArguments,
    DataCollatorForSeq2Seq,
    set_seed,
)

print("\n=== LOCAL FLAN-T5-LARGE TRAINING SCRIPT (SMARTTASK, >500 SAMPLES) ===\n")

# ----------------------------------------------------
# 1️⃣ Paths & basic setup
# ----------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent

# Your actual structure:
# backend/models/
#   - train_local_model.py
#   - flan_t5_large_local/
#   - smarttask_dataset.jsonl
MODEL_DIR = (BASE_DIR / "flan_t5_large_local").as_posix()
OUTPUT_DIR = (BASE_DIR / "flan_t5_large_local_trained").as_posix()
DATASET_PATH = BASE_DIR / "smarttask_dataset.jsonl"

print(f"📁 Base model dir:      {MODEL_DIR}")
print(f"📁 Dataset file:        {DATASET_PATH}")
print(f"📁 Output (trained):    {OUTPUT_DIR}\n")

if not os.path.exists(MODEL_DIR):
    raise FileNotFoundError(f"Model directory not found: {MODEL_DIR}")

if not DATASET_PATH.exists():
    raise FileNotFoundError(f"Dataset file not found: {DATASET_PATH}")

# Reproducibility
set_seed(42)
random.seed(42)

# ----------------------------------------------------
# 2️⃣ Load tokenizer & model
# ----------------------------------------------------
print("🧠 Loading tokenizer & base model...\n")

tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR, local_files_only=True)

if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

# Device selection
if torch.cuda.is_available():
    device = torch.device("cuda")
elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
    device = torch.device("mps")
else:
    device = torch.device("cpu")

print(f"📌 Using device: {device}\n")

model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_DIR,
    local_files_only=True,
)

model.config.use_cache = False

if hasattr(model, "gradient_checkpointing_enable"):
    model.gradient_checkpointing_enable()

model.to(device)

print("✅ Base model loaded.\n")

# ----------------------------------------------------
# 3️⃣ Load all samples from JSONL and split
# ----------------------------------------------------
def load_smarttask_samples(jsonl_path):
    samples = []
    try:
        with open(jsonl_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue

                inp = obj.get("input_text")
                tgt = obj.get("target_text")

                if not inp or not tgt:
                    continue

                samples.append({
                    "input_text": inp,
                    "target_text": tgt,
                })
    except IOError as e:
        raise IOError(f"Failed to read dataset: {e}")

    if not samples:
        raise ValueError("No valid samples found in dataset!")

    return samples

print("📚 Loading SmartTask dataset...\n")
all_samples = load_smarttask_samples(DATASET_PATH)
print(f"📊 Total samples loaded: {len(all_samples)}")

# Shuffle and split 90% train / 10% val
random.shuffle(all_samples)
split_idx = int(0.9 * len(all_samples))
train_samples = all_samples[:split_idx]
val_samples = all_samples[split_idx:]

print(f"🔹 Train samples: {len(train_samples)}")
print(f"🔹 Val samples:   {len(val_samples)}\n")

# ----------------------------------------------------
# 4️⃣ Dataset class
# ----------------------------------------------------
class SmartTaskDataset(Dataset):
    def __init__(
        self,
        samples,
        tokenizer,
        max_input_length=160,
        max_target_length=160,
    ):
        self.samples = samples
        self.tokenizer = tokenizer
        self.max_input_length = max_input_length
        self.max_target_length = max_target_length

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        item = self.samples[idx]

        input_enc = self.tokenizer(
            item["input_text"],
            max_length=self.max_input_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )

        target_enc = self.tokenizer(
            item["target_text"],
            max_length=self.max_target_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )

        input_ids = input_enc.input_ids.squeeze()
        attention_mask = input_enc.attention_mask.squeeze()
        labels = target_enc.input_ids.squeeze()

        labels[labels == self.tokenizer.pad_token_id] = -100

        return {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "labels": labels,
        }

print("📦 Building PyTorch datasets...\n")
train_dataset = SmartTaskDataset(train_samples, tokenizer)
eval_dataset = SmartTaskDataset(val_samples, tokenizer)

data_collator = DataCollatorForSeq2Seq(
    tokenizer=tokenizer,
    model=model,
    padding="longest",
)

# ----------------------------------------------------
# 5️⃣ TrainingArguments (compatible & CPU-friendly)
# ----------------------------------------------------
print("⚙️ Setting training arguments...\n")

training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=6,                  # 6 epochs over your ~600 train samples
    per_device_train_batch_size=2,       # small batch for 8GB RAM
    per_device_eval_batch_size=2,
    gradient_accumulation_steps=8,       # effective batch size = 16
    learning_rate=4e-4,
    weight_decay=0.01,

    logging_steps=20,                    # log every 20 steps
    save_steps=200,                      # save every 200 steps
    save_total_limit=1,                  # keep only the last checkpoint

    remove_unused_columns=True,
    save_safetensors=False,              # important for your environment
    fp16=False,                          # CPU, no mixed precision
)

# ----------------------------------------------------
# 6️⃣ Trainer
# ----------------------------------------------------
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    data_collator=data_collator,
)

# ----------------------------------------------------
# 7️⃣ TRAIN MODEL
# ----------------------------------------------------
print("🚀 Training started...\n")
try:
    train_result = trainer.train()
    print("\n✅ TRAINING FINISHED!")
    
    if hasattr(train_result, 'metrics') and train_result.metrics:
        print("📉 Final training metrics:", train_result.metrics)
    
    eval_metrics = trainer.evaluate()
    print("📊 Final eval metrics:", eval_metrics)
except Exception as e:
    print(f"❌ Training failed: {e}")
    raise

# ----------------------------------------------------
# 8️⃣ Save trained model
# ----------------------------------------------------
print("\n💾 Saving fine-tuned model...")

gc.collect()
if torch.cuda.is_available():
    torch.cuda.empty_cache()

output_path = Path(OUTPUT_DIR).resolve()
os.makedirs(output_path, exist_ok=True)

try:
    model.save_pretrained(output_path, safe_serialization=False)
    tokenizer.save_pretrained(output_path)
    print(f"✅ Saved fine-tuned model to: {output_path}\n")
except Exception as e:
    print(f"❌ Failed to save model: {e}")
    raise

# ----------------------------------------------------
# 9️⃣ Quick test generation
# ----------------------------------------------------
print("🧪 Running a quick test generation...")

test_prompt = "Help me plan a focused, realistic day with breaks."

inputs = tokenizer(test_prompt, return_tensors="pt")
inputs = {k: v.to(device) for k, v in inputs.items()}

model.eval()
with torch.no_grad():
    try:
        output_ids = model.generate(
            **inputs,
            max_new_tokens=80,
            num_beams=4,
            do_sample=False,
        )
        print("\n🤖 Test Output:\n")
        print(tokenizer.decode(output_ids[0], skip_special_tokens=True))
    except Exception as e:
        print(f"❌ Test generation failed: {e}")

# ----------------------------------------------------
# 🔟 Interactive mode
# ----------------------------------------------------
print("\n=== INTERACTIVE MODE ===")
print("Type 'exit' to quit.\n")

while True:
    try:
        user_input = input("\n👉 Enter text (or 'exit'): ")
        if user_input.lower().strip() == "exit":
            print("👋 Bye!")
            break

        enc = tokenizer(user_input, return_tensors="pt")
        enc = {k: v.to(device) for k, v in enc.items()}

        with torch.no_grad():
            out = model.generate(
                **enc,
                max_new_tokens=80,
                num_beams=4,
                do_sample=False,
            )

        print("\n🤖", tokenizer.decode(out[0], skip_special_tokens=True))
    except KeyboardInterrupt:
        print("\n👋 Bye!")
        break
    except Exception as e:
        print(f"❌ Generation error: {e}")
