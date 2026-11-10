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

// query: name or ingredient text. favoritesOnly: favorite === true.
// maxMinutes / maxPrep / maxActive: inclusive limits on total, prep and cook (`time.active`)
// minutes. While any time limit is on, recipes with no time set are left out; a blank prep
// or cook time counts as 0 (e.g. a no-prep recipe).
// difficulties: levels to keep (empty = any); recipes with no recognised level are left out
// while it's on. With no filters set every recipe is returned, so none are hidden by default.
export function filterRecipes(
  recipes,
  { query = "", favoritesOnly = false, maxMinutes = null, maxPrep = null, maxActive = null, difficulties = [] } = {}
) {
  const q = String(query ?? "").trim().toLowerCase();
  const levels = new Set(difficulties ?? []);
  const timeOn = isLimit(maxMinutes) || isLimit(maxPrep) || isLimit(maxActive);
  return recipes.filter((recipe) => {
    if (favoritesOnly && recipe.favorite !== true) return false;
    if (timeOn) {
      const total = totalMinutes(recipe);
      if (total <= 0) return false;
      if (isLimit(maxMinutes) && total > Number(maxMinutes)) return false;
      if (isLimit(maxPrep) && minutesOf(recipe.time?.prep) > Number(maxPrep)) return false;
      if (isLimit(maxActive) && minutesOf(recipe.time?.active) > Number(maxActive)) return false;
    }
    if (levels.size > 0 && !levels.has(difficultyLevel(recipe.difficulty))) return false;
    if (q === "") return true;
    if (String(recipe.name ?? "").toLowerCase().includes(q)) return true;
    return (recipe.ingredients ?? []).some((i) =>
      String(i?.name ?? "").toLowerCase().includes(q)
    );
  });
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
  if (isLimit(f.maxMinutes)) parts.push(`Up to ${limit(f.maxMinutes)}`);
  if (isLimit(f.maxPrep)) parts.push(`Prep up to ${limit(f.maxPrep)}`);
  if (isLimit(f.maxActive)) parts.push(`Cook up to ${limit(f.maxActive)}`);
  const levels = DIFFICULTY_LEVELS.filter((l) => f.difficulties.includes(l));
  if (levels.length > 0) parts.push(levels.join(" or "));
  return parts;
}
