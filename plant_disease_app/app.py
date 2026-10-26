from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
from model import predict_disease
from seed_model import predict_seed
import os
from flask_cors import CORS

app = Flask(__name__, template_folder='templates')
CORS(app)

# ─── Configuration ─────────────────────────────────────────────
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB limit
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ─── Routes ────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def upload_and_predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:
            pred_class, confidence = predict_disease(filepath)
        except Exception as e:
            if os.path.exists(filepath):
                os.remove(filepath)
            print("❌ Disease prediction error:", e)
            return jsonify({'error': 'Prediction failed'}), 500

        if os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'prediction': pred_class, 'confidence': confidence})
    else:
        return jsonify({'error': 'Invalid file type'}), 400

@app.route('/predict-seed', methods=['POST'])
def upload_and_predict_seed():
    if 'image' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:
            seed_name, confidence, details = predict_seed(filepath)
        except Exception as e:
            if os.path.exists(filepath):
                os.remove(filepath)
            print("❌ Seed prediction error:", e)
            return jsonify({'error': 'Seed prediction failed'}), 500

        if os.path.exists(filepath):
            os.remove(filepath)

        return jsonify({
            'seed': seed_name,
            'confidence': confidence,
            'scientific': details.get('scientific', seed_name),
            'planting_en': details.get('planting_en', ''),
            'planting_hi': details.get('planting_hi', ''),
            'is_recognized': details.get('is_recognized', True)
        })
    else:
        return jsonify({'error': 'Invalid file type'}), 400

# ─── Start ────────────────────────────────────────────────────
if __name__ == '__main__':
    print("▶ Starting Flask server on port 5001…")
    app.run(debug=False, port=5001)
