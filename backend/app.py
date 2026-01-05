from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import os

app = FastAPI(title="SmartTask AI Local Model")

MODEL_PATH = "models/flan_t5_large_local_trained"

print(f"⏳ Loading FLAN-T5 model from: {MODEL_PATH}")

if not os.path.exists(MODEL_PATH):
    raise RuntimeError("❌ Trained model directory not found!")

# Load tokenizer + model
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, local_files_only=True)
model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_PATH,
    local_files_only=True
)
model.eval()

print("✅ FLAN-T5 model loaded successfully!")


# ------------ Request Schema --------------
class PromptRequest(BaseModel):
    prompt: str
    max_length: int = 150   # safe default


# ------------ Local Model Endpoint --------------
@app.post("/suggest")
async def suggest(req: PromptRequest):

    prompt = req.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    try:
        inputs = tokenizer(prompt, return_tensors="pt")

        # 🔥 FIXED GENERATION SETTINGS (no hallucinations)
        outputs = model.generate(
            **inputs,
            max_new_tokens=min(req.max_length, 200),
            num_beams=4,                # stable + high quality
            early_stopping=True,
            no_repeat_ngram_size=3      # prevent duplicates
        )

        # Decode cleanly
        text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        text = (
            text.replace("<pad>", "")
                .replace("</s>", "")
                .strip()
        )

        # Return single clean suggestion
        return {"suggestions": [text]}

    except Exception as e:
        print("❌ Model error:", e)
        raise HTTPException(status_code=500, detail="Model inference error.")
