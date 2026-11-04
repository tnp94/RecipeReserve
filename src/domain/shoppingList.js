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

export function buildShoppingItems({ entries, recipesById, stapleKeys }) {
  const groups = new Map();
  for (const entry of entries ?? []) {
    const recipe = recipesById?.[entry.recipeId];
    if (!recipe) continue;
    const scale = entry.scale ?? 1;
    (recipe.ingredients ?? []).forEach((ingredient, index) => {
      const name = String(ingredient?.name ?? "").trim();
      if (!name) return;
      const unit = String(ingredient.unit ?? "").trim();
      const q = scaleQuantity(parseQuantity(ingredient.quantityUnit), scale);
      const nameKey = normalizeName(name);
      const unitKey = normalizeUnit(unit);
      let mergeKey;
      if (q.kind === "number") mergeKey = `${nameKey}|${unitKey}|n`;
      else if (q.kind === "blank") mergeKey = `${nameKey}|${unitKey}|b`;
      else mergeKey = `${nameKey}|${unitKey}|t|${entry.id}|${index}`;
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

export function mergeItem(existing, built) {
  const builtByEntry = new Map(built.contributions.map((c) => [c.menuEntryId, c]));
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
  let checked;
  if (built.isStaple) checked = true;
  else if (gainedNew) checked = false;
  else checked = existing.checked;
  return {
    ...existing,
    contributions,
    quantityText: computeQuantityText(contributions),
    isStaple: built.isStaple,
    checked,
    category: existing.category || built.category,
  };
}
