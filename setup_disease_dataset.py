import os
import shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DISEASE_DIR = os.path.join(BASE_DIR, 'disease_dataset')
DATASET1_DIR = os.path.join(BASE_DIR, 'dataset1')

CLASSES = [
    'Apple___Apple_scab',
    'Apple___Black_rot',
    'Apple___Cedar_apple_rust',
    'Apple___healthy',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
    'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight',
    'Corn_(maize)___healthy',
    'Peach___Bacterial_spot',
    'Peach___healthy',
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___healthy',
    'Tomato___Bacterial_spot',
    'Tomato___Early_blight',
    'Tomato___Late_blight',
    'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite',
    'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy'
]

# Create all class folders
for cls in CLASSES:
    os.makedirs(os.path.join(DISEASE_DIR, cls), exist_ok=True)

# Map sample files from dataset1 if present
prefix_map = {
    'AppleCedarRust': 'Apple___Cedar_apple_rust',
    'AppleScab': 'Apple___Apple_scab',
    'CornCommonRust': 'Corn_(maize)___Common_rust_',
    'PotatoEarlyBlight': 'Potato___Early_blight',
    'PotatoHealthy': 'Potato___healthy',
    'TomatoEarlyBlight': 'Tomato___Early_blight',
    'TomatoHealthy': 'Tomato___healthy',
    'TomatoYellowCurlVirus': 'Tomato___Tomato_Yellow_Leaf_Curl_Virus'
}

copied_count = 0
if os.path.exists(DATASET1_DIR):
    for fname in os.listdir(DATASET1_DIR):
        src_path = os.path.join(DATASET1_DIR, fname)
        if not os.path.isfile(src_path):
            continue
        for prefix, target_cls in prefix_map.items():
            if fname.startswith(prefix):
                dest_path = os.path.join(DISEASE_DIR, target_cls, fname)
                shutil.copy2(src_path, dest_path)
                copied_count += 1
                break

print(f"Created {len(CLASSES)} class folders in disease_dataset/")
print(f"Populated {copied_count} existing sample images from dataset1 into disease_dataset/")

