import os
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models

# Architecture matches Train_Plant_Disease1.ipynb exactly
def build_disease_model():
    model = models.Sequential([
        layers.Input(shape=(128, 128, 3)),
        layers.Rescaling(1./255),
        layers.Conv2D(32, (3, 3), padding='same', activation='relu', name='conv2d_10'),
        layers.Conv2D(32, (3, 3), activation='relu', name='conv2d_11'),
        layers.MaxPooling2D(pool_size=(2, 2), name='max_pooling2d_5'),
        layers.Conv2D(64, (3, 3), padding='same', activation='relu', name='conv2d_12'),
        layers.Conv2D(64, (3, 3), activation='relu', name='conv2d_13'),
        layers.MaxPooling2D(pool_size=(2, 2), name='max_pooling2d_6'),
        layers.Conv2D(128, (3, 3), padding='same', activation='relu', name='conv2d_14'),
        layers.Conv2D(128, (3, 3), activation='relu', name='conv2d_15'),
        layers.MaxPooling2D(pool_size=(2, 2), name='max_pooling2d_7'),
        layers.Conv2D(256, (3, 3), padding='same', activation='relu', name='conv2d_16'),
        layers.Conv2D(256, (3, 3), activation='relu', name='conv2d_17'),
        layers.MaxPooling2D(pool_size=(2, 2), name='max_pooling2d_8'),
        layers.Conv2D(512, (3, 3), padding='same', activation='relu', name='conv2d_18'),
        layers.Conv2D(512, (3, 3), activation='relu', name='conv2d_19'),
        layers.MaxPooling2D(pool_size=(2, 2), name='max_pooling2d_9'),
        layers.Dropout(0.25, name='dropout_2'),
        layers.Flatten(name='flatten_1'),
        layers.Dense(1500, activation='relu', name='dense_2'),
        layers.Dropout(0.4, name='dropout_3'),
        layers.Dense(23, activation='softmax', name='dense_3')
    ])
    return model

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'plant_disease_model.h5')
model = build_disease_model()
model.load_weights(MODEL_PATH)

# Warm up model graph during server boot so user requests are fast
try:
    _ = model(np.zeros((1, 128, 128, 3), dtype=np.float32), training=False)
except Exception as _e:
    pass

# Exactly 23 classes as trained in Train_Plant_Disease1.ipynb
class_names = [
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

def predict_disease(image_path):
    img = tf.keras.preprocessing.image.load_img(image_path, target_size=(128, 128))
    arr = tf.keras.preprocessing.image.img_to_array(img)
    arr = np.expand_dims(arr, axis=0)
    preds = model(arr, training=False).numpy()
    idx = int(np.argmax(preds[0]))
    confidence = float(round(float(preds[0][idx]) * 100, 2))
    return class_names[idx], confidence
