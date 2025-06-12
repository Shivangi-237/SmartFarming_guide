from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
from model import predict_disease
import os
from flask_cors import CORS

# Debug: show what's in the model module
import model
print("MODEL MODULE CONTAINS:", dir(model))

app = Flask(__name__, template_folder='templates')  # ✅ Use correct __name__ and templates folder
CORS(app)
# ─── Configuration ─────────────────────────────────────────────
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB limit
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ─── Routes ────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')  # ✅ loads from /templates/index.html

@app.route('/predict', methods=['POST'])
def upload_and_predict():
    print("📩 Received POST to /predict")

    if 'image' not in request.files:
        print("❌ No 'image' in request.files")
        return jsonify({'error': 'No file part'}), 400

    file = request.files['image']
    if file.filename == '':
        print("❌ No selected file")
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        print(f"✅ File saved to {filepath}")

        try:
            print("🧠 Calling predict_disease...")
            pred_class = predict_disease(filepath)
            print(f"✅ Prediction result: {pred_class}")
        except Exception as e:
            os.remove(filepath)
            print("❌ Prediction error:", e)
            return jsonify({'error': 'Prediction failed'}), 500

        os.remove(filepath)
        return jsonify({'prediction': pred_class})
    else:
        print("❌ Invalid file type")
        return jsonify({'error': 'Invalid file type'}), 400
# ─── Start ────────────────────────────────────────────────────
if __name__ == '__main__':  # ✅ Corrected syntax
    print("▶ Starting Flask server on port 5001…")
    app.run(debug=True, port=5001)  # ✅ Avoid Node port conflict
