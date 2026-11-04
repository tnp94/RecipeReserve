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
      group.contributions.push(contribution);
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

export function mergeItem(existing, built) {
  const contributions = [...existing.contributions];
  let gainedNew = false;
  for (const c of built.contributions) {
    const i = contributions.findIndex((x) => x.menuEntryId === c.menuEntryId);
    if (i >= 0) contributions[i] = c;
    else {
      contributions.push(c);
      gainedNew = true;
    }
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
