import { INGREDIENTCATEGORIES } from "../Models/Ingredient";
import {
  parseQuantity,
  scaleQuantity,
  addQuantities,
  formatQuantity,
} from "./quantity";
import { normalizeName, normalizeUnit } from "./ingredientKey";

const VALID_CATEGORIES = Object.values(INGREDIENTCATEGORIES);

export function computeQuantityText(contributions) {
  if (!contributions || contributions.length === 0) return "";
  const quantities = contributions.map((c) => c.quantity);
  if (quantities.every((q) => q.kind === "number")) {
    const sum = quantities.reduce((acc, q) => addQuantities(acc, q));
    return formatQuantity(sum);
  }
  if (quantities.every((q) => q.kind === "blank")) return "";
  if (contributions.length === 1) return contributions[0].quantityText;
  return contributions
    .map((c) => c.quantityText)
    .filter((t) => t)
    .join(" + ");
}

// Merge key shared by everything that should combine into one line: same normalized
// name + unit and a numeric (or blank) quantity. Text quantities ("a pinch") have no
// shared key (null) and never combine.
export function mergeKeyFor(nameKey, unitKey, quantity) {
  if (quantity.kind === "number") return `${nameKey}|${unitKey}|n`;
  if (quantity.kind === "blank") return `${nameKey}|${unitKey}|b`;
  return null;
}

// Text quantities ("a pinch") never combine across recipes, so their key includes the
// menu entry. It uses the text itself rather than the ingredient's position, so editing
// or reordering the recipe's ingredients keeps the same key.
export function textMergeKey(nameKey, unitKey, entryId, text) {
  return `${nameKey}|${unitKey}|t|${entryId}|${String(text ?? "").trim().toLowerCase()}`;
}

// `built` without contributions from the given menu entries (portions the user removed
// from the list), or null when nothing is left.
export function withoutEntries(built, removedEntryIds) {
  if (!removedEntryIds || removedEntryIds.length === 0) return built;
  const removed = new Set(removedEntryIds);
  const contributions = built.contributions.filter((c) => !removed.has(c.menuEntryId));
  if (contributions.length === 0) return null;
  if (contributions.length === built.contributions.length) return built;
  return { ...built, contributions, quantityText: computeQuantityText(contributions) };
}

export function buildShoppingItems({ entries, recipesById, stapleKeys }) {
  const groups = new Map();
  for (const entry of entries ?? []) {
    const recipe = recipesById?.[entry.recipeId];
    if (!recipe) continue;
    const scale = entry.scale ?? 1;
    (recipe.ingredients ?? []).forEach((ingredient) => {
      const name = String(ingredient?.name ?? "").trim();
      if (!name) return;
      const unit = String(ingredient.unit ?? "").trim();
      const q = scaleQuantity(parseQuantity(ingredient.quantityUnit), scale);
      const nameKey = normalizeName(name);
      const unitKey = normalizeUnit(unit);
      const mergeKey = mergeKeyFor(nameKey, unitKey, q) ?? textMergeKey(nameKey, unitKey, entry.id, q.text);
      const contribution = {
        menuEntryId: entry.id,
        recipeId: recipe.id,
        recipeName: recipe.name,
        scale,
        quantity: q,
        quantityText: formatQuantity(q),
        note: String(ingredient.note ?? "").trim(),
      };
      let group = groups.get(mergeKey);
      if (!group) {
        group = { mergeKey, nameKey, name, unit, categories: [], contributions: [] };
        groups.set(mergeKey, group);
      }
      group.categories.push(ingredient.category);
      // One contribution per menu entry per item: a recipe that lists the same ingredient
      // twice (e.g. salt in a marinade and a sauce) adds to its existing contribution.
      // Merging and per-recipe removal rely on menuEntryId being unique within an item.
      const same = group.contributions.find((c) => c.menuEntryId === entry.id);
      if (same) combineInto(same, contribution);
      else group.contributions.push(contribution);
    });
  }

  return Array.from(groups.values()).map((g) => {
    const isStaple = stapleKeys ? stapleKeys.has(g.nameKey) : false;
    return {
      mergeKey: g.mergeKey,
      nameKey: g.nameKey,
      name: g.name,
      unit: g.unit,
      category: g.categories.find((c) => VALID_CATEGORIES.includes(c)) ?? "",
      contributions: g.contributions,
      quantityText: computeQuantityText(g.contributions),
      isStaple,
      checked: isStaple,
      source: "menu",
    };
  });
}

