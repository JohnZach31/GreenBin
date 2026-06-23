const fs = require("fs");
const path = require("path");

const recyclingPointsPath = path.join(
  __dirname,
  "..",
  "data",
  "recyclingPoints.json"
);

function loadRecyclingPoints() {
  if (!fs.existsSync(recyclingPointsPath)) {
    return [];
  }

  const rawData = fs.readFileSync(recyclingPointsPath, "utf8");
  return JSON.parse(rawData);
}

function normalizeCategory(category) {
  const normalized = String(category || "").toLowerCase();

  const categoryMap = {
    cardboard: "cardboard",
    carton: "cardboard",
    paper: "paper",
    glass: "glass",
    metal: "metal",
    plastic: "plastic",
    trash: "trash",
    general: "trash",

    plastic_packaging: "plastic_packaging",
    textile: "textile",
    electronic_waste: "electronic_waste",
  };

  return categoryMap[normalized] || normalized;
}

function getAcceptedCategories(category) {
  const normalized = normalizeCategory(category);

  // Map model categories to the city recycling categories.
  // Metal packaging usually goes with the orange packaging bin.
  const categoryGroups = {
    plastic: ["plastic_packaging"],
    metal: ["plastic_packaging"],
    paper: ["paper"],
    cardboard: ["cardboard"],
    glass: ["glass"],
    trash: [],
    general: [],

    plastic_packaging: ["plastic_packaging"],
    textile: ["textile"],
    electronic_waste: ["electronic_waste"],
  };

  return categoryGroups[normalized] || [normalized];
}

function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const earthRadiusMeters = 6371000;
  const toRadians = (degrees) => degrees * Math.PI / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

function findNearestRecyclingPoint({ category, lat, lng, city }) {
  const userLat = Number(lat);
  const userLng = Number(lng);

  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
    return null;
  }

  const points = loadRecyclingPoints();
  const acceptedCategories = getAcceptedCategories(category);

  const filteredPoints = points.filter((point) => {
    const pointLat = Number(point.lat);
    const pointLng = Number(point.lng);

    const sameCity = !city || point.city === city;
    const sameCategory = acceptedCategories.includes(point.category);

    return (
      sameCity &&
      sameCategory &&
      Number.isFinite(pointLat) &&
      Number.isFinite(pointLng)
    );
  });

  if (filteredPoints.length === 0) {
    return null;
  }

  let nearestPoint = null;
  let nearestDistance = Infinity;

  for (const point of filteredPoints) {
    const distance = haversineDistanceMeters(
      userLat,
      userLng,
      Number(point.lat),
      Number(point.lng)
    );

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPoint = point;
    }
  }

  return {
    ...nearestPoint,
    distanceMeters: Math.round(nearestDistance),
  };
}

module.exports = {
  findNearestRecyclingPoint,
};