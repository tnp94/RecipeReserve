import { normalizeName, wordsMatch } from "./ingredientKey";

const words = (name) => normalizeName(name).split(" ").filter(Boolean);

export function ingredientMatches(haveName, recipeIngredientName) {
  const haveWords = words(haveName);
  const recipeWords = words(recipeIngredientName);
  return haveWords.length > 0 && haveWords.every((w) => recipeWords.some((r) => wordsMatch(w, r)));
}

export function findRecipes(recipes, haveIngredients, { maxMissing = 2 } = {}) {
  const result = { fullMatches: [], nearMatches: [], otherMatches: [] };
  if (!haveIngredients || haveIngredients.length === 0) return result;

  // Normalize each entered ingredient once, not once per recipe ingredient.
  const haves = haveIngredients.map((h) => ({ tag: h.tag, words: words(h.name) })).filter((h) => h.words.length > 0);
  const matches = (have, recipeWords) => have.words.every((w) => recipeWords.some((r) => wordsMatch(w, r)));
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
    const hit = haves.map((h) => candidates.map((c) => matches(h, c.words)));
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
      missing,
      expiringCount,
      isFullMatch: missing.length === 0,
    };
    if (item.isFullMatch) result.fullMatches.push(item);
    else if (missing.length <= maxMissing) result.nearMatches.push(item);
    else result.otherMatches.push(item);
  }

  const cmp = (a, b) =>
    b.expiringCount - a.expiringCount ||
    b.matchedCount / b.totalCount - a.matchedCount / a.totalCount ||
    a.missing.length - b.missing.length ||
    a.recipe.name.localeCompare(b.recipe.name);
  result.fullMatches.sort(cmp);
  result.nearMatches.sort(cmp);
  result.otherMatches.sort(cmp);
  return result;
}
