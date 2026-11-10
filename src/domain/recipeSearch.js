import { formatMinutes, totalMinutes } from "./format";

export const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];

// The recipe list's filters. A null time limit is off; difficulties [] means any.
export const NO_FILTERS = { favoritesOnly: false, maxMinutes: null, maxPrep: null, maxActive: null, difficulties: [] };

// Older recipes can hold free-text difficulty. Words with a clear meaning map to a level.
const DIFFICULTY_WORDS = {
  easy: "Easy",
  "very easy": "Easy",
  simple: "Easy",
  beginner: "Easy",
  medium: "Medium",
  moderate: "Medium",
  intermediate: "Medium",
  average: "Medium",
  hard: "Hard",
  "very hard": "Hard",
  difficult: "Hard",
  advanced: "Hard",
  challenging: "Hard",
};

// "Easy" | "Medium" | "Hard", or "" when the value is blank or unrecognised.
export function difficultyLevel(value) {
  const key = String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return DIFFICULTY_WORDS[key] ?? "";
}

const isLimit = (v) => v != null && v !== "" && Number.isFinite(Number(v));
const minutesOf = (v) => Number(v) || 0;

const timeFilterOn = (f) => isLimit(f.maxMinutes) || isLimit(f.maxPrep) || isLimit(f.maxActive);

// The total-time limit actually applied. A total can't be smaller than prep + cook (a blank one
// counts as 0), so while the Advanced limits add up to more than the typed total, their sum is
// used instead and `overridden` is true. The typed total is kept, and applies again once
// prep + cook drops back to it or below. { limit: null } when no total is set.
export function effectiveTotalLimit(filters) {
  const f = { ...NO_FILTERS, ...filters };
  if (!isLimit(f.maxMinutes)) return { limit: null, overridden: false, typed: null };
  const typed = Number(f.maxMinutes);
  if (!isLimit(f.maxPrep) && !isLimit(f.maxActive)) return { limit: typed, overridden: false, typed };
  const sum = (isLimit(f.maxPrep) ? Number(f.maxPrep) : 0) + (isLimit(f.maxActive) ? Number(f.maxActive) : 0);
  return sum > typed ? { limit: sum, overridden: true, typed } : { limit: typed, overridden: false, typed };
}

// "match", "unknown" (passes every filter it can be checked against, but a time or difficulty
// filter is on and the recipe doesn't have that value set) or "out".
function classify(recipe, f, q, levels, totalLimit) {
  if (f.favoritesOnly && recipe.favorite !== true) return "out";
  if (q !== "") {
    const inName = String(recipe.name ?? "").toLowerCase().includes(q);
    const inIngredients = (recipe.ingredients ?? []).some((i) => String(i?.name ?? "").toLowerCase().includes(q));
    if (!inName && !inIngredients) return "out";
  }
  let unknown = false;
  if (timeFilterOn(f)) {
    const total = totalMinutes(recipe);
    if (total <= 0) unknown = true;
    else {
      if (totalLimit != null && total > totalLimit) return "out";
      if (isLimit(f.maxPrep) && minutesOf(recipe.time?.prep) > Number(f.maxPrep)) return "out";
      if (isLimit(f.maxActive) && minutesOf(recipe.time?.active) > Number(f.maxActive)) return "out";
    }
  }
  if (levels.size > 0) {
    const level = difficultyLevel(recipe.difficulty);
    if (level === "") unknown = true;
    else if (!levels.has(level)) return "out";
  }
  return unknown ? "unknown" : "match";
}

// query: name or ingredient text. favoritesOnly: favorite === true.
// maxMinutes / maxPrep / maxActive: inclusive limits on total, prep and cook (`time.active`)
// minutes; a blank prep or cook time counts as 0 (e.g. a no-prep recipe).
// difficulties: levels to keep (empty = any).
// Returns { matches, unknown }: `unknown` holds recipes that can't be checked against an active
// time or difficulty filter because they have no time / no recognised difficulty set, but
// pass everything else. The list shows them under a divider rather than hiding them.
// Input order is kept in both. With no filters set every recipe is a match.
export function splitRecipes(recipes, { query = "", ...filters } = {}) {
  const f = { ...NO_FILTERS, ...filters };
  const q = String(query ?? "").trim().toLowerCase();
  const levels = new Set(f.difficulties ?? []);
  const totalLimit = effectiveTotalLimit(f).limit;
  const matches = [];
  const unknown = [];
  for (const recipe of recipes) {
    const kind = classify(recipe, f, q, levels, totalLimit);
    if (kind === "match") matches.push(recipe);
    else if (kind === "unknown") unknown.push(recipe);
  }
  return { matches, unknown };
}

// Only the sure matches (see splitRecipes).
export function filterRecipes(recipes, options) {
  return splitRecipes(recipes, options).matches;
}

// Divider title for splitRecipes' `unknown` group, from which filters are on.
export function unknownLabel(filters) {
  const f = { ...NO_FILTERS, ...filters };
  const time = timeFilterOn(f);
  const difficulty = f.difficulties.length > 0;
  if (time && difficulty) return "No time or difficulty set";
  if (time) return "No time set";
  if (difficulty) return "No difficulty set";
  return "";
}

// How many of the dropdown's filters are on (Favorites has its own chip, so it isn't counted).
export function activeFilterCount(filters) {
  const f = { ...NO_FILTERS, ...filters };
  return [f.maxMinutes, f.maxPrep, f.maxActive].filter(isLimit).length + (f.difficulties.length > 0 ? 1 : 0);
}

// Short description of the dropdown's filters for when it's closed, e.g.
// ["Up to 30 min", "Prep up to 10 min", "Easy or Medium"]. [] when none are on.
export function filterSummary(filters) {
  const f = { ...NO_FILTERS, ...filters };
  const limit = (v) => (Number(v) === 0 ? "0 min" : formatMinutes(v));
  const parts = [];
  const total = effectiveTotalLimit(f);
  if (total.limit != null) parts.push(`Up to ${limit(total.limit)}${total.overridden ? " (prep + cook)" : ""}`);
  if (isLimit(f.maxPrep)) parts.push(`Prep up to ${limit(f.maxPrep)}`);
  if (isLimit(f.maxActive)) parts.push(`Cook up to ${limit(f.maxActive)}`);
  const levels = DIFFICULTY_LEVELS.filter((l) => f.difficulties.includes(l));
  if (levels.length > 0) parts.push(levels.join(" or "));
  return parts;
}
