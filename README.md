# 🧠 NeuroScan AI — Brain Tumor Classifier

> Deep learning-powered MRI scan analysis. Upload a brain MRI and get an instant tumor detection result.

![Status](https://img.shields.io/badge/status-live-brightgreen)
![Python](https://img.shields.io/badge/python-3.10+-blue)
![Node](https://img.shields.io/badge/node-20.x-green)
![TensorFlow](https://img.shields.io/badge/tensorflow-cpu-orange)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## 📸 Demo

```
http://13.60.184.61:3000
```

Upload any brain MRI scan (JPG/PNG) → click **Analyze MRI Scan** → get **Tumor / No Tumor** result instantly.

---

## 🏗️ Architecture

```
User (any device / browser)
        │
        ▼
┌─────────────────────────┐
│   frontend/index.html   │  ← Served by Node.js on port 5000
│   (NeuroScan UI)        │
└─────────────────────────┘
        │  POST /predict (multipart image)
        ▼
┌─────────────────────────┐
│   backend/server.js     │  ← Node.js + Express (port 5000)
│   (API Proxy)           │
└─────────────────────────┘
        │  Forwards to Flask
        ▼
┌─────────────────────────┐
│   model/app.py          │  ← Flask + TensorFlow (port 5001, internal only)
│   (ML Inference)        │
│   model/model.keras     │  ← Trained CNN model
└─────────────────────────┘
```

**Why this architecture?**
- Port `5001` (Flask) is **never exposed** to the internet — only Node.js talks to it
- Node.js serves the frontend AND proxies API requests — only **one public port** needed (`5000`)
- Clean separation: swap the ML model without touching the API layer

---

## 📁 Folder Structure

```
modelDeployment/
│
├── frontend/
│   └── index.html          # Full UI — drag & drop MRI upload, live result display
│
├── backend/
│   ├── server.js           # Express server — serves frontend + proxies to Flask
│   ├── package.json        # Node.js dependencies
│   └── uploads/            # Temp folder for uploaded images (auto-cleaned)
│
└── model/
    ├── app.py              # Flask REST API — loads model, runs inference
    ├── model.keras         # Trained Keras model (NOT in git — upload via scp)
    ├── requirements.txt    # Python dependencies
    └── venv/               # Python virtual environment (NOT in git)
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS |
| API Server | Node.js + Express |
| ML Server | Python + Flask |
| ML Model | TensorFlow / Keras (CNN) |
| File Upload | Multer |
| Process Manager | PM2 |
| Hosting | AWS EC2 (Ubuntu 22.04) |

---

## 🚀 Local Setup

### Prerequisites

- Node.js 20+
- Python 3.10+
- `model.keras` file in the `model/` folder

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/neuroscan-ai.git
cd neuroscan-ai/modelDeployment
```

### 2. Add the model file

The model is not tracked in git (too large). Place `model.keras` manually:

```bash
# Copy your model file into:
modelDeployment/model/model.keras
```

### 3. Set up Python (Flask ML server)

```bash
cd model
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 app.py
# ✅ Flask running on http://127.0.0.1:5001
```

### 4. Set up Node.js (API + Frontend server)

Open a second terminal:

```bash
cd backend
npm install
node server.js
# ✅ Node running on http://127.0.0.1:5000
```

### 5. Open in browser

```
http://localhost:5000
```

---

## ☁️ AWS Deployment

### Prerequisites on EC2

- Ubuntu 22.04 LTS (t2.micro free tier or t3.medium+ for production)
- Ports open in Security Group: `22` (SSH), `5000` (public)
- 20GB+ EBS volume (default 8GB is too small for TensorFlow)

### Step 1 — SSH into EC2

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 2 — Install dependencies

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs python3 python3-pip python3-venv
```

### Step 3 — Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/neuroscan-ai.git ~/neuroscan
cd ~/neuroscan/modelDeployment
```

### Step 4 — Upload model.keras (from local machine)

```bash
# Run this on your LOCAL machine:
scp -i your-key.pem model/model.keras ubuntu@YOUR_EC2_IP:~/neuroscan/modelDeployment/model/
```

### Step 5 — Install Python dependencies

```bash
cd ~/neuroscan/modelDeployment/model
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt --no-cache-dir
```

### Step 6 — Install Node dependencies

```bash
cd ~/neuroscan/modelDeployment/backend
npm install
```

### Step 7 — Run with PM2

```bash
sudo npm install -g pm2
cd ~/neuroscan/modelDeployment

# Start both servers
pm2 start model/app.py --name flask-ml --interpreter model/venv/bin/python3
pm2 start backend/server.js --name node-api

# Persist across reboots
pm2 save
pm2 startup   # run the command it prints
```

### Step 8 — Verify

```bash
pm2 status                          # both should show "online"
curl http://127.0.0.1:5001/health   # {"status": "ok"}
curl http://127.0.0.1:5000/health   # {"status": "ok"}
```

Then open in any browser:
```
http://YOUR_EC2_PUBLIC_IP:5000
```

---

## 🔄 Updating the App

```bash
# On EC2 — pull latest code and restart
cd ~/neuroscan/modelDeployment
git pull
pm2 restart all
```

---

## 🐛 Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| Site doesn't load | Port 5000 not open | AWS Security Group → add port 5000 inbound |
| `curl 5001` fails | Flask crashed | `pm2 logs flask-ml` to see error |
| "ML server not running" | Flask not started | `pm2 restart flask-ml` |
| Model not found | `model.keras` missing | `ls model/model.keras` — upload via scp |
| No space on device | Disk full | Expand EBS: AWS Console → Volumes → Modify → 20GB |
| pip install fails | Not in venv | `source model/venv/bin/activate` first |
| Port already in use | Old process running | `sudo fuser -k 5000/tcp` |
| App crashes on reboot | PM2 not saved | `pm2 save && pm2 startup` |

---

## 📡 API Reference

### `POST /predict`

Accepts an MRI image and returns a tumor classification.

**Request**
```
Content-Type: multipart/form-data
Field: image (file)
```

**Response**
```json
{
  "prediction": "Tumor"
}
```
or
```json
{
  "prediction": "No Tumor"
}
```

**Error Response**
```json
{
  "error": "Prediction failed"
}
```

### `GET /health`

Health check for the Node.js server.

```json
{
  "status": "ok",
  "timestamp": "2026-05-04T10:00:00.000Z"
}
```

---

## ⚠️ Disclaimer

This tool is for **research and educational purposes only**. It is not a certified medical device and should not be used as a substitute for professional medical diagnosis. Always consult a qualified radiologist or physician.

---

## 👨‍💻 Built By

**SAHIL CHAUDHARY** — Founder, [Dhritam](https://github.com/YOUR_USERNAME)
Built as part of the **Kavach X** health-tech initiative.

---

*If this helped you, drop a ⭐ on the repo.*
