import os
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, 'seed_dataset_augmented')
MODEL_PATH = os.path.join(BASE_DIR, 'plant_disease_app', 'seed_model.h5')

print("[INFO] Loading augmented seed dataset (3,900+ images)...")

datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    validation_split=0.20
)

train_generator = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=(128, 128),
    batch_size=32,
    class_mode='categorical',
    subset='training',
    shuffle=True
)

val_generator = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=(128, 128),
    batch_size=32,
    class_mode='categorical',
    subset='validation',
    shuffle=False
)

classes = list(train_generator.class_indices.keys())
print("[INFO] Seed Classes:", classes)

print("[INFO] Loading pre-trained Seed model from:", MODEL_PATH)
model = tf.keras.models.load_model(MODEL_PATH, compile=False)

# Compile with optimal learning rate and metrics
model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.0003),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

callbacks = [
    tf.keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=3, restore_best_weights=True),
    tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-6)
]

print("\n[INFO] Starting Seed Model Training on updated dataset...")
history = model.fit(
    train_generator,
    epochs=10,
    validation_data=val_generator,
    callbacks=callbacks,
    verbose=1
)

model.save(MODEL_PATH)
print(f"\n[SUCCESS] Seed model retrained and saved to {MODEL_PATH}")
val_acc = history.history.get('val_accuracy', [-1])[-1]
print(f"[METRICS] Final Validation Accuracy: {val_acc * 100:.2f}%")