// Folds `extra` (same menu entry, same merge key) into `target`. Only number and blank
// kinds share a merge key, so both are the same kind here.
function combineInto(target, extra) {
  if (target.quantity.kind === "number" && extra.quantity.kind === "number") {
    target.quantity = addQuantities(target.quantity, extra.quantity);
    target.quantityText = formatQuantity(target.quantity);
  }
  if (extra.note && !target.note.split("; ").includes(extra.note)) {
    target.note = target.note ? `${target.note}; ${extra.note}` : extra.note;
  }
}

// Largest possible total (range max) when every contribution is numeric, else null.
function numericMax(contributions) {
  let total = 0;
  for (const c of contributions) {
    if (!c.quantity || c.quantity.kind !== "number") return null;
    total += c.quantity.max;
  }
  return total;
}

function amountGrew(before, after, beforeText, afterText) {
  const a = numericMax(before);
  const b = numericMax(after);
  if (a !== null && b !== null) return b > a + 1e-9;
  return beforeText !== afterText;
}

// Contribution recorded for an item added by the finder's "Add missing": it stands in
// for `recipeId` until that recipe is planned on the menu.
export function finderContribution(recipeId, recipeName, quantity, note = "") {
  return {
    menuEntryId: `finder:${recipeId}`,
    recipeId,
    recipeName,
    scale: 1,
    quantity,
    quantityText: formatQuantity(quantity),
    note,
    fromFinder: true,
  };
}

export function mergeItem(existing, built) {
  const builtByEntry = new Map(built.contributions.map((c) => [c.menuEntryId, c]));
  // A finder placeholder is replaced (not added to) once its recipe is on the menu; a
  // placeholder for a different recipe keeps its amount and adds to the menu's.
  const plannedRecipes = new Set(built.contributions.map((c) => c.recipeId));
  existing = {
    ...existing,
    contributions: existing.contributions.filter((c) => !(c.fromFinder && plannedRecipes.has(c.recipeId))),
  };
  const contributions = [];
  const seen = new Set();
  // Keep existing order; an entry's (possibly duplicated, from older lists) contributions
  // are replaced by the single freshly built one.
  for (const c of existing.contributions) {
    if (seen.has(c.menuEntryId)) continue;
    seen.add(c.menuEntryId);
    contributions.push(builtByEntry.get(c.menuEntryId) ?? c);
  }
  let gainedNew = false;
  for (const c of built.contributions) {
    if (seen.has(c.menuEntryId)) continue;
    seen.add(c.menuEntryId);
    contributions.push(c);
    gainedNew = true;
  }
  const quantityText = computeQuantityText(contributions);
  // More is needed than when the item was ticked off: a new recipe, or a larger total
  // (e.g. a scale change). A smaller or equal total keeps the existing checked state.
  const needsMore = gainedNew || amountGrew(existing.contributions, contributions, existing.quantityText, quantityText);
  let checked;
  // Staples arrive pre-checked, but once a line is a staple the user's own tick wins:
  // unchecking salt means "I'm out", and a merge must not re-check it.
  if (built.isStaple) checked = existing.isStaple ? existing.checked : true;
  else if (needsMore) checked = false;
  else checked = existing.checked;
  return {
    ...existing,
    contributions,
    quantityText,
    isStaple: built.isStaple,
    checked,
    category: existing.category || built.category,
  };
}
