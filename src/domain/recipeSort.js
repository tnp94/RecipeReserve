import { totalMinutes } from "./format";
import { DIFFICULTY_LEVELS, difficultyLevel } from "./recipeSearch";

// Recipe list sort orders. Every order breaks ties by name (A–Z), and recipes missing the
// sorted value (no time, no difficulty, never planned) go last.
export const RECIPE_SORT_NAME = "name";
export const RECIPE_SORT_QUICKEST = "quickest";
export const RECIPE_SORT_EASIEST = "easiest";
export const RECIPE_SORT_RECENT = "recent";
export const RECIPE_SORT_MOST_PLANNED = "mostPlanned";
export const RECIPE_SORT_NEWEST = "newest";
export const RECIPE_SORT_FEWEST_INGREDIENTS = "fewestIngredients";

export const DEFAULT_RECIPE_SORT = RECIPE_SORT_NAME;

// `label` is the full option name; `short` is what the closed sort chip shows (kept short so
// the chip fits beside Favorites and Filters on a phone; the bar wraps if it doesn't).
export const RECIPE_SORT_OPTIONS = [
  { value: RECIPE_SORT_NAME, label: "Name (A–Z)", short: "Name", icon: "text-outline" },
  { value: RECIPE_SORT_QUICKEST, label: "Quickest first", short: "Quickest", icon: "time-outline" },
  { value: RECIPE_SORT_EASIEST, label: "Easiest first", short: "Easiest", icon: "speedometer-outline" },
  { value: RECIPE_SORT_RECENT, label: "Recently planned", short: "Recent", icon: "calendar-outline" },
  { value: RECIPE_SORT_MOST_PLANNED, label: "Most planned", short: "Popular", icon: "repeat-outline" },
  { value: RECIPE_SORT_NEWEST, label: "Newest added", short: "Newest", icon: "sparkles-outline" },
  { value: RECIPE_SORT_FEWEST_INGREDIENTS, label: "Fewest ingredients", short: "Ingredients", icon: "list-outline" },
];

export const isRecipeSort = (value) => RECIPE_SORT_OPTIONS.some((o) => o.value === value);

export const recipeSortOption = (value) =>
  RECIPE_SORT_OPTIONS.find((o) => o.value === value) ?? RECIPE_SORT_OPTIONS[0];

const byName = (a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), undefined, { sensitivity: "base" });

const positive = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);

const ingredientCount = (r) => (r.ingredients ?? []).filter((i) => String(i?.name ?? "").trim()).length;

// Sort key for each order: a number to sort ascending, or null for "not known" (sorted last).
const KEYS = {
  [RECIPE_SORT_QUICKEST]: (r) => positive(totalMinutes(r)),
  [RECIPE_SORT_EASIEST]: (r) => {
    const i = DIFFICULTY_LEVELS.indexOf(difficultyLevel(r.difficulty));
    return i < 0 ? null : i;
  },
  [RECIPE_SORT_RECENT]: (r) => {
    const at = positive(r.lastPlannedAt);
    return at == null ? null : -at;
  },
  [RECIPE_SORT_MOST_PLANNED]: (r) => {
    const n = positive(r.timesPlanned);
    return n == null ? null : -n;
  },
  // Ids only grow, so a higher id was added later.
  [RECIPE_SORT_NEWEST]: (r) => (Number.isFinite(Number(r.id)) ? -Number(r.id) : null),
  [RECIPE_SORT_FEWEST_INGREDIENTS]: (r) => {
    const n = ingredientCount(r);
    return n > 0 ? n : null;
  },
};

// A new array in the chosen order (unknown sort values default to Name).
export function sortRecipes(recipes, sort = DEFAULT_RECIPE_SORT) {
  const keyOf = KEYS[sort];
  if (!keyOf) return [...recipes].sort(byName);
  const keyed = recipes.map((recipe) => ({ recipe, key: keyOf(recipe) }));
  keyed.sort((a, b) => {
    if (a.key !== b.key) {
      if (a.key == null) return 1;
      if (b.key == null) return -1;
      return a.key - b.key;
    }
    return byName(a.recipe, b.recipe);
  });
  return keyed.map((k) => k.recipe);
}

// ---- Planning history (lastPlannedAt / timesPlanned, set when a recipe is added to the menu)

// How many times the recipe has been added to the menu (0 when never, or after a reset).
export const timesPlanned = (recipe) => {
  const n = Math.floor(Number(recipe?.timesPlanned));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (ms) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// When `ms` was, relative to `now`: "today", "yesterday", "3 days ago" (within a week),
// else a date ("Nov 2", or "Nov 2, 2025" in another year). "" when `ms` isn't a time.
export function planDateText(ms, now = Date.now()) {
  const at = Number(ms);
  if (!Number.isFinite(at) || at <= 0) return "";
  const days = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const date = new Date(at);
  const sameYear = date.getFullYear() === new Date(now).getFullYear();
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", ...(sameYear ? null : { year: "numeric" }) });
}

// Recipe Details line: "Planned 3 times · last today", "Planned once", or "Not planned yet".
export function planSummary(recipe, now = Date.now()) {
  const n = timesPlanned(recipe);
  if (n === 0) return "Not planned yet";
  const count = n === 1 ? "Planned once" : `Planned ${n} times`;
  const last = planDateText(recipe?.lastPlannedAt, now);
  return last ? `${count} · last ${last}` : count;
}

// Note on a recipe card while the list is sorted by planning: "Planned 3 times" / "Planned once"
// (Most planned) or "Planned 2 days ago" / "Planned Nov 2" (Recently planned). null for other
// sorts, and for recipes with no history (they're already sorted last).
export function planCardText(recipe, sort, now = Date.now()) {
  if (sort === RECIPE_SORT_MOST_PLANNED) {
    const n = timesPlanned(recipe);
    if (n === 0) return null;
    return n === 1 ? "Planned once" : `Planned ${n} times`;
  }
  if (sort === RECIPE_SORT_RECENT) {
    const last = planDateText(recipe?.lastPlannedAt, now);
    return last ? `Planned ${last}` : null;
  }
  return null;
}
