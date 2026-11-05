import { parseDirections, parseIngredientLine, parseIngredientList, stripBullet } from "./ingredientParse";

// Turns a pasted block of text or a recipe web page into a draft for the recipe form:
//   { name, ingredients: [{ quantityUnit, unit, name, note }], directions: [string],
//     time: { prep, active }, yield, calories }
// Every "get a recipe in without typing it" route produces this same draft, and the form is
// the review step. Numbers are 0 when not found. Nothing here needs to be perfect, only a
// good first draft.

const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

// ----- amounts of time -----

// "1 hr 20 min", "1h20m", "90 minutes", "1 1/2 hours", "30-40 minutes" (the upper end).
export function parseDurationText(text) {
  const s = String(text ?? "").toLowerCase();
  const mixed = s.match(/(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)\s*(?:h|hrs?|hours?)\b/);
  let hours = 0;
  if (mixed) {
    hours = Number(mixed[1] ?? 0) + Number(mixed[2]) / Number(mixed[3]);
  } else {
    const h = s.match(/(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)(?![a-z])/);
    if (h) hours = Number(h[1]);
  }
  const m = s.match(/(\d+)\s*(?:m|mins?|minutes?)(?![a-z])/);
  return Math.round(hours * 60 + (m ? Number(m[1]) : 0));
}

