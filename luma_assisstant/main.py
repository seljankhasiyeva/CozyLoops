import io
import os
from dotenv import load_dotenv
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import main

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

LUMA_SYSTEM_PROMPT = """
You are Luma, the friendly AI assistant for CozyLoops —
a handmade crochet shop based in Baku, Azerbaijan.
You help customers with questions about products,
materials, sizing, and custom orders.
Always be warm, helpful, and concise.
Respond in the same language the customer uses.
"""

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction=LUMA_SYSTEM_PROMPT
)

app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SHOP_INFO = "Luma Assistant is currently in Simulation Mode. Ready to connect to Gemini API."

@app.post("/chat")
async def chat_endpoint(message: str = Form(...)):
    try:
        chat = model.start_chat()
        response = chat.send_message(message)
        return {"reply": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@app.post("/generate-order")
async def order_endpoint(description: str = Form(...), image: UploadFile = File(None)):
    has_image = "an image" if image else "no image"
    analysis_result = (f"Luma is analyzing your request about: {description}. Image status: {has_image}")
    return {"analysis": analysis_result}

if __name__=="__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    