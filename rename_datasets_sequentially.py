import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SEED_DIR = os.path.join(BASE_DIR, 'seed_dataset')
DISEASE_DIR = os.path.join(BASE_DIR, 'disease_dataset')

def rename_folder_images(folder_path, prefix, extension='.jpg'):
    files = [f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))]
    
    # Filter valid image files
    img_files = []
    for f in sorted(files):
        ext = os.path.splitext(f)[1].lower()
        if ext in ['.jpg', '.jpeg', '.png', '.webp', '.bmp']:
            img_files.append(f)
        elif ext == '.avif':
            print(f"Removing unreadable AVIF file: {os.path.join(folder_path, f)}")
            os.remove(os.path.join(folder_path, f))
    
    # Step 1: Rename to temporary names to avoid collision
    temp_files = []
    for idx, f in enumerate(img_files, 1):
        old_path = os.path.join(folder_path, f)
        temp_name = f"__temp_{idx}{os.path.splitext(f)[1].lower()}"
        temp_path = os.path.join(folder_path, temp_name)
        os.rename(old_path, temp_path)
        temp_files.append(temp_name)
    
    # Step 2: Rename from temporary names to sequential names
    for idx, temp_name in enumerate(temp_files, 1):
        temp_path = os.path.join(folder_path, temp_name)
        orig_ext = os.path.splitext(temp_name)[1].lower()
        # standardizing extension to jpg if jpeg
        target_ext = '.jpg' if orig_ext in ['.jpeg', '.jpg'] else orig_ext
        if prefix:
            new_name = f"{prefix}_{idx}{target_ext}"
        else:
            new_name = f"img_{idx}{target_ext}"
        new_path = os.path.join(folder_path, new_name)
        os.rename(temp_path, new_path)
        
    return len(temp_files)

def run_rename():
    print("Renaming seed_dataset images sequentially...")
    total_seeds = 0
    for cls in sorted(os.listdir(SEED_DIR)):
        cls_dir = os.path.join(SEED_DIR, cls)
        if os.path.isdir(cls_dir):
            count = rename_folder_images(cls_dir, prefix=cls)
            print(f"  [Seed] {cls}: {count} images renamed ({cls}_1.jpg to {cls}_{count}.jpg)")
            total_seeds += count
            
    print(f"Total seed images renamed: {total_seeds}\n")

    print("Renaming disease_dataset images sequentially...")
    total_diseases = 0
    for cls in sorted(os.listdir(DISEASE_DIR)):
        cls_dir = os.path.join(DISEASE_DIR, cls)
        if os.path.isdir(cls_dir):
            count = rename_folder_images(cls_dir, prefix=None)
            print(f"  [Disease] {cls}: {count} images renamed (img_1.jpg to img_{count}.jpg)")
            total_diseases += count
            
    print(f"Total disease images renamed: {total_diseases}\n")

if __name__ == '__main__':
    run_rename()

