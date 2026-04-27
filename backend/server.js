const express = require("express");
const multer = require("multer");
const cors = require("cors");

const app = express();

// Allow frontend to connect
app.use(cors());

// Storage config (temporary)
const upload = multer({ dest: "uploads/" });

// Route
app.post("/predict", upload.single("image"), (req, res) => {
    console.log("File received:", req.file);

    // Fake response for now
    res.json({
        prediction: "Tumor Detected (Dummy Response)"
    });
});

// Start server
app.listen(5000, () => {
    console.log("Server running on port 5000");
});