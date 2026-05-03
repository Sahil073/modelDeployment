from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import os

app = Flask(__name__)

# ✅ Load model once at startup
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.keras")
print(f"Loading model from: {MODEL_PATH}")
model = tf.keras.models.load_model(MODEL_PATH)
print("✅ Model loaded successfully")

def preprocess(image):
    """Resize, normalize, and batch the image for model input."""
    image = image.resize((224, 224))
    image = np.array(image, dtype=np.float32) / 255.0
    image = np.expand_dims(image, axis=0)  # shape: (1, 224, 224, 3)
    return image

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    try:
        # ✅ Read from bytes — works with any upload method
        img_bytes = file.read()
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        processed = preprocess(image)
        prediction = model.predict(processed, verbose=0)

        confidence = float(prediction[0][0])
        result = "Tumor" if confidence > 0.5 else "No Tumor"

        return jsonify({
            "result": result,
            "confidence": round(confidence if confidence > 0.5 else 1 - confidence, 4)
        })

    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({"error": "Failed to process image"}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)