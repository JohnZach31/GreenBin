const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "..", "data", "recyclingPointsRaw.json");
const outputPath = path.join(__dirname, "..", "data", "recyclingPoints.json");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function loadJsonFile(filePath, fallbackValue) {
  if (!fs.existsSync(filePath)) {
    return fallbackValue;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveProgress(points) {
  fs.writeFileSync(outputPath, JSON.stringify(points, null, 2), "utf8");
}

function makeCacheKey(point) {
  return `${point.category}|${point.address}`;
}

async function geocodeAddress(address) {
  const query = encodeURIComponent(address);

  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `q=${query}&format=json&limit=1&countrycodes=il`;

  const response = await fetch(url, {
    headers: {
      // Required by Nominatim usage policy.
      "User-Agent": "GreenBinStudentProject/1.0 johnzachws@gmail.com",
    },
  });

  if (response.status === 429) {
    throw new Error("RATE_LIMIT_429");
  }

  if (!response.ok) {
    throw new Error(`Geocoding failed with status ${response.status}`);
  }

  const results = await response.json();

  if (!results.length) {
    return null;
  }

  return {
    lat: Number(results[0].lat),
    lng: Number(results[0].lon),
  };
}

async function geocodeWithRetry(address) {
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await geocodeAddress(address);
    } catch (err) {
      if (err.message !== "RATE_LIMIT_429") {
        throw err;
      }

      const waitMs = 90000;

      console.log(`  -> Rate limited. Waiting ${waitMs / 1000}s before retry ${attempt}/${maxAttempts}...`);
      await sleep(waitMs);
    }
  }

  throw new Error("Rate limit did not clear after retries");
}

async function main() {
  const rawPoints = loadJsonFile(inputPath, []);
  const existingPoints = loadJsonFile(outputPath, []);

  const existingKeys = new Set(existingPoints.map(makeCacheKey));
  const geocodedPoints = [...existingPoints];

  console.log(`Raw points: ${rawPoints.length}`);
  console.log(`Already geocoded: ${existingPoints.length}`);

  for (let i = 0; i < rawPoints.length; i++) {
    const point = rawPoints[i];
    const cacheKey = makeCacheKey(point);

    if (existingKeys.has(cacheKey)) {
      console.log(`[${i + 1}/${rawPoints.length}] Skipping existing: ${point.address}`);
      continue;
    }

    console.log(`[${i + 1}/${rawPoints.length}] ${point.address}`);

    try {
      const coords = await geocodeWithRetry(point.address);

      if (!coords) {
        console.log("  -> No coordinates found");
      } else {
        geocodedPoints.push({
          ...point,
          lat: coords.lat,
          lng: coords.lng,
        });

        existingKeys.add(cacheKey);
        saveProgress(geocodedPoints);

        console.log(`  -> ${coords.lat}, ${coords.lng}`);
        console.log(`  -> Saved progress: ${geocodedPoints.length} points`);
      }
    } catch (err) {
      console.log(`  -> Error: ${err.message}`);
    }

    // Be gentle with the public geocoding service.
    await sleep(3500);
  }

  saveProgress(geocodedPoints);

  console.log(`\nDone. Saved ${geocodedPoints.length} points to:`);
  console.log(outputPath);
}

main();