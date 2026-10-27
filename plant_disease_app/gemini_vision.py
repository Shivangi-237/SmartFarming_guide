import os
import base64
import json
import requests

# Gemini API configuration for AI vision intelligence
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyBuMhsp3iq1YPahvXM7nGkHWF78B4sBks8')
MODELS_TO_TRY = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash']

SUPPORTED_SEEDS = ['Apple', 'Corn', 'Pomegranate', 'Rice', 'Soybean', 'Sunflower', 'Wheat']

SUPPORTED_DISEASES = [
    'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy',
    'Peach___Bacterial_spot', 'Peach___healthy',
    'Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy',
    'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight',
    'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites Two-spotted_spider_mite',
    'Tomato___Target_Spot', 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy'
]

def clean_json_response(raw_text):
    text = raw_text.strip()
    if text.startswith('```'):
        text = text.split('\n', 1)[-1].rsplit('```', 1)[0].strip()
    return json.loads(text)

def identify_seed_with_gemini(image_path):
    if not GEMINI_API_KEY:
        return None
    try:
        with open(image_path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')
        
        prompt = (
            "You are an expert agronomist specializing in crop seed identification. "
            "Identify the crop seed shown in this image. "
            f"The supported crops are: {', '.join(SUPPORTED_SEEDS)}. "
            "If the image clearly represents one of these 7 crop seeds, identify it accurately with confidence >= 85. "
            "If the image is not a seed or does not match any of these 7 supported crops, set is_recognized to false. "
            "Respond ONLY with a valid JSON object matching this structure: "
            "{\n"
            '  "seed": "Wheat",\n'
            '  "confidence": 95.4,\n'
            '  "scientific": "Triticum aestivum",\n'
            '  "is_recognized": true,\n'
            '  "planting_en": "Best planted in cool seasons with well-drained loamy soil (pH 6.0-7.5). Ensure moderate irrigation.",\n'
            '  "planting_hi": "अच्छी जल निकासी वाली दोमट मिट्टी (पीएच 6.0-7.5) में ठंड के मौसम (रबी) में लगाएं। उचित सिंचाई सुनिश्चित करें।"\n'
            "}"
        )
        
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": "image/jpeg", "data": b64}}
                ]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 400
            }
        }
        
        for model_name in MODELS_TO_TRY:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
            try:
                res = requests.post(url, json=payload, timeout=12)
                if res.status_code == 200:
                    data = res.json()
                    raw_text = data['candidates'][0]['content']['parts'][0]['text']
                    parsed = clean_json_response(raw_text)
                    if 'seed' in parsed and 'confidence' in parsed:
                        return parsed
            except Exception:
                continue
    except Exception as e:
        print("[INFO] Gemini seed vision fallback to local model:", str(e).encode('ascii', 'ignore').decode('ascii'))
    return None

def identify_disease_with_gemini(image_path):
    if not GEMINI_API_KEY:
        return None
    try:
        with open(image_path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')
        
        prompt = (
            "You are an expert plant pathologist. Analyze this plant leaf image to identify the crop and disease. "
            f"Select the single closest match from this exact list of classes: {SUPPORTED_DISEASES}. "
            "Respond ONLY with a valid JSON object matching this structure: "
            "{\n"
            '  "prediction": "Tomato___Early_blight",\n'
            '  "confidence": 94.2\n'
            "}"
        )
        
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": "image/jpeg", "data": b64}}
                ]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 150
            }
        }
        
        for model_name in MODELS_TO_TRY:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
            try:
                res = requests.post(url, json=payload, timeout=12)
                if res.status_code == 200:
                    data = res.json()
                    raw_text = data['candidates'][0]['content']['parts'][0]['text']
                    parsed = clean_json_response(raw_text)
                    pred = parsed.get('prediction')
                    if pred and pred in SUPPORTED_DISEASES:
                        return pred, float(parsed.get('confidence', 92.0))
            except Exception:
                continue
    except Exception as e:
        print("[INFO] Gemini disease vision fallback to local model:", str(e).encode('ascii', 'ignore').decode('ascii'))
    return None
