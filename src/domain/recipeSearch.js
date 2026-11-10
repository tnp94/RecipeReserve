import { totalMinutes } from "./format";

export const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"];

// Total-time filter choices for the recipe list. A recipe matches when its prep + active
// time is at most `maxMinutes` ("Under 30 min" includes a 30-minute recipe).
export const TIME_FILTERS = [
  { maxMinutes: 15, label: "Under 15 min" },
  { maxMinutes: 30, label: "Under 30 min" },
  { maxMinutes: 60, label: "Under 1 hr" },
];

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

// query: name or ingredient text. favoritesOnly: favorite === true.
// maxMinutes: total time at most this; recipes with no time set are left out while it's on.
// difficulties: levels to keep (empty = any); recipes with no recognised level are left out
// while it's on. With no filters set every recipe is returned, so none are hidden by default.
export function filterRecipes(recipes, { query = "", favoritesOnly = false, maxMinutes = null, difficulties = [] } = {}) {
  const q = String(query ?? "").trim().toLowerCase();
  const levels = new Set(difficulties ?? []);
  return recipes.filter((recipe) => {
    if (favoritesOnly && recipe.favorite !== true) return false;
    if (maxMinutes != null) {
      const minutes = totalMinutes(recipe);
      if (minutes <= 0 || minutes > maxMinutes) return false;
    }
    if (levels.size > 0 && !levels.has(difficultyLevel(recipe.difficulty))) return false;
    if (q === "") return true;
    if (String(recipe.name ?? "").toLowerCase().includes(q)) return true;
    return (recipe.ingredients ?? []).some((i) =>
      String(i?.name ?? "").toLowerCase().includes(q)
    );
  });
}
