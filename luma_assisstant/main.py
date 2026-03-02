import io
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SHOP_INFO = "Luma Assistant is currently in Simulation Mode. Ready to connect to Gemini API."

@app.post("/chat")
async def chat_endpoint(message: str=Form(...)):
    simulated_reply=f"Hello! I am Luma. You asked: '{message}'. I am currently in setup mode, but soon I will answer all your questions!"
    return {"reply": simulated_reply}

@app.post("/generate-order")
async def order_endpoint(description: str=Form(...), image: UploadFile=File(None)):
    has_image="an image" if image else "no image"
    analysis_result=(f"Luma is analyzing your request about: {description}. Image status: {has_image}")
    return {"analysis": analysis_result}
if __name__=="__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    