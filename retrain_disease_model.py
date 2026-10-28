import os
import shutil
import random
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DISEASE_DIR = os.path.join(BASE_DIR, 'disease_dataset')
BALANCED_DIR = os.path.join(BASE_DIR, 'disease_dataset_balanced')
MODEL_PATH = os.path.join(BASE_DIR, 'plant_disease_app', 'plant_disease_model.h5')
SEED_MODEL_PATH = os.path.join(BASE_DIR, 'plant_disease_app', 'seed_model.h5')

# 1. Create a balanced, high-quality subset for fast and accurate CPU training (200 images per class)
MAX_PER_CLASS = 200
print(f"[INFO] Preparing balanced dataset (up to {MAX_PER_CLASS} images per class)...")
if os.path.exists(BALANCED_DIR):
    shutil.rmtree(BALANCED_DIR)
os.makedirs(BALANCED_DIR, exist_ok=True)

class_folders = sorted([d for d in os.listdir(DISEASE_DIR) if os.path.isdir(os.path.join(DISEASE_DIR, d))])
total_sampled = 0

for cls in class_folders:
    src_cls = os.path.join(DISEASE_DIR, cls)
    tgt_cls = os.path.join(BALANCED_DIR, cls)
    os.makedirs(tgt_cls, exist_ok=True)
    
    files = [f for f in os.listdir(src_cls) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    random.seed(42)
    selected = random.sample(files, min(len(files), MAX_PER_CLASS))
    for f in selected:
        shutil.copy2(os.path.join(src_cls, f), os.path.join(tgt_cls, f))
    total_sampled += len(selected)

print(f"[INFO] Balanced dataset ready with {total_sampled} images across {len(class_folders)} classes.")

# 2. Data Generators with Data Augmentation
datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    rotation_range=20,
    zoom_range=0.15,
    horizontal_flip=True,
    vertical_flip=True,
    validation_split=0.20
)

train_generator = datagen.flow_from_directory(
    BALANCED_DIR,
    target_size=(128, 128),
    batch_size=32,
    class_mode='categorical',
    subset='training',
    shuffle=True
)

val_generator = datagen.flow_from_directory(
    BALANCED_DIR,
    target_size=(128, 128),
    batch_size=32,
    class_mode='categorical',
    subset='validation',
    shuffle=False
)

classes = list(train_generator.class_indices.keys())
print(f"[INFO] Detected {len(classes)} classes:", classes)

# 3. Build Transfer-Learning Model using MobileNetV2 backbone from seed model
print("[INFO] Extracting pre-trained MobileNetV2 backbone...")
seed_model = tf.keras.models.load_model(SEED_MODEL_PATH, compile=False)
base_backbone = seed_model.layers[0]  # The MobileNetV2 functional layer
base_backbone.trainable = False

disease_model = models.Sequential([
    base_backbone,
    layers.GlobalAveragePooling2D(name='gap'),
    layers.Dense(512, activation='relu', name='disease_dense_1'),
    layers.BatchNormalization(name='disease_bn'),
    layers.Dropout(0.35, name='disease_dropout'),
    layers.Dense(len(classes), activation='softmax', name='disease_output')
])

disease_model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.0005),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

callbacks = [
    tf.keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=3, restore_best_weights=True),
    tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-6)
]

print("\n[PHASE 1] Training Disease Classification Head...")
history = disease_model.fit(
    train_generator,
    epochs=8,
    validation_data=val_generator,
    callbacks=callbacks,
    verbose=1
)

# Phase 2: Fine-tune top layers
print("\n[PHASE 2] Fine-tuning top convolutional layers...")
base_backbone.trainable = True
for layer in base_backbone.layers[:-30]:
    layer.trainable = False

disease_model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.00008),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

history2 = disease_model.fit(
    train_generator,
    epochs=5,
    validation_data=val_generator,
    callbacks=callbacks,
    verbose=1
)

# Save the full retrained model
disease_model.save(MODEL_PATH)
print(f"\n[SUCCESS] Retrained Disease Model saved to: {MODEL_PATH}")

val_acc = history2.history.get('val_accuracy', history.history.get('val_accuracy', [-1]))[-1]
print(f"[METRICS] Final Validation Accuracy: {val_acc * 100:.2f}%")

