import { normalizeName, wordsMatch } from "./ingredientKey";

export const FINDER_SORT_FEWEST_MISSING = "fewestMissing";
export const FINDER_SORT_MOST_USED = "mostUsed";

const words = (name) => normalizeName(name).split(" ").filter(Boolean);

// Expiring ingredients come first in every sort: the tag means "prefer recipes that use it".
const cmpTieBreak = (a, b) =>
  a.missing.length - b.missing.length ||
  b.matchedCount / b.totalCount - a.matchedCount / a.totalCount ||
  a.recipe.name.localeCompare(b.recipe.name);
const cmpFewestMissing = (a, b) => b.expiringCount - a.expiringCount || cmpTieBreak(a, b);
const cmpMostUsed = (a, b) => b.expiringCount - a.expiringCount || b.usedCount - a.usedCount || cmpTieBreak(a, b);

// The one matching rule: every word the user entered appears (allowing a trailing
// s/es difference) among the recipe ingredient's words.
function wordsMatchAll(haveWords, recipeWords) {
  return haveWords.length > 0 && haveWords.every((w) => recipeWords.some((r) => wordsMatch(w, r)));
}

export function ingredientMatches(haveName, recipeIngredientName) {
  return wordsMatchAll(words(haveName), words(recipeIngredientName));
}

export function findRecipes(recipes, haveIngredients, { maxMissing = 2 } = {}) {
  const result = { fullMatches: [], nearMatches: [], otherMatches: [] };
  if (!haveIngredients || haveIngredients.length === 0) return result;

  // Normalize each entered ingredient once, not once per recipe ingredient.
  const haves = haveIngredients.map((h) => ({ tag: h.tag, words: words(h.name) })).filter((h) => h.words.length > 0);
  // A "Must use" ingredient that normalizes to nothing (e.g. "!!") can never match.
  if (haveIngredients.some((h) => h.tag === "required" && words(h.name).length === 0)) return result;

  for (const recipe of recipes ?? []) {
    const seen = new Set();
    const candidates = [];
    for (const ing of recipe.ingredients ?? []) {
      if (!String(ing?.name ?? "").trim()) continue;
      const key = normalizeName(ing.name);
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({ ing, words: key.split(" ").filter(Boolean) });
    }
    if (candidates.length === 0) continue;

    // hit[i][j]: entered ingredient i matches recipe ingredient j.
    const hit = haves.map((h) => candidates.map((c) => wordsMatchAll(h.words, c.words)));
    const matched = candidates.filter((_, j) => hit.some((row) => row[j]));
    const missing = candidates.filter((_, j) => !hit.some((row) => row[j])).map((c) => c.ing);
    const matchesAny = (i) => hit[i].some(Boolean);

    if (matched.length === 0) continue;
    if (haves.some((h, i) => h.tag === "required" && !matchesAny(i))) continue;

    const expiringCount = haves.filter((h, i) => h.tag === "expiring" && matchesAny(i)).length;
    const item = {
      recipe,
      matchedCount: matched.length,
      totalCount: candidates.length,
      // How many entered ingredients the recipe uses. Differs from matchedCount, which
      // counts recipe ingredients: "pepper" can match both "black pepper" and "red pepper".
      usedCount: haves.filter((_, i) => matchesAny(i)).length,
      missing,
      expiringCount,
      isFullMatch: missing.length === 0,
      tooManyMissing: missing.length > maxMissing,
    };
    if (item.isFullMatch) result.fullMatches.push(item);
    else if (!item.tooManyMissing) result.nearMatches.push(item);
    else result.otherMatches.push(item);
  }

  result.fullMatches.sort(cmpFewestMissing);
  result.nearMatches.sort(cmpFewestMissing);
  result.otherMatches.sort(cmpFewestMissing);
  return result;
}

// One flat list, best use of the entered ingredients first. It isn't split into
// findRecipes' groups: those go by missing count, so a recipe using everything on the
// list could otherwise sit below a full match that uses one item.
export function rankByMostUsed({ fullMatches, nearMatches, otherMatches }) {
  return [...fullMatches, ...nearMatches, ...otherMatches].sort(cmpMostUsed);
}
