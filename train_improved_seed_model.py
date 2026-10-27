import os
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

# Use local workspace directory for Keras cache
os.environ['KERAS_HOME'] = os.path.abspath(os.path.join(os.path.dirname(__file__), '.keras'))
os.makedirs(os.path.join(os.environ['KERAS_HOME'], 'models'), exist_ok=True)

DATASET_DIR = os.path.join(os.path.dirname(__file__), 'seed_dataset')
MODEL_SAVE_PATH = os.path.join(os.path.dirname(__file__), 'plant_disease_app', 'seed_model.h5')

print("[INFO] Preparing high-augmentation seed data pipeline...")

# Heavy augmentation for small seed dataset
train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    rotation_range=90,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.25,
    horizontal_flip=True,
    vertical_flip=True,
    brightness_range=[0.75, 1.25],
    fill_mode='nearest',
    validation_split=0.2
)

train_generator = train_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=(128, 128),
    batch_size=8,
    class_mode='categorical',
    subset='training',
    shuffle=True
)

val_generator = train_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=(128, 128),
    batch_size=8,
    class_mode='categorical',
    subset='validation',
    shuffle=False
)

classes = list(train_generator.class_indices.keys())
print("[INFO] Seed classes:", classes)

base_model = tf.keras.applications.MobileNetV2(
    input_shape=(128, 128, 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False

model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dense(128, activation='relu'),
    layers.Dropout(0.3),
    layers.Dense(len(classes), activation='softmax')
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print("[INFO] Phase 1: Training top layers (25 epochs)...")
model.fit(
    train_generator,
    epochs=25,
    validation_data=val_generator,
    verbose=1
)

print("[INFO] Phase 2: Fine-tuning top MobileNetV2 layers (20 epochs)...")
base_model.trainable = True
# Freeze all layers before layer 100
for layer in base_model.layers[:100]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.fit(
    train_generator,
    epochs=20,
    validation_data=val_generator,
    verbose=1
)

model.save(MODEL_SAVE_PATH)
print(f"[SUCCESS] Trained high-accuracy seed model saved to: {MODEL_SAVE_PATH}")
