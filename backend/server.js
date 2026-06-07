const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const tempDirectory = path.join(__dirname, 'temp');

if (!fs.existsSync(tempDirectory)) {
    fs.mkdirSync(tempDirectory, { recursive: true });
}

// multer saves uploaded images temporarily before sending them to the ML model
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

    // paths to the ResNet prediction script and the project Python environment
    const mlScriptPath = path.join(__dirname, "..", "ml-ourmodel", "src", "predict.py");
    const pythonPath = path.join(__dirname, "..", ".venv", "Scripts", "python.exe");

    const pythonProcess = spawn(pythonPath, [mlScriptPath, uploadedFilePath], {
        cwd: path.join(__dirname, "..", "ml-ourmodel")
    });

    let output = "";
    let errOutput = "";

    pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
        errOutput += data.toString();
    });

    pythonProcess.on("close", (code) => {
        // remove uploaded temp image after prediction
        fs.unlink(uploadedFilePath, (err) => {
            if (err) {
                console.error("Could not delete temp file:", err);
            }
        });

        if (code !== 0) {
            return res.status(500).json({
                error: "Python prediction failed",
                details: errOutput
            });
        }

        try {
            const predictionResult = JSON.parse(output);

            const predictedClass = predictionResult.predicted_class_is;
            const confidence = Number(predictionResult.confidence);
            const isLowConfidence = confidence < 80;

            return res.json({
                item: predictedClass,
                category: predictedClass,
                confidence: `${confidence}%`,
                bin: isLowConfidence
                    ? "Low confidence - please verify manually"
                    : getRecommendedBin(predictedClass),
                location: "Nearest recycling point will be added later",
                distance: "Location calculation will be added later",
                status: isLowConfidence ? "Low confidence" : "Model result"
            });
        } catch (error) {
            return res.status(500).json({
                error: "Could not parse prediction result",
                rawOutput: output,
                details: error.message
            });
        }
    });
});

function getRecommendedBin(predictedClass) {
    const binMap = {
        cardboard: "Paper/Cardboard recycling bin",
        paper: "Paper recycling bin",
        plastic: "Plastic recycling bin",
        glass: "Glass recycling bin",
        metal: "Metal recycling bin",
        trash: "General waste bin"
    };

    return binMap[predictedClass] || "Unknown bin";
}

app.listen(PORT, () => {
    console.log(`GreenBin backend is running on http://localhost:${PORT}`);
});