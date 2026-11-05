// Words that end in "s" but are already singular (or have no plural form).
const UNCHANGED = new Set([
  "asparagus", "hummus", "couscous", "molasses", "citrus", "octopus", "cactus",
  "swiss", "brussels", "grits", "oats", "series", "species", "gas", "bass",
]);

// Irregular plurals, and "-ies"/"-ves" words that the general rules would get wrong.
const IRREGULAR = {
  leaves: "leaf", loaves: "loaf", halves: "half", knives: "knife", calves: "calf",
  shelves: "shelf", wolves: "wolf", lives: "life",
  chilies: "chili", chilis: "chili", chillies: "chilli",
  cookies: "cookie", brownies: "brownie", pies: "pie", smoothies: "smoothie",
  veggies: "veggie", rotinis: "rotini", ties: "tie",
  geese: "goose", mice: "mouse", teeth: "tooth", feet: "foot",
  // Singular ends in "-che"/"-she", so the general "-ches"/"-shes" rule would cut too much.
  quiches: "quiche", brioches: "brioche", ganaches: "ganache", cloches: "cloche",
  caches: "cache", niches: "niche", panaches: "panache",
};

export function singularizeWord(word) {
  if (Object.prototype.hasOwnProperty.call(IRREGULAR, word)) return IRREGULAR[word];
  if (word.length <= 3 || UNCHANGED.has(word)) return word;
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";          // berries -> berry
  if (word.endsWith("oes")) return word.slice(0, -2);                // potatoes -> potato
  if (/(ch|sh|x|z|ss)es$/.test(word)) return word.slice(0, -2);      // peaches, radishes, boxes, glasses
  if (word.endsWith("ss") || word.endsWith("us")) return word;       // glass, hummus
  if (word.endsWith("s")) return word.slice(0, -1);                  // onions, kiwis
  return word;
}

// True when two normalized words are the same word, allowing a trailing "s"/"es"
// difference the rules above didn't catch. Whole words only ("pea" never matches "peanut").
export function wordsMatch(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a + "s" === b || b + "s" === a || a + "es" === b || b + "es" === a;
}

export function normalizeName(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(singularizeWord)
    .join(" ");
}

const UNIT_ALIASES = {
  lb: ["lb", "lbs", "pound", "pounds"],
  oz: ["oz", "ounce", "ounces"],
  tbsp: ["tbsp", "tbs", "tbl", "tablespoon", "tablespoons"],
  tsp: ["tsp", "teaspoon", "teaspoons"],
  cup: ["cup", "cups", "c"],
  clove: ["clove", "cloves"],
  g: ["g", "gram", "grams"],
  kg: ["kg", "kilogram", "kilograms"],
  ml: ["ml", "milliliter", "milliliters", "millilitre", "millilitres"],
  l: ["l", "liter", "liters", "litre", "litres"],
  can: ["can", "cans"],
  "": ["", "whole", "each", "ea"],
};
const UNIT_MAP = {};
for (const [canonical, aliases] of Object.entries(UNIT_ALIASES)) {
  for (const a of aliases) UNIT_MAP[a] = canonical;
}

// Case matters only for the one-letter cooking shorthands: "T" = tablespoon, "t" = teaspoon.
const CASE_SENSITIVE_UNITS = { T: "tbsp", t: "tsp" };

export function normalizeUnit(unit) {
  const raw = String(unit ?? "").trim().replace(/\.$/, "");
  if (Object.prototype.hasOwnProperty.call(CASE_SENSITIVE_UNITS, raw)) return CASE_SENSITIVE_UNITS[raw];
  const u = raw.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(UNIT_MAP, u)) return UNIT_MAP[u];
  return singularizeWord(u);
}

export function ingredientKey(name, unit) {
  return `${normalizeName(name)}|${normalizeUnit(unit)}`;
}
