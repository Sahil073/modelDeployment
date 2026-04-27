const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

app.post("/predict", upload.single("image"), async (req, res) => {
    try {
        console.log("File received:", req.file);

        // Send file to ML API
        const formData = new FormData();
        formData.append("file", fs.createReadStream(req.file.path));

        const response = await axios.post(
            "http://13.60.184.61/5001/predict",  // ML API
            formData,
            { headers: formData.getHeaders() }
        );

        // Send ML result back to frontend
        res.json({
            prediction: response.data.result
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Prediction failed" });
    }
});

app.listen(5000, '0.0.0.0', () => {
    console.log("Server running on port 5000");
});