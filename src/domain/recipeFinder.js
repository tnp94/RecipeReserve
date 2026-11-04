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

  for (const recipe of recipes ?? []) {
    const seen = new Set();
    const candidates = [];
    for (const ing of recipe.ingredients ?? []) {
      if (!String(ing?.name ?? "").trim()) continue;
      const key = normalizeName(ing.name);
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push(ing);
    }
    if (candidates.length === 0) continue;

    const matchesAny = (have) =>
      candidates.some((c) => ingredientMatches(have.name, c.name));
    const matched = candidates.filter((c) =>
      haveIngredients.some((h) => ingredientMatches(h.name, c.name))
    );
    const missing = candidates.filter((c) => !matched.includes(c));

    if (matched.length === 0) continue;
    if (haveIngredients.some((h) => h.tag === "required" && !matchesAny(h))) continue;

    const expiringCount = haveIngredients.filter(
      (h) => h.tag === "expiring" && matchesAny(h)
    ).length;

    const item = {
      recipe,
      matchedCount: matched.length,
      totalCount: candidates.length,
      missing,
      expiringCount,
      isFullMatch: missing.length === 0,
    };
    if (item.isFullMatch) result.fullMatches.push(item);
    else if (missing.length > maxMissing) result.otherMatches.push(item);
    else result.nearMatches.push(item);
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
