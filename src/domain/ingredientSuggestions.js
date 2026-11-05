import { normalizeName } from "./ingredientKey";

export function collectIngredientNames(recipes) {
  const seen = new Set();
  const names = [];
  for (const recipe of recipes ?? []) {
    for (const ing of recipe?.ingredients ?? []) {
      const name = String(ing?.name ?? "").trim();
      const key = normalizeName(name);
      if (!name || !key || seen.has(key)) continue;
      seen.add(key);
      names.push(name);
    }
  }
  return names.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

export function suggestIngredients(allNames, query, { exclude = [], limit = 8 } = {}) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return [];
  const nq = normalizeName(q);
  const excluded = new Set(exclude.map((e) => normalizeName(e)));
  const scored = [];
  for (const name of allNames ?? []) {
    const lower = name.toLowerCase();
    const nn = normalizeName(name);
    if (excluded.has(nn)) continue;
    if (!(lower.includes(q) || (nq && nn.includes(nq)))) continue;
    let rank = 2;
    if (lower.startsWith(q)) rank = 0;
    else if (lower.split(/[^a-z0-9]+/).some((w) => w && w.startsWith(q))) rank = 1;
    scored.push({ name, rank });
  }
  scored.sort((a, b) => a.rank - b.rank || a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
  return scored.slice(0, limit).map((s) => s.name);
}
