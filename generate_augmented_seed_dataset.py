import os
from PIL import Image, ImageEnhance, ImageFilter

SOURCE_DIR = os.path.join(os.path.dirname(__file__), 'seed_dataset')
TARGET_DIR = os.path.join(os.path.dirname(__file__), 'seed_dataset_augmented')
os.makedirs(TARGET_DIR, exist_ok=True)

classes = [d for d in os.listdir(SOURCE_DIR) if os.path.isdir(os.path.join(SOURCE_DIR, d))]
print(f"[INFO] Augmenting dataset for classes: {classes}")

total_generated = 0

for cls in classes:
    src_cls_dir = os.path.join(SOURCE_DIR, cls)
    tgt_cls_dir = os.path.join(TARGET_DIR, cls)
    os.makedirs(tgt_cls_dir, exist_ok=True)
    
    files = [f for f in os.listdir(src_cls_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    print(f"\nProcessing {cls}: {len(files)} source images...")
    
    count = 0
    for idx, fname in enumerate(files):
        img_path = os.path.join(src_cls_dir, fname)
        try:
            with Image.open(img_path) as im:
                im = im.convert('RGB').resize((128, 128))
                
                # 0. Original
                im.save(os.path.join(tgt_cls_dir, f"{cls}_orig_{idx}.jpg"), 'JPEG')
                count += 1
                
                # 1. Rotations
                im.rotate(90).save(os.path.join(tgt_cls_dir, f"{cls}_r90_{idx}.jpg"), 'JPEG')
                im.rotate(180).save(os.path.join(tgt_cls_dir, f"{cls}_r180_{idx}.jpg"), 'JPEG')
                im.rotate(270).save(os.path.join(tgt_cls_dir, f"{cls}_r270_{idx}.jpg"), 'JPEG')
                count += 3
                
                # 2. Flips
                im.transpose(Image.FLIP_LEFT_RIGHT).save(os.path.join(tgt_cls_dir, f"{cls}_flr_{idx}.jpg"), 'JPEG')
                im.transpose(Image.FLIP_TOP_BOTTOM).save(os.path.join(tgt_cls_dir, f"{cls}_ftb_{idx}.jpg"), 'JPEG')
                count += 2
                
                # 3. Brightness variations
                ImageEnhance.Brightness(im).enhance(1.25).save(os.path.join(tgt_cls_dir, f"{cls}_brt_hi_{idx}.jpg"), 'JPEG')
                ImageEnhance.Brightness(im).enhance(0.80).save(os.path.join(tgt_cls_dir, f"{cls}_brt_lo_{idx}.jpg"), 'JPEG')
                count += 2
                
                # 4. Contrast variations
                ImageEnhance.Contrast(im).enhance(1.30).save(os.path.join(tgt_cls_dir, f"{cls}_cnt_hi_{idx}.jpg"), 'JPEG')
                ImageEnhance.Contrast(im).enhance(0.80).save(os.path.join(tgt_cls_dir, f"{cls}_cnt_lo_{idx}.jpg"), 'JPEG')
                count += 2
                
                # 5. Zoom crop (central 85%)
                w, h = im.size
                crop_box = (int(w * 0.08), int(h * 0.08), int(w * 0.92), int(h * 0.92))
                im.crop(crop_box).resize((128, 128)).save(os.path.join(tgt_cls_dir, f"{cls}_zoom_{idx}.jpg"), 'JPEG')
                count += 1
                
                # 6. Sharpness filter
                ImageEnhance.Sharpness(im).enhance(1.8).save(os.path.join(tgt_cls_dir, f"{cls}_sharp_{idx}.jpg"), 'JPEG')
                count += 1
        except Exception as e:
            print(f"Error on {fname}:", e)
            
    print(f"-> Total in {cls}: {count} images created.")
    total_generated += count

print(f"\n[SUCCESS] Augmented dataset ready with {total_generated} high-resolution images!")
