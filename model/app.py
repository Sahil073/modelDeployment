from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
from PIL import Image

app = Flask(__name__)

# Load model once
model = tf.keras.models.load_model("model.keras")

def preprocess(image):
    image = image.resize((224, 224))  # change if needed
    image = np.array(image) / 255.0
    image = np.expand_dims(image, axis=0)
    return image

@app.route("/predict", methods=["POST"])
def predict():
    file = request.files["file"]
    image = Image.open(file).convert("RGB")

    processed = preprocess(image)
    prediction = model.predict(processed)

    result = "Tumor" if prediction[0][0] > 0.5 else "No Tumor"

    return jsonify({"result": result})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)