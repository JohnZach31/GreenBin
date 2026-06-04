// עשינו import לספריות שיעזרו לנו עם העלאת התמונות למודל וכמובן אקספרס שנלמד בקורס אחר כדי להריץ את הבקאנד למען הפרונטאנד
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// node backend/server.js
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const uploadsDirectory = path.join(__dirname, 'uploads');
const tempDirectory = path.join(__dirname, 'temp');

if (!fs.existsSync(uploadsDirectory)) {
    fs.mkdirSync(uploadsDirectory, { recursive: true });
}

if (!fs.existsSync(tempDirectory)) {
    fs.mkdirSync(tempDirectory, { recursive: true });
}

const upload = multer({ dest: tempDirectory });

app.get('/', (req, res) => {
    res.send("GreenBin backend is up and running...");
});

app.post("/api/classify", upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ 
            error: "No file uploaded"
        });
    }

    const uploadedFilePath = req.file.path;
    const mlScriptPath = path.join(__dirname, "..", "ml", "classify.py");
    const pythonPath = path.join(__dirname, "..", "ml", ".venv", "Scripts", "python.exe");
    const latestResultPath = path.join(tempDirectory, "latest_result.json");

    const pythonProcess = spawn(pythonPath, [mlScriptPath, uploadedFilePath]);

    let output = "";
    let errOutput = "";

    pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
        errOutput += data.toString();
    });

});