// ISO 8601 ("PT1H30M", "P0DT45M"), as used by schema.org. Falls back to plain text.
export function parseIsoDuration(value) {
  if (typeof value === "number") return Math.round(value);
  const s = clean(value);
  const iso = s.match(/^P(?:(\d+)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
  if (!iso) return parseDurationText(s);
  const [, d, h, m, sec] = iso;
  return Math.round(Number(d ?? 0) * 1440 + Number(h ?? 0) * 60 + Number(m ?? 0) + Number(sec ?? 0) / 60);
}

// Only a total given: count it as cook time, less any prep that was given.
const draftTime = ({ prep = 0, cook = 0, total = 0 }) => ({
  prep,
  active: cook || Math.max(0, total - prep),
});

const firstNumber = (value) => {
  const match = String(value ?? "").replace(/,/g, "").match(/\d+/);
  return match ? Number(match[0]) : 0;
};

// ----- pasted text -----

const INGREDIENTS_HEADING = /^(ingredients?|what you('|’)?ll need|you will need)\s*:?$/i;
const DIRECTIONS_HEADING = /^(directions?|instructions?|method|steps?|preparation|how to make( it)?)\s*:?$/i;
const OTHER_HEADING = /^(notes?|tips?|storage|nutrition( facts| information)?|description|equipment)\s*:?$/i;
const TIME_LINE = /^(prep(?:aration)?|cook(?:ing)?|bak(?:e|ing)|active|total)(?:\s+time\s*:?|\s*:)\s*(.+)$/i;
const YIELD_LINE = /^(?:serves|servings?|yields?|makes|portions?)\s*:?\s*(?:about\s+)?(\d+)/i;
const CALORIES_LINE = /^calories\s*:?\s*([\d,]+)|^([\d,]+)\s*(?:k?cal|calories)\b/i;
const NUMBERED_LINE = /^(?:\d+\s*[.)]\s+|step\s*\d+\b)/i;
const NUMBER_ONLY_LINE = /^(?:step\s*)?\d+\s*[.):]?$/i;
const META_MAX_LENGTH = 40;

// Reads "Prep time: 15 min | Serves 4" into `meta`. Returns true if the line held any.
function readMetaLine(line, meta) {
  let found = false;
  for (const piece of line.split(/\s*[|•·]\s*/)) {
    if (!piece || piece.length > META_MAX_LENGTH) continue;
    const time = piece.match(TIME_LINE);
    if (time) {
      const minutes = parseDurationText(time[2]);
      if (minutes > 0) {
        const kind = time[1].toLowerCase();
        if (kind.startsWith("prep")) meta.prep = minutes;
        else if (kind === "total") meta.total = minutes;
        else meta.cook = minutes;
        found = true;
        continue;
      }
    }
    const servings = piece.match(YIELD_LINE);
    if (servings) {
      meta.yield = Number(servings[1]);
      found = true;
      continue;
    }
    const calories = piece.match(CALORIES_LINE);
    if (calories) {
      meta.calories = firstNumber(calories[1] ?? calories[2]);
      found = true;
    }
  }
  return found;
}

const looksLikeStep = (line) => NUMBERED_LINE.test(line) || line.length > 80 || /[.!?]$/.test(line);
const looksLikeIngredient = (line) => !looksLikeStep(line) && !!parseIngredientLine(line).quantityUnit;

// Copied or scanned steps often wrap across lines. Numbered steps: a line with no number
// continues the one before. Otherwise a line continues when the last one had no ending
// punctuation and this one starts in lower case.
function joinWrappedSteps(lines) {
  const numbered = lines.filter((l) => NUMBERED_LINE.test(l) || NUMBER_ONLY_LINE.test(l)).length >= 2;
  const steps = [];
  let startNew = true;
  for (const line of lines) {
    if (NUMBER_ONLY_LINE.test(line)) {
      startNew = true;
      continue;
    }
    const previous = steps[steps.length - 1];
    const continues =
      previous !== undefined &&
      !startNew &&
      (numbered ? !NUMBERED_LINE.test(line) : !/[.!?:]$/.test(previous) && /^[a-z]/.test(line));
    if (continues) steps[steps.length - 1] = `${previous} ${line}`;
    else steps.push(line);
    startNew = false;
  }
  return steps;
}

export function parseRecipeText(text) {
  const lines = String(text ?? "").split(/\r?\n/).map(clean).filter(Boolean);
  const hasIngredientsHeading = lines.some((l) => INGREDIENTS_HEADING.test(l));
  const hasDirectionsHeading = lines.some((l) => DIRECTIONS_HEADING.test(l));
  const hasHeading = hasIngredientsHeading || hasDirectionsHeading;

  const meta = { prep: 0, cook: 0, total: 0, yield: 0, calories: 0 };
  const ingredientLines = [];
  const directionLines = [];
  let name = "";
  let section = null; // null (before any heading) | "ingredients" | "directions" | "other"
  let seenBody = false;

  for (const line of lines) {
    // A bare number outside the method is a page number picked up by a scan.
    if (section !== "directions" && /^\d+$/.test(line)) continue;
    if (INGREDIENTS_HEADING.test(line)) section = "ingredients";
    else if (DIRECTIONS_HEADING.test(line)) section = "directions";
    else if (OTHER_HEADING.test(line)) section = "other";
    else if (section !== "directions" && readMetaLine(line, meta)) continue;
    else if (section === "directions") directionLines.push(line);
    else if (section === "ingredients") {
      // No directions heading to come: the first sentence-like line starts the method.
      if (!hasDirectionsHeading && looksLikeStep(line)) {
        section = "directions";
        directionLines.push(line);
      } else ingredientLines.push(line);
    } else if (section === null) {
      if (!name && !seenBody && !looksLikeStep(line) && !looksLikeIngredient(line)) {
        name = line.replace(/^recipe\s*:\s*/i, "");
      } else if (!hasHeading) {
        // No headings at all: sort by shape. Short lines before the method are ingredients.
        seenBody = true;
        if (looksLikeStep(line) || directionLines.length > 0) directionLines.push(line);
        else ingredientLines.push(line);
      }
    }
  }

  return {
    name,
    ingredients: parseIngredientList(ingredientLines.join("\n")),
    directions: parseDirections(joinWrappedSteps(directionLines).join("\n")),
    time: draftTime(meta),
    yield: meta.yield,
    calories: meta.calories,
  };
}

// ----- web pages (schema.org Recipe as JSON-LD) -----

const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", deg: "°", ndash: "–", mdash: "—",
  frac12: "½", frac14: "¼", frac34: "¾", frac13: "⅓", frac23: "⅔", frac18: "⅛", rsquo: "’", lsquo: "‘",
  rdquo: "”", ldquo: "“", hellip: "…", eacute: "é", egrave: "è", ntilde: "ñ",
};

const decodeEntities = (s) =>
  String(s ?? "").replace(/&(#\d+|#x[\da-f]+|[a-z]\w*);/gi, (whole, code) => {
    if (code[0] !== "#") return ENTITIES[code.toLowerCase()] ?? whole;
    const point = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return Number.isFinite(point) && point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : whole;
  });

// Decodes twice because sites often encode their text twice ("&amp;amp;", "&lt;p&gt;").
const toPlainText = (value) => {
  const withBreaks = decodeEntities(value).replace(/<\s*(br|\/p|\/li|\/div|\/h\d)\b[^>]*>/gi, "\n");
  return decodeEntities(withBreaks.replace(/<[^>]*>/g, " "));
};

const isRecipeNode = (node) => {
  const type = node?.["@type"];
  return (Array.isArray(type) ? type : [type]).some((t) => /(^|[:/#])recipe$/i.test(String(t ?? "")));
};

// JSON-LD nests its recipe in arrays, @graph or mainEntity. Search everything, and prefer a
// node that actually lists ingredients over a bare reference to one.
function findRecipeNode(root) {
  const candidates = [];
  const walk = (node, depth) => {
    if (!node || typeof node !== "object" || depth > 8) return;
    if (Array.isArray(node)) {
      node.forEach((child) => walk(child, depth + 1));
      return;
    }
    if (isRecipeNode(node)) candidates.push(node);
    Object.values(node).forEach((child) => walk(child, depth + 1));
  };
  walk(root, 0);
  return candidates.find((n) => n.recipeIngredient || n.ingredients) ?? candidates[0] ?? null;
}

function parseJsonLoosely(raw) {
  const body = raw.replace(/^\s*(?:<!--|\/\/\s*<!\[CDATA\[)/, "").replace(/(?:-->|\/\/\s*\]\]>)\s*$/, "");
  try {
    return JSON.parse(body);
  } catch {
    // Raw line breaks inside strings are invalid JSON but common on real sites.
    try {
      return JSON.parse(body.replace(/[\u0000-\u001f]+/g, " "));
    } catch {
      return null;
    }
  }
}

function instructionSteps(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(instructionSteps);
  if (typeof value === "object") {
    // HowToSection and ItemList hold their steps in itemListElement.
    if (value.itemListElement) return instructionSteps(value.itemListElement);
    return instructionSteps(value.text ?? value.name);
  }
  return toPlainText(value).split(/\r?\n/).map(stripBullet).filter(Boolean);
}

function ingredientRows(value) {
  const list = Array.isArray(value) ? value : [value];
  return list
    .flatMap((item) => toPlainText(typeof item === "object" ? item?.name : item).split(/\r?\n/))
    .map((line) => parseIngredientLine(line))
    .filter((row) => row.name);
}

// Returns a draft, or null if the page has no recipe data we can read.
export function parseRecipeHtml(html) {
  const blocks = String(html ?? "").matchAll(/<script\b[^>]*\btype\s*=\s*["']?application\/ld\+json\b[^>]*>([\s\S]*?)<\/script\s*>/gi);
  for (const block of blocks) {
    const node = findRecipeNode(parseJsonLoosely(block[1]));
    if (!node) continue;
    const draft = {
      name: clean(toPlainText(node.name)),
      ingredients: ingredientRows(node.recipeIngredient ?? node.ingredients ?? []),
      directions: instructionSteps(node.recipeInstructions),
      time: draftTime({
        prep: parseIsoDuration(node.prepTime),
        cook: parseIsoDuration(node.cookTime),
        total: parseIsoDuration(node.totalTime),
      }),
      yield: firstNumber(Array.isArray(node.recipeYield) ? node.recipeYield[0] : node.recipeYield),
      calories: firstNumber(node.nutrition?.calories),
    };
    if (hasRecipeContent(draft)) return draft;
  }
  return null;
}

// ----- shared helpers -----

export const hasRecipeContent = (draft) => !!draft && (draft.ingredients.length > 0 || draft.directions.length > 0);

// What the import could not find, so the form can point the user at it.
export function missingParts(draft) {
  const missing = [];
  if (!draft.name) missing.push("name");
  if (draft.ingredients.length === 0) missing.push("ingredients");
  if (draft.directions.length === 0) missing.push("directions");
  return missing;
}

// Finds the link in what the user typed or shared ("Try this https://x.com/y!", "x.com/y").
export function extractUrl(text) {
  const s = String(text ?? "").trim();
  const full = s.match(/https?:\/\/[^\s<>"']+/i);
  if (full) return full[0].replace(/[).,;!?\]]+$/, "");
  return /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(s) ? `https://${s}` : null;
}
