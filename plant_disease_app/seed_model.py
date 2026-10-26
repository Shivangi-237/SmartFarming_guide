import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'seed_model.h5')
model = load_model(MODEL_PATH, compile=False)

# Warm up model graph during server boot so user requests are fast
try:
    _ = model(np.zeros((1, 128, 128, 3), dtype=np.float32), training=False)
except Exception as _e:
    pass

seed_classes = ['Apple', 'Corn', 'Pomegranate', 'Rice', 'Soybean', 'Sunflower', 'Wheat']

seed_details = {
    'Apple': {
        'scientific': 'Malus domestica',
        'planting_en': 'Seeds require cold stratification (60-90 days in cold/moist conditions) before germination. Plant in well-drained loamy soil with pH 6.0-7.0 in full sunlight.',
        'planting_hi': 'अंकुरण से पहले बीजों को 60-90 दिनों तक शीत स्तरीकरण (ठंडी/नम स्थिति) की आवश्यकता होती है। 6.0-7.0 पीएच वाली अच्छी जल निकासी वाली दोमट मिट्टी और भरपूर धूप में लगाएं।'
    },
    'Pomegranate': {
        'scientific': 'Punica granatum',
        'planting_en': 'Sow fresh seeds in fertile, well-draining sandy loam soil with pH 5.5-7.2. Keep warm (20-25°C) and moist under direct sunlight. Sensitive to water stagnation.',
        'planting_hi': 'पीएच 5.5-7.2 वाली उपजाऊ, अच्छी जल निकासी वाली रेतीली दोमट मिट्टी में ताजे बीज बोएं। 20-25°C गर्म वातावरण और पूरी धूप में रखें। जलभराव से बचाएं।'
    },
    'Wheat': {
        'scientific': 'Triticum aestivum',
        'planting_en': 'Best planted in cool autumn/winter seasons. Requires well-drained loamy soil with pH 6.0-7.5. Needs moderate irrigation during crown root initiation.',
        'planting_hi': 'ठंड के मौसम (रबी) में लगाना सबसे अच्छा है। पीएच 6.0-7.5 के साथ अच्छी जल निकासी वाली दोमट मिट्टी की आवश्यकता होती है। ताज जड़ निर्माण के दौरान मध्यम सिंचाई दें।'
    },
    'Rice': {
        'scientific': 'Oryza sativa',
        'planting_en': 'Thrives in warm, humid weather. Clayey or loamy soil capable of holding water is ideal. pH range 5.5-6.5. Requires standing water in early growth stages.',
        'planting_hi': 'गर्म और आर्द्र मौसम में अच्छा पनपता है। जल धारण करने में सक्षम चिकनी या दोमट मिट्टी आदर्श है। पीएच 5.5-6.5। शुरुआती विकास में जलभराव की आवश्यकता होती है।'
    },
    'Corn': {
        'scientific': 'Zea mays',
        'planting_en': 'Best planted in spring and warm summer. Needs fertile, deep, well-draining soil with pH 5.8-7.0. Sensitive to waterlogging.',
        'planting_hi': 'वसंत और गर्म मौसम में लगाना उत्तम है। उपजाऊ, गहरी और अच्छी जल निकासी वाली मिट्टी (पीएच 5.8-7.0) की आवश्यकता होती है। जलभराव से बचाएं।'
    },
    'Soybean': {
        'scientific': 'Glycine max',
        'planting_en': 'Kharif crop planted with onset of monsoon. Prefers rich organic loam with pH 6.0-6.8. Excellent nitrogen-fixing legume for crop rotation.',
        'planting_hi': 'मानसून की शुरुआत में बोई जाने वाली खरीफ फसल। 6.0-6.8 पीएच वाली जैविक दोमट मिट्टी पसंद करती है। फसल चक्र के लिए उत्कृष्ट नाइट्रोजन-फिक्सिंग फसल है।'
    },
    'Sunflower': {
        'scientific': 'Helianthus annuus',
        'planting_en': 'Highly adaptable to varying climates. Requires well-drained fertile soil with pH 6.5-7.5 and full sunlight exposure for seed formation.',
        'planting_hi': 'विभिन्न जलवायु में अनुकूलनीय। 6.5-7.5 पीएच वाली उपजाऊ मिट्टी और भरपूर धूप की आवश्यकता होती है ताकि बीजों का अच्छा भराव हो सके।'
    }
}

CONFIDENCE_THRESHOLD = 50.0  # Seeds with confidence below 50% are flagged as unrecognized/unsupported

def predict_seed(image_path):
    img = tf.keras.preprocessing.image.load_img(image_path, target_size=(128, 128))
    arr = tf.keras.preprocessing.image.img_to_array(img) / 255.0
    arr = np.expand_dims(arr, axis=0)
    preds = model(arr, training=False).numpy()
    idx = int(np.argmax(preds[0]))
    confidence = float(round(float(preds[0][idx]) * 100, 2))
    name = seed_classes[idx]
    
    is_recognized = bool(confidence >= CONFIDENCE_THRESHOLD)
    
    base_info = seed_details.get(name, {
        'scientific': name,
        'planting_en': 'Plant in well-prepared fertile soil with proper irrigation.',
        'planting_hi': 'उचित सिंचाई के साथ अच्छी तरह से तैयार उपजाऊ मिट्टी में लगाएं।'
    })
    
    info = dict(base_info)
    info['is_recognized'] = is_recognized
    
    return name, confidence, info

