const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const {
  findNearestRecyclingPoint,
} = require("./services/recyclingPointsService");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const startedAt = Date.now();

  console.log(`[REQ] ${req.method} ${req.originalUrl} from ${req.ip}`);

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(`[RES] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
  });

  next();
});

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
      file.originalname
    )}`;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
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

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".jfif"];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    const isAllowedMimeType = allowedMimeTypes.includes(file.mimetype);
    const isAllowedExtension = allowedExtensions.includes(fileExtension);

    if (!isAllowedMimeType && !isAllowedExtension) {
      return cb(new Error("Only image files are allowed"));
    }

    cb(null, true);
  },
});

const pythonExecutable = path.join(
  __dirname,
  "..",
  "ml-huggingface",
  ".venv",
  "Scripts",
  "python.exe"
);

const classifyScript = path.join(
  __dirname,
  "..",
  "ml-huggingface",
  "classify.py"
);

function safeDeleteFile(filePath) {
  if (!filePath) return;

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Could not delete uploaded file:", err.message);
    }
  });
}

function extractJsonFromPythonOutput(output) {
  const trimmed = String(output || "").trim();

  if (!trimmed) {
    throw new Error("Python returned empty output");
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];

    if (line.startsWith("{") && line.endsWith("}")) {
      return JSON.parse(line);
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("No JSON object found in Python output");
  }

  const jsonString = trimmed.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonString);
}

app.get("/", (req, res) => {
  res.json({
    message: "GreenBin backend is up and running",
    model: "yangy50/garbage-classification",
    mode: "local-python-huggingface",
  });
});

app.post("/api/classify", upload.single("image"), async (req, res) => {
  let uploadedFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No image uploaded",
      });
    }

    uploadedFilePath = req.file.path;

    console.log("BODY:", req.body);

console.log("FILE:", {
  originalname: req.file.originalname,
  mimetype: req.file.mimetype,
  size: req.file.size,
});

console.log("Starting Python classification...");

    if (!fs.existsSync(pythonExecutable)) {
      safeDeleteFile(uploadedFilePath);

      return res.status(500).json({
        error: "Python executable was not found",
        details: pythonExecutable,
      });
    }

    if (!fs.existsSync(classifyScript)) {
      safeDeleteFile(uploadedFilePath);

      return res.status(500).json({
        error: "Classification script was not found",
        details: classifyScript,
      });
    }

    const pythonProcess = spawn(pythonExecutable, [classifyScript, uploadedFilePath], {
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        HF_HUB_DISABLE_SYMLINKS_WARNING: "1",
      },
    });

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString("utf8");
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString("utf8");
    });

    pythonProcess.on("error", (err) => {
      console.error("Python process error:", err);

      safeDeleteFile(uploadedFilePath);

      return res.status(500).json({
        error: "Could not start Python classification process",
        details: err.message,
      });
    });

    pythonProcess.on("close", (code) => {
	console.log("Python finished with code:", code);
      safeDeleteFile(uploadedFilePath);

      if (code !== 0) {
        console.error("Python exited with code:", code);
        console.error("Python stderr:", stderr);
        console.error("Python stdout:", stdout);

        return res.status(500).json({
          error: "Python classification failed",
          details: stderr || stdout || `Python exited with code ${code}`,
        });
      }

      try {
        const parsedResult = extractJsonFromPythonOutput(stdout);

        const nearestPoint = findNearestRecyclingPoint({
          category: parsedResult.category,
          lat: req.body.lat,
          lng: req.body.lng,
          city: req.body.city,
        });

        return res.json({
          category: parsedResult.category,
          confidence: parsedResult.confidence,
          bin: parsedResult.binRec,
          rawLabel: parsedResult.label,
          displayname: parsedResult.displayname,
          topPredictions: parsedResult.topPredictions,
          nearestPoint,
        });
      } catch (parseError) {
        console.error("Could not parse Python output:", stdout);
        console.error("Parse error:", parseError.message);
        console.error("Python stderr:", stderr);

        return res.status(500).json({
          error: "Could not parse Python output",
          details: parseError.message,
          rawOutput: stdout,
          stderr,
        });
      }
    });
  } catch (err) {
    console.error("Server error:", err);

    safeDeleteFile(uploadedFilePath);

    return res.status(500).json({
      error: "Server error while classifying image",
      details: err.message,
    });
  }
});

app.post("/api/nearest-bin", (req, res) => {
  try {
    const { category, lat, lng, city } = req.body;

    if (!category) {
      return res.status(400).json({
        error: "Category is required",
      });
    }

    // Manual flow: user picks the category instead of using the AI model.
    const nearestPoint = findNearestRecyclingPoint({
      category,
      lat,
      lng,
      city,
    });

    return res.json({
      category,
      city,
      nearestPoint,
    });
  } catch (err) {
    console.error("Nearest bin error:", err);

    return res.status(500).json({
      error: "Could not find nearest recycling point",
      details: err.message,
    });
  }
});

app.use((err, req, res, next) => {
  console.error("Express error:", err);

  return res.status(400).json({
    error: err.message || "Request failed",
  });
});

app.listen(PORT, () => {
  console.log(`GreenBin backend running on http://localhost:${PORT}`);
});