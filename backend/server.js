const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const app = express();

// ✅ Allow requests from any origin (needed for public access)
app.use(cors());

// ✅ Serve index.html at root
app.use(express.static(path.join(__dirname, '../frontend')));

// ✅ Store uploads in memory temp folder, auto-cleanup after response
const upload = multer({ dest: "uploads/" });

// ✅ Flask ML server — localhost since both run on same EC2 instance
const FLASK_URL = "http://127.0.0.1:5001/predict";

app.post("/predict", upload.single("image"), async (req, res) => {
    const tempPath = req.file?.path;

    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image file uploaded" });
        }

        const formData = new FormData();
        formData.append("file", fs.createReadStream(tempPath), req.file.originalname);

        const response = await axios.post(FLASK_URL, formData, {
            headers: formData.getHeaders(),
            timeout: 30000  // 30 second timeout
        });

        res.json({ prediction: response.data.result });

    } catch (error) {
        console.error("Prediction error:", error.message);

        if (error.code === "ECONNREFUSED") {
            res.status(503).json({ error: "ML server is not running" });
        } else {
            res.status(500).json({ error: "Prediction failed" });
        }
    } finally {
        // ✅ Always clean up temp file
        if (tempPath && fs.existsSync(tempPath)) {
            fs.unlink(tempPath, () => {});
        }
    }
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Node server running on port ${PORT}`);
    console.log(`   Serving index.html at /`);
    console.log(`   Forwarding /predict → ${FLASK_URL}`);
});