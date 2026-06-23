const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const tempDirectory = path.join(__dirname, "temp");

if (!fs.existsSync(tempDirectory)) {
  fs.mkdirSync(tempDirectory, { recursive: true });
}

const upload = multer({
  dest: tempDirectory,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
 fileFilter: (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/jfif",
    "application/octet-stream",
  ];

  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".jfif",
  ];

  const fileExtension = path.extname(file.originalname).toLowerCase();

  const isAllowedMimeType = allowedMimeTypes.includes(file.mimetype);
  const isAllowedExtension = allowedExtensions.includes(fileExtension);

  if (!isAllowedMimeType && !isAllowedExtension) {
    return cb(new Error("Only image files are allowed"));
  }

  cb(null, true);
},
});

app.get("/", (req, res) => {
  res.json({
    message: "GreenBin backend is up and running",
    model: "yangy50/garbage-classification",
    mode: "local-python-huggingface",
  });
});

app.post("/api/classify", upload.single("image"), (req, res) => {
  let uploadedFilePath;

  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    uploadedFilePath = req.file.path;

    const mlScriptPath = path.join(
      __dirname,
      "..",
      "ml-huggingface",
      "classify.py"
    );

    const pythonPath = path.join(
      __dirname,
      "..",
      "ml-huggingface",
      ".venv",
      "Scripts",
      "python.exe"
    );

    const pythonProcess = spawn(pythonPath, [mlScriptPath, uploadedFilePath], {
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        HF_HUB_DISABLE_SYMLINKS_WARNING: "1",
      },
    });

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString("utf8");
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString("utf8");
    });

    pythonProcess.on("error", (error) => {
      cleanupTempFile(uploadedFilePath);

      return res.status(500).json({
        error: "Failed to start Python process",
        details: error.message,
      });
    });

    pythonProcess.on("close", (code) => {
      cleanupTempFile(uploadedFilePath);

      if (code !== 0) {
        console.error("Python error:", errorOutput);

        return res.status(500).json({
          error: "Python classification failed",
          details: errorOutput || `Python exited with code ${code}`,
        });
      }

      try {
        const parsedResult = extractJsonFromPythonOutput(output);

        if (parsedResult.error) {
          return res.status(500).json({
            error: "Model returned an error",
            details: parsedResult.error,
          });
        }

        return res.json({
          category: parsedResult.category,
          confidence: parsedResult.confidence,
          bin: parsedResult.binRec,
          rawLabel: parsedResult.label,
          displayname: parsedResult.displayname,
          topPredictions: parsedResult.topPredictions,
        });
      } catch (parseError) {
        console.error("Could not parse Python output:", output);

        return res.status(500).json({
          error: "Could not parse model output",
          details: parseError.message,
          rawOutput: output,
        });
      }
    });
  } catch (error) {
    cleanupTempFile(uploadedFilePath);

    return res.status(500).json({
      error: "Failed to classify image",
      details: error.message,
    });
  }
});

function extractJsonFromPythonOutput(output) {
  const trimmed = output.trim();

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON object found in Python output");
  }

  const jsonString = trimmed.slice(firstBrace, lastBrace + 1);

  return JSON.parse(jsonString);
}

function cleanupTempFile(filePath) {
  if (!filePath) return;

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Failed to delete temp file:", err);
    }
  });
}

app.use((error, req, res, next) => {
  return res.status(500).json({
    error: "Internal server error",
    details: error.message,
  });
});

app.listen(PORT, () => {
  console.log(`GreenBin backend running on http://localhost:${PORT}`);
});