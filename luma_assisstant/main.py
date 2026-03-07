import base64
import os
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import uvicorn
from pathlib import Path
from typing import Optional
import json

app = FastAPI()

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GROQ_API_KEY")
DOTNET_API = os.getenv("DOTNET_API_URL", "http://localhost:5245/api")

if not api_key:
    raise ValueError("GROQ_API_KEY not found in .env file!")

client = Groq(api_key=api_key)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# HELPER: Fetch product from .NET API
# ==========================================

async def get_product(product_id: int) -> dict | None:
    try:
        async with httpx.AsyncClient() as c:
            r = await c.get(f"{DOTNET_API}/Product/{product_id}", timeout=5)
            if r.status_code == 200:
                return r.json()
    except Exception:
        pass
    return None

# ==========================================
# 1. LUMA CHAT
# ==========================================

@app.post("/ask-luma")
async def ask_luma(
    message: str = Form(...),
    product_id: Optional[int] = Form(None),
    conversation_history: Optional[str] = Form(None)
):
    try:
        product_context = ""
        if product_id:
            product = await get_product(product_id)
            if product:
                product_context = (
                    f"\n[PRODUCT CONTEXT: Customer is viewing '{product.get('name')}'. "
                    f"Price: {product.get('price')} AZN. "
                    f"Material: {product.get('material', 'not specified')}. "
                    f"Description: {product.get('description', 'not specified')}. "
                    f"Stock: {product.get('stock')} units.]"
                )

        system_prompt = (
            "You are LUMA, a friendly assistant for CozyLoops, a handmade crochet shop in Azerbaijan. "
            "CozyLoops sells amigurumi toys, cardigans, socks, scarves, hats, mittens and more — all handmade. "
            "STRICT RULES: "
            "1. Keep responses to 1-2 short sentences only. "
            "2. Never repeat information the customer already knows. "
            "3. Never calculate prices or totals for the customer. "
            "4. If customer wants to buy something, say: 'Just hit the Add to Cart button on the page!' "
            "5. Never mention URLs, file names, or page names like cart.html or checklist.html. "
            "6. To check orders, say: 'Check your orders in the Checklist page.' "
            "7. Be warm, natural and concise — like a real shop assistant talking to a friend. "
            "8. Never introduce yourself unless directly asked. "
            f"{product_context}"
        )

        messages = [{"role": "system", "content": system_prompt}]

        if conversation_history:
            try:
                history = json.loads(conversation_history)
                for msg in history[-10:]:
                    if msg.get("role") in ["user", "assistant"]:
                        messages.append({"role": msg["role"], "content": msg["content"]})
            except Exception:
                pass

        messages.append({"role": "user", "content": message})

        completion = client.chat.completions.create(
            model="gemma2-9b-it",
            messages=messages,
            temperature=0.6,
            max_tokens=150
        )

        reply = completion.choices[0].message.content.strip()
        return {"reply": reply, "status": "success"}

    except Exception as e:
        return {"reply": f"Something went wrong: {str(e)}", "status": "error"}


# ==========================================
# 2. ANALYZE ORDER (image + text)
# ==========================================

@app.post("/analyze-order")
async def analyze_order(
    description: str = Form(...),
    material_pref: str = Form(None),
    size: str = Form(None),
    color: str = Form(None),
    file: UploadFile = File(None)
):
    try:
        order_details = f"Customer request: {description}."
        if material_pref: order_details += f" Material preference: {material_pref}."
        if size:          order_details += f" Size: {size}."
        if color:         order_details += f" Color: {color}."

        if file:
            contents = await file.read()
            base64_image = base64.b64encode(contents).decode('utf-8')

            response = client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": (
                                    f"You are LUMA, a custom order assistant for CozyLoops crochet shop. "
                                    f"{order_details} "
                                    f"Analyze this reference image and create a friendly order summary including: "
                                    f"1. Product name, 2. Color palette, 3. Recommended material, "
                                    f"4. Estimated size, 5. Production time (days), 6. Estimated price (AZN)."
                                )
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                            }
                        ]
                    }
                ],
                max_tokens=600
            )
            reply = response.choices[0].message.content.strip()

        else:
            completion = client.chat.completions.create(
                model="gemma2-9b-it",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are LUMA, a custom order assistant for CozyLoops crochet shop. "
                            "Based on the customer's request, create a friendly order summary including: "
                            "1. Product name, 2. Color palette, 3. Recommended material, "
                            "4. Estimated size, 5. Production time (days), 6. Estimated price (AZN). "
                            "Be warm and concise."
                        )
                    },
                    {"role": "user", "content": order_details}
                ],
                temperature=0.7,
                max_tokens=600
            )
            reply = completion.choices[0].message.content.strip()

        return {"reply": reply, "status": "success"}

    except Exception as e:
        return {"reply": f"Order analysis error: {str(e)}", "status": "error"}


# ==========================================
# 3. HEALTH CHECK
# ==========================================

@app.get("/health")
async def health():
    return {"status": "LUMA is running", "version": "2.0"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)