import os
import json
import urllib.request
import urllib.parse
from PIL import Image
import io

BASE_DIR = os.path.join(os.path.dirname(__file__), 'seed_dataset')

queries_map = {
    'Corn': ['corn kernels grain', 'maize seeds agriculture', 'yellow corn seed grain'],
    'Sunflower': ['sunflower seeds grain', 'Helianthus annuus seeds', 'striped sunflower seed'],
    'Wheat': ['wheat grain seeds', 'Triticum aestivum grain', 'wheat seeds agriculture'],
    'Rice': ['paddy rice seeds grain', 'Oryza sativa grain seed', 'rice seeds agriculture'],
    'Soybean': ['soybean seeds grain', 'Glycine max seeds', 'dry soybean grains'],
    'Apple': ['apple seeds fruit Malus', 'apple seed pip', 'cut apple with seeds'],
    'Pomegranate': ['pomegranate seeds Punica', 'dry pomegranate seeds anardana', 'fresh pomegranate seed aril']
}

for class_name, queries in queries_map.items():
    target_dir = os.path.join(BASE_DIR, class_name)
    os.makedirs(target_dir, exist_ok=True)
    existing_count = len([f for f in os.listdir(target_dir) if f.endswith(('.jpg', '.jpeg', '.png'))])
    saved = 0
    target_to_add = 15

    print(f"\n[INFO] Expanding dataset for {class_name} (currently {existing_count} images)...")

    for q in queries:
        if saved >= target_to_add:
            break
        url = f"https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch={urllib.parse.quote(q)}&gsrlimit=15&prop=imageinfo&iiprop=url"
        req = urllib.request.Request(url, headers={'User-Agent': 'SmartFarmingBot/1.0 (educational research)'})
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                pages = data.get('query', {}).get('pages', {})
                for pid, pdata in pages.items():
                    if saved >= target_to_add:
                        break
                    img_info = pdata.get('imageinfo', [])
                    if not img_info:
                        continue
                    img_url = img_info[0].get('url', '').split('?')[0]
                    if not any(img_url.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png']):
                        continue
                    try:
                        img_req = urllib.request.Request(img_url, headers={
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                            'Referer': 'https://commons.wikimedia.org/'
                        })
                        with urllib.request.urlopen(img_req, timeout=10) as r:
                            im = Image.open(io.BytesIO(r.read())).convert('RGB').resize((128, 128))
                            save_path = os.path.join(target_dir, f"{class_name}_extra_{saved+1}.jpg")
                            im.save(save_path, 'JPEG')
                            saved += 1
                            print(f"  + Saved {class_name} image {saved}: {save_path}")
                    except Exception:
                        continue
        except Exception as e:
            print(f"  Query error for {q}:", e)

    print(f"[DONE] Added {saved} new images to {class_name}.")

print("\n[ALL DONE] Dataset successfully expanded!")
