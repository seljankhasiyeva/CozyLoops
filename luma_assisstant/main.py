import base64
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Form, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import uvicorn
from pathlib import Path

app = FastAPI()

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("Kritik Xəta: .env faylı tapılmadı və ya GROQ_API_KEY boşdur!")

client = Groq(api_key=api_key)

# Enable CORS for frontend connectivity
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. PRODUCT DATABASE (Mock data for Luna to reference)
products_db = {
    "CL-FOX": {
        "name": "Blue Fox Amigurumi",
        "material": "100% Cotton yarn, hypoallergenic fiberfill",
        "size": "18 cm",
        "price": "35 AZN",
        "description": "Handcrafted, washable toy safe for newborns."
    },
    "CL-BLANKET": {
        "name": "Chunky Wool Blanket",
        "material": "Premium Merino Wool",
        "size": "200x220 cm",
        "price": "120 AZN",
        "description": "Ultra-soft, warm, and luxurious handmade blanket."
    }
}

# 2. GENERAL CHAT & PRODUCT INQUIRY ENDPOINT
@app.post("/ask-luna")
async def ask_luna(message: str = Form(...), product_code: str = Form(None)):
    try:
        # Inject product context if a product code is provided
        context = ""
        if product_code and product_code in products_db:
            p = products_db[product_code]
            context = f"\n[CONTEXT: The customer is viewing {p['name']}. Details: {p['material']}, Size: {p['size']}, Price: {p['price']}. Info: {p['description']}]"

        system_instruction = (
            "You are Luna, the official AI assistant for CozyLoops. You are friendly, creative, and helpful. "
            "Your goal is to assist customers with crochet products, materials, and custom orders. "
            "Please respond in English. Use the provided product context to give specific details if asked." + context
        )

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": message}
            ],
            temperature=0.7
        )
        return {"reply": completion.choices[0].message.content}
    except Exception as e:
        return {"reply": f"System Error: {str(e)}"}

# 3. CUSTOM ORDER & IMAGE ANALYSIS (VISION)
@app.post("/analyze-order")
async def analyze_order(
    description: str = Form(...), 
    material_pref: str = Form(None),
    file: UploadFile = File(None)
):
    try:
        # If an image is uploaded for reference
        if file:
            contents = await file.read()
            base64_image = base64.b64encode(contents).decode('utf-8')
            
            # Request to Vision Model
            response = client.chat.completions.create(
                model="llama-3.2-11b-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text", 
                                "text": f"Customer Request: {description}. Material Preference: {material_pref}. "
                                        f"Analyze this image and provide a technical order summary for the artisan "
                                        f"(Color palette, crochet style, estimated difficulty)."
                            },
                            {
                                "type": "image_url", 
                                "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                            }
                        ]
                    }
                ]
            )
            return {"reply": response.choices[0].message.content}
        
        # Text-only analysis if no image is provided
        else:
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": "You are a crochet expert. Create a custom order summary based on the description."},
                    {"role": "user", "content": f"Description: {description}, Material: {material_pref}"}
                ]
            )
            return {"reply": completion.choices[0].message.content}

    except Exception as e:
        return {"reply": f"Order Analysis Error: {str(e)}"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)