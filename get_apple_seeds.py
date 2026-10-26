import os
import json
import urllib.request
import urllib.parse
from PIL import Image
import io

BASE_DIR = os.path.join(os.path.dirname(__file__), 'seed_dataset', 'Apple')
os.makedirs(BASE_DIR, exist_ok=True)

# Fetch specifically apple seeds from Wikimedia Commons & open repositories
search_queries = [
    'apple seeds Malus',
    'apple seed grain'
]

saved = 0
for q in search_queries:
    url = f"https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrsearch={urllib.parse.quote(q)}&gsrlimit=20&prop=imageinfo&iiprop=url"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            for pid, pdata in pages.items():
                img_info = pdata.get('imageinfo', [])
                if not img_info:
                    continue
                img_url = img_info[0].get('url', '').split('?')[0]
                if not any(img_url.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png']):
                    continue
                try:
                    img_req = urllib.request.Request(img_url, headers={
                        'User-Agent': 'Mozilla/5.0',
                        'Referer': 'https://commons.wikimedia.org/'
                    })
                    with urllib.request.urlopen(img_req, timeout=10) as r:
                        im = Image.open(io.BytesIO(r.read())).convert('RGB').resize((128, 128))
                        save_p = os.path.join(BASE_DIR, f"Apple_{saved+1}.jpg")
                        im.save(save_p, 'JPEG')
                        saved += 1
                        print(f"Saved Apple seed: {save_p}")
                        if saved >= 12:
                            break
                except Exception:
                    continue
    except Exception as e:
        print("Query error:", e)
    if saved >= 12:
        break

print(f"Total Apple seeds collected: {saved}")

