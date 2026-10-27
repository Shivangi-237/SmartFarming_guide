import os
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

os.environ['KERAS_HOME'] = os.path.abspath(os.path.join(os.path.dirname(__file__), '.keras'))
os.makedirs(os.path.join(os.environ['KERAS_HOME'], 'models'), exist_ok=True)

DATASET_DIR = os.path.join(os.path.dirname(__file__), 'seed_dataset_augmented')
MODEL_SAVE_PATH = os.path.join(os.path.dirname(__file__), 'plant_disease_app', 'seed_model.h5')

print("[INFO] Loading 1,100+ augmented seed dataset...")

datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    validation_split=0.20
)

train_generator = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=(128, 128),
    batch_size=16,
    class_mode='categorical',
    subset='training',
    shuffle=True
)

val_generator = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=(128, 128),
    batch_size=16,
    class_mode='categorical',
    subset='validation',
    shuffle=False
)

classes = list(train_generator.class_indices.keys())
print("[INFO] Classes:", classes)

base_model = tf.keras.applications.MobileNetV2(
    input_shape=(128, 128, 3),
    include_top=False,
    weights='imagenet'
)
base_model.trainable = False

model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dense(256, activation='relu'),
    layers.BatchNormalization(),
    layers.Dropout(0.35),
    layers.Dense(len(classes), activation='softmax')
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

print("\n[PHASE 1] Training classification head (15 epochs)...")
model.fit(
    train_generator,
    epochs=15,
    validation_data=val_generator,
    verbose=1
)

print("\n[PHASE 2] Fine-tuning MobileNetV2 top layers (15 epochs)...")
base_model.trainable = True
for layer in base_model.layers[:100]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.fit(
    train_generator,
    epochs=15,
    validation_data=val_generator,
    verbose=1
)

model.save(MODEL_SAVE_PATH)
print(f"\n[SUCCESS] New high-performance Seed Model saved to: {MODEL_SAVE_PATH}")
