import base64
import os
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Form, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
import uvicorn
from pathlib import Path
from typing import Optional

app = FastAPI()

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GROQ_API_KEY")
DOTNET_API = os.getenv("DOTNET_API_URL", "http://localhost:5245/api")

if not api_key:
    raise ValueError("Kritik Xəta: .env faylı tapılmadı və ya GROQ_API_KEY boşdur!")

client = Groq(api_key=api_key)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# YARDIMCI: .NET API-dən məhsul məlumatı al
# ==========================================

async def get_product_from_api(product_id: int) -> dict | None:
    try:
        async with httpx.AsyncClient() as client_http:
            response = await client_http.get(f"{DOTNET_API}/Product/{product_id}", timeout=5)
            if response.status_code == 200:
                return response.json()
    except Exception:
        pass
    return None

async def get_all_products_from_api() -> list:
    try:
        async with httpx.AsyncClient() as client_http:
            response = await client_http.get(f"{DOTNET_API}/Product", timeout=5)
            if response.status_code == 200:
                return response.json()
    except Exception:
        pass
    return []

# ==========================================
# YARDIMCI: Dil seçimi
# ==========================================

def get_language_instruction(lang: str) -> str:
    lang_map = {
        "az": "Azərbaycan dilində cavab ver.",
        "ru": "Отвечай на русском языке.",
        "en": "Respond in English."
    }
    return lang_map.get(lang, "Respond in English.")

# ==========================================
# 1. LUMA CHAT — Ümumi və məhsul sualları
# ==========================================

@app.post("/ask-luma")
async def ask_luma(
    message: str = Form(...),
    lang: str = Form("en"),
    product_id: Optional[int] = Form(None),
    conversation_history: Optional[str] = Form(None)
):
    try:
        # Məhsul kontekstini API-dən al
        product_context = ""
        if product_id:
            product = await get_product_from_api(product_id)
            if product:
                product_context = (
                    f"\n[MƏHSUL KONTEKSTİ: Müştəri hazırda '{product.get('name')}' məhsuluna baxır. "
                    f"Qiymət: {product.get('price')} AZN. "
                    f"Kateqoriya ID: {product.get('categoryId')}. "
                    f"Material: {product.get('material', 'məlumat yoxdur')}. "
                    f"Təsvir: {product.get('description', 'məlumat yoxdur')}. "
                    f"Stok: {product.get('stock')} ədəd.]"
                )

        lang_instruction = get_language_instruction(lang)

        system_prompt = (
    "Sən CozyLoops mağazasının köməkçisi LUMAsan. "
    "Azərbaycan dilində danışırsan — sadə, qısa, təbii. "
    "Sanki bir dost kimi danış. "
    "Heç vaxt link, html, url yaratma. "
    "Heç vaxt 'papak.html', 'custom.html' kimi şeylər yazma. "
    "Xüsusi sifariş üçün sadəcə de: 'LUMA səhifəsinə keç'. "
    "Sifariş izləmək üçün de: 'Sifarişlər səhifəsinə bax'. "
    "Cavabın maksimum 2-3 cümlə olsun. "
    "Məhsullar, rənglər, ölçülər, materiallar haqqında kömək et. "
    "Heç vaxt formatlaşdırma (*, #, ---) işlətmə. "
    f"{lang_instruction}"
    f"{product_context}"
)

        # Söhbət tarixini parse et
        messages = [{"role": "system", "content": system_prompt}]

        if conversation_history:
            import json
            try:
                history = json.loads(conversation_history)
                # Son 10 mesajı saxla (context window üçün)
                for msg in history[-10:]:
                    if msg.get("role") in ["user", "assistant"]:
                        messages.append({
                            "role": msg["role"],
                            "content": msg["content"]
                        })
            except Exception:
                pass

        messages.append({"role": "user", "content": message})

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )

        reply = completion.choices[0].message.content
        return {"reply": reply, "status": "success"}

    except Exception as e:
        return {"reply": f"Xəta baş verdi: {str(e)}", "status": "error"}


# ==========================================
# 2. LUMA CUSTOM ORDER — Şəkil analizi + sifariş
# ==========================================

@app.post("/analyze-order")
async def analyze_order(
    description: str = Form(...),
    material_pref: str = Form(None),
    size: str = Form(None),
    color: str = Form(None),
    lang: str = Form("en"),
    file: UploadFile = File(None)
):
    try:
        lang_instruction = get_language_instruction(lang)

        order_details = f"Müştəri sifarişi: {description}."
        if material_pref: order_details += f" Material: {material_pref}."
        if size:          order_details += f" Ölçü: {size}."
        if color:         order_details += f" Rəng: {color}."

        # Şəkil varsa Vision modeli istifadə et
        if file:
            contents = await file.read()
            base64_image = base64.b64encode(contents).decode('utf-8')

            response = client.chat.completions.create(
                model="llama-3.2-11b-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": (
                                    f"Sən CozyLoops-un xüsusi sifariş köməkçisi LUMAsan. "
                                    f"{order_details} "
                                    f"Bu şəkli analiz et və müştəriyə aşağıdakıları əhatə edən sifariş təklifi hazırla:\n"
                                    f"1. Məhsulun adı\n"
                                    f"2. Rəng paleti\n"
                                    f"3. Tövsiyə olunan material\n"
                                    f"4. Təxmini ölçü\n"
                                    f"5. Hazırlanma müddəti (gün)\n"
                                    f"6. Təxmini qiymət (AZN)\n"
                                    f"Cavabı dostcasına və aydın şəkildə yaz. {lang_instruction}"
                                )
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                            }
                        ]
                    }
                ],
                max_tokens=800
            )
            reply = response.choices[0].message.content

        # Şəkil yoxdursa text modeli
        else:
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            f"Sən CozyLoops-un xüsusi sifariş köməkçisi LUMAsan. "
                            f"Əl işi tikiş məhsulları üzrə ekspertisən. "
                            f"Müştərinin sifarişinə əsasən aşağıdakıları əhatə edən sifariş təklifi hazırla:\n"
                            f"1. Məhsulun adı\n"
                            f"2. Rəng paleti\n"
                            f"3. Tövsiyə olunan material\n"
                            f"4. Təxmini ölçü\n"
                            f"5. Hazırlanma müddəti (gün)\n"
                            f"6. Təxmini qiymət (AZN)\n"
                            f"Cavabı dostcasına və aydın şəkildə yaz. {lang_instruction}"
                        )
                    },
                    {"role": "user", "content": order_details}
                ],
                temperature=0.7,
                max_tokens=800
            )
            reply = completion.choices[0].message.content

        return {"reply": reply, "status": "success"}

    except Exception as e:
        return {"reply": f"Sifariş analizi xətası: {str(e)}", "status": "error"}


# ==========================================
# 3. MƏHSUL AXTARIŞI — LUMA üçün
# ==========================================

@app.get("/products-context")
async def get_products_context():
    """Frontend-ə bütün məhsulların qısa siyahısını qaytarır"""
    try:
        products = await get_all_products_from_api()
        simplified = [
            {
                "id": p.get("id"),
                "name": p.get("name"),
                "price": p.get("price"),
                "category": p.get("categoryId")
            }
            for p in products
        ]
        return {"products": simplified, "status": "success"}
    except Exception as e:
        return {"products": [], "status": "error", "message": str(e)}


# ==========================================
# 4. HEALTH CHECK
# ==========================================

@app.get("/health")
async def health():
    return {"status": "LUMA is running", "version": "2.0"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)