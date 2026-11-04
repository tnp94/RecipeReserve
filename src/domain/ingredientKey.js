export function singularizeWord(word) {
  if (word.length <= 3) return word;
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("oes")) return word.slice(0, -2);
  if (word.endsWith("ss") || word.endsWith("us") || word.endsWith("is")) return word;
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
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

export function normalizeUnit(unit) {
  const u = String(unit ?? "").toLowerCase().trim().replace(/\.$/, "");
  if (Object.prototype.hasOwnProperty.call(UNIT_MAP, u)) return UNIT_MAP[u];
  return singularizeWord(u);
}

export function ingredientKey(name, unit) {
  return `${normalizeName(name)}|${normalizeUnit(unit)}`;
}
