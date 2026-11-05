import { parseQuantity } from "./quantity";

// Turns pasted recipe text into form rows, so the user can paste a whole ingredient list
// or method instead of typing it field by field. The result is shown for review in the
// recipe form; nothing here needs to be perfect, only a good first draft.

// One number: "1 1/2", "1-1/2", "1½", "½", "1/2", "1.5", ".5", "2".
const NUM = String.raw`(?:\d+\s+\d+\s*\/\s*\d+|\d+-\d+\/\d+|\d*\s?[½¼¾⅓⅔⅛⅜⅝⅞]|\d+\s*\/\s*\d+|\d+(?:\.\d+)?|\.\d+)`;
// A number or a range of two ("1-2", "1 to 2").
const QTY_RE = new RegExp(String.raw`^(${NUM}(?:\s*(?:-|–|—|to)\s*${NUM})?)(?=\s|$|[a-zA-Z(])`, "i");

// Unit words (as written in recipes). Matched case-insensitively, except the one-letter
// T / t shorthands, which only count as units when followed by more text.
const UNITS = new Set([
  "cup", "cups", "c", "tablespoon", "tablespoons", "tbsp", "tbsps", "tbs", "tbl", "teaspoon", "teaspoons", "tsp",
  "tsps", "ounce", "ounces", "oz", "fl oz", "pound", "pounds", "lb", "lbs", "gram", "grams", "g", "kilogram",
  "kilograms", "kg", "milliliter", "milliliters", "millilitre", "millilitres", "ml", "liter", "liters", "litre",
  "litres", "l", "quart", "quarts", "qt", "pint", "pints", "pt", "gallon", "gallons", "gal", "can", "cans",
  "clove", "cloves", "pinch", "pinches", "dash", "dashes", "package", "packages", "pkg", "packet", "packets",
  "stick", "sticks", "slice", "slices", "bunch", "bunches", "head", "heads", "sprig", "sprigs", "piece", "pieces",
  "jar", "jars", "bottle", "bottles", "bag", "bags", "box", "boxes", "handful", "handfuls", "leaf", "leaves",
  "stalk", "stalks", "rib", "ribs", "fillet", "fillets", "whole", "drop", "drops",
]);

// Lines that are headings rather than ingredients or steps.
const HEADING_RE = /^(ingredients?|directions?|instructions?|method|steps?|preparation|for the .+|to serve|garnish)\s*:?$/i;
const BULLET_RE = /^\s*(?:[-*•·▢□◦‣–—]|\[\s?\]|\d+\s*[.)]\s+|step\s*\d+\s*[:.)-]?)\s*/i;

const clean = (s) => s.replace(/\s+/g, " ").trim();

function splitLines(text) {
  return String(text ?? "")
    .split(/\r?\n/)
    .map(clean)
    .filter((line) => line && !HEADING_RE.test(line) && !/:$/.test(line));
}

// One step or ingredient with any leading bullet or number removed.
export const stripBullet = (line) => clean(String(line ?? "").replace(BULLET_RE, ""));

export function parseIngredientLine(rawLine) {
  let line = clean(String(rawLine ?? "")).replace(BULLET_RE, "");
  const result = { quantityUnit: "", unit: "", name: "", note: "" };
  if (!line) return result;
  const notes = [];

  const qty = line.match(QTY_RE);
  if (qty && parseQuantity(qty[1]).kind === "number") {
    result.quantityUnit = clean(qty[1]);
    line = line.slice(qty[0].length).trim();
  } else {
    const article = line.match(/^(a|an)\s+/i);
    if (article) {
      // "a pinch of salt" -> amount 1 only when a unit follows; "an onion" -> 1.
      result.quantityUnit = "1";
      line = line.slice(article[0].length);
    }
  }

  // Size in brackets right after the amount: "1 (14.5 oz) can tomatoes".
  const paren = line.match(/^\(([^)]*)\)\s*/);
  if (paren) {
    notes.push(clean(paren[1]));
    line = line.slice(paren[0].length);
  }

  // Unit: "fl oz" is two words; T / t are case-sensitive shorthands.
  const twoWords = line.match(/^(fl\.?\s*oz\.?)\s+/i);
  const oneWord = line.match(/^([A-Za-z]+)\.?\s+/);
  if (twoWords) {
    result.unit = "fl oz";
    line = line.slice(twoWords[0].length);
  } else if (oneWord && (UNITS.has(oneWord[1].toLowerCase()) || oneWord[1] === "T" || oneWord[1] === "t")) {
    // "c" and "l" are units only after an amount ("c" alone is rarely an ingredient).
    if (result.quantityUnit || oneWord[1].length > 1) {
      result.unit = oneWord[1];
      line = line.slice(oneWord[0].length);
    }
  }
  line = line.replace(/^of\s+/i, "");

  // Note: after the first comma, or a trailing bracket.
  const toTaste = line.match(/,?\s+to taste$/i);
  if (toTaste) {
    line = line.slice(0, toTaste.index);
    notes.push("to taste");
  }
  const comma = line.indexOf(",");
  if (comma >= 0) {
    notes.push(clean(line.slice(comma + 1)));
    line = line.slice(0, comma);
  }
  const trailing = line.match(/\s*\(([^)]*)\)\s*$/);
  if (trailing) {
    notes.push(clean(trailing[1]));
    line = line.slice(0, trailing.index);
  }

  result.name = clean(line);
  result.note = notes.filter(Boolean).join("; ");
  // Nothing left for a name (e.g. a line that was only "2 cups"): keep the text as the name.
  if (!result.name) {
    result.name = clean([result.quantityUnit, result.unit].join(" "));
    result.quantityUnit = "";
    result.unit = "";
  }
  return result;
}

export function parseIngredientList(text) {
  return splitLines(text).map(parseIngredientLine).filter((i) => i.name);
}

export function parseDirections(text) {
  return splitLines(text)
    .map((line) => clean(line.replace(BULLET_RE, "")))
    .filter(Boolean);
}
