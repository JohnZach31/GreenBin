const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "..", "data", "rishonMunicipalityText.txt");
const outputPath = path.join(__dirname, "..", "data", "recyclingPointsRaw.json");

const sectionMap = {
  "פלסטיק ואריזות": {
    category: "plastic_packaging",
    bin: "orange",
    idPrefix: "rishon-plastic-packaging",
    format: "neighborhood-address",
  },
  "נייר": {
    category: "paper",
    bin: "blue",
    idPrefix: "rishon-paper",
    format: "title-neighborhood-address",
  },
  "מיכלי זכוכית": {
    category: "glass",
    bin: "purple",
    idPrefix: "rishon-glass",
    format: "neighborhood-address",
  },
  "טקסטיל": {
    category: "textile",
    bin: "textile",
    idPrefix: "rishon-textile",
    format: "neighborhood-address",
  },
  "פסולת אלקטרונית": {
    category: "electronic_waste",
    bin: "electronic_waste",
    idPrefix: "rishon-electronic-waste",
    format: "neighborhood-address",
  },
  "קרטונים": {
    category: "cardboard",
    bin: "cardboard",
    idPrefix: "rishon-cardboard",
    format: "address-neighborhood-description",
  },
};

function cleanText(value) {
  return String(value || "")
    .replace(/\u200b/g, "")
    .replace(/\ufeff/g, "")
    .replace(/​​/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitRow(rawLine) {
  const tabParts = rawLine.split("\t").map(cleanText).filter(Boolean);

  if (tabParts.length >= 2) {
    return tabParts;
  }

  // Some pasted rows turn tabs into multiple spaces.
  return rawLine.split(/ {2,}/).map(cleanText).filter(Boolean);
}

function cleanAddress(address) {
  let cleaned = cleanText(address);

  // Remove notes that confuse geocoding.
  cleaned = cleaned
    .replace(/רחוב /g, "")
    .replace(/רח' /g, "")
    .replace(/ליד .*$/g, "")
    .replace(/בגינה.*$/g, "")
    .replace(/בחנייה.*$/g, "")
    .replace(/במרכז.*$/g, "")
    .replace(/מאחורי.*$/g, "")
    .replace(/ממול/g, "מול")
    .replace(/ מול /g, " ")
    .trim();

  if (!cleaned.includes("ראשון לציון")) {
    cleaned += ", ראשון לציון";
  }

  return cleaned;
}

function makeId(prefix, index) {
  return `${prefix}-${String(index).padStart(3, "0")}`;
}

function isHeaderRow(parts) {
  return parts.some((part) =>
    ["שכונה", "כתובת", "כותרת", "תיאור"].includes(cleanText(part))
  );
}

function parseRow(rawLine, section, counters) {
  const parts = splitRow(rawLine);

  if (parts.length < 2 || isHeaderRow(parts)) {
    return null;
  }

  let neighborhood = "";
  let address = "";
  let description = "";

  if (section.format === "title-neighborhood-address") {
    if (parts.length < 3) return null;

    description = parts[0];
    neighborhood = parts[1];
    address = parts[2];
  } else if (section.format === "address-neighborhood-description") {
    address = parts[0];
    neighborhood = parts[1] || "";
    description = parts[2] || "";
  } else {
    neighborhood = parts[0];
    address = parts[1];
  }

  address = cleanAddress(address);

  if (!address || address.length < 4) {
    return null;
  }

  counters[section.idPrefix] = (counters[section.idPrefix] || 0) + 1;

  return {
    id: makeId(section.idPrefix, counters[section.idPrefix]),
    city: "rishon_lezion",
    category: section.category,
    bin: section.bin,
    neighborhood,
    address,
    description,
    source: "Rishon LeZion municipality",
  };
}

function main() {
  const text = fs.readFileSync(inputPath, "utf8");
  const rawLines = text.split(/\r?\n/);

  const points = [];
  const counters = {};
  let currentSection = null;

  for (const rawLine of rawLines) {
    const line = cleanText(rawLine);

    if (!line || line.startsWith("---")) {
      continue;
    }

    if (sectionMap[line]) {
      currentSection = sectionMap[line];
      console.log(`Found section: ${line}`);
      continue;
    }

    if (!currentSection) {
      continue;
    }

    const point = parseRow(rawLine, currentSection, counters);

    if (point) {
      points.push(point);
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(points, null, 2), "utf8");

  console.log(`Parsed ${points.length} raw recycling points`);
  console.log(outputPath);
}

main();