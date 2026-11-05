import {
  buildShoppingItems,
  computeQuantityText,
  mergeItem,
} from "../shoppingList";
import { parseQuantity } from "../quantity";

const ing = (name, quantityUnit = "", unit = "", extra = {}) => ({
  name, quantityUnit, unit, note: "", category: "", ...extra,
});
const recipe = (id, name, ingredients) => ({ id, name, ingredients });
const entry = (n, recipeId, scale = 1) => ({
  id: `entry-${n}`, recipeId, slotId: null, scale,
});
const build = (entries, recipes, staples = []) =>
  buildShoppingItems({
    entries,
    recipesById: Object.fromEntries(recipes.map((r) => [r.id, r])),
    stapleKeys: new Set(staples),
  });

describe("buildShoppingItems", () => {
  it("combines same ingredient across two recipes", () => {
    const items = build(
      [entry(1, 1), entry(2, 2)],
      [recipe(1, "A", [ing("Onion", "1")]), recipe(2, "B", [ing("Onions", "1")])]
    );
    expect(items).toHaveLength(1);
    expect(items[0].quantityText).toBe("2");
    expect(items[0].contributions).toHaveLength(2);
  });

  it("combines unit aliases (Lbs and lb)", () => {
    const items = build(
      [entry(1, 1), entry(2, 2)],
      [recipe(1, "A", [ing("Beef", "1", "Lbs")]), recipe(2, "B", [ing("Beef", "2", "lb")])]
    );
    expect(items).toHaveLength(1);
    expect(items[0].quantityText).toBe("3");
    expect(items[0].unit).toBe("Lbs");
  });

  it("keeps different units separate", () => {
    const items = build(
      [entry(1, 1), entry(2, 2)],
      [recipe(1, "A", [ing("Flour", "1", "cup")]), recipe(2, "B", [ing("Flour", "2", "tbsp")])]
    );
    expect(items).toHaveLength(2);
  });

  it("combines blank with blank to empty text", () => {
    const items = build(
      [entry(1, 1), entry(2, 2)],
      [recipe(1, "A", [ing("Salt")]), recipe(2, "B", [ing("salt", "")])]
    );
    expect(items).toHaveLength(1);
    expect(items[0].quantityText).toBe("");
    expect(items[0].contributions).toHaveLength(2);
  });

  it("never combines text quantities", () => {
    const items = build(
      [entry(1, 1), entry(2, 2)],
      [recipe(1, "A", [ing("Salt", "a pinch")]), recipe(2, "B", [ing("Salt", "a pinch")])]
    );
    expect(items).toHaveLength(2);
    expect(items[0].quantityText).toBe("a pinch");
  });

  it("does not combine number with blank", () => {
    const items = build(
      [entry(1, 1)],
      [recipe(1, "A", [ing("Salt", "1"), ing("Salt", "")])]
    );
    expect(items).toHaveLength(2);
  });

  it("scale doubles quantities and scales ranges", () => {
    const items = build(
      [entry(1, 1, 2)],
      [recipe(1, "A", [ing("Egg", "3"), ing("Milk", "1-2", "cup")])]
    );
    expect(items[0].quantityText).toBe("6");
    expect(items[0].contributions[0].scale).toBe(2);
    expect(items[1].quantityText).toBe("2-4");
  });

  it("marks staples as checked and isStaple", () => {
    const items = build(
      [entry(1, 1)],
      [recipe(1, "A", [ing("Salt", "1"), ing("Egg", "2")])],
      ["salt"]
    );
    expect(items[0]).toMatchObject({ isStaple: true, checked: true });
    expect(items[1]).toMatchObject({ isStaple: false, checked: false });
  });

  it("picks the first valid category", () => {
    const items = build(
      [entry(1, 1), entry(2, 2)],
      [
        recipe(1, "A", [ing("Egg", "1", "", { category: "bogus" })]),
        recipe(2, "B", [ing("Egg", "1", "", { category: "Dairy" })]),
      ]
    );
    expect(items[0].category).toBe("Dairy");
  });

  it("uses empty category when none valid", () => {
    const items = build(
      [entry(1, 1)],
      [recipe(1, "A", [ing("Egg", "1", "", { category: "nope" })])]
    );
    expect(items[0].category).toBe("");
  });

  it("skips entries with a missing recipe and blank-named ingredients", () => {
    const items = build(
      [entry(1, 99), entry(2, 1)],
      [recipe(1, "A", [ing("  ", "1"), ing("Egg", "1")])]
    );
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Egg");
  });

  it("records contribution details and trimmed note", () => {
    const items = build(
      [entry(1, 1)],
      [recipe(1, "Soup", [ing("Egg", "1/2", "", { note: " beaten " })])]
    );
    expect(items[0].contributions[0]).toMatchObject({
      menuEntryId: "entry-1", recipeId: 1, recipeName: "Soup",
      scale: 1, quantityText: "1/2", note: "beaten",
    });
    expect(items[0].source).toBe("menu");
  });
});

describe("computeQuantityText", () => {
  const c = (text) => ({ quantity: parseQuantity(text), quantityText: text });
  it("returns empty string for no contributions", () => {
    expect(computeQuantityText([])).toBe("");
  });
  it("sums numbers", () => {
    expect(computeQuantityText([c("1/2"), c("1")])).toBe("1 1/2");
  });
  it("returns text for single text contribution", () => {
    expect(computeQuantityText([c("a pinch")])).toBe("a pinch");
  });
  it("joins mixed kinds with +", () => {
    expect(computeQuantityText([c("1"), c("a pinch"), c("")])).toBe("1 + a pinch");
  });
});

describe("mergeItem", () => {
  const recipes = [recipe(1, "A", [ing("Egg", "1")]), recipe(2, "B", [ing("Egg", "2")])];
  const first = () => build([entry(1, 1)], recipes)[0];

  it("is idempotent for the same entry and preserves checked", () => {
    const existing = { ...first(), id: "item-1", checked: true };
    const merged = mergeItem(existing, first());
    expect(merged.quantityText).toBe("1");
    expect(merged.contributions).toHaveLength(1);
    expect(merged.checked).toBe(true);
    expect(merged.id).toBe("item-1");
  });

  it("replaces a contribution when the entry scale changed", () => {
    const existing = { ...first(), id: "item-1" };
    const built = build([entry(1, 1, 2)], recipes)[0];
    const merged = mergeItem(existing, built);
    expect(merged.quantityText).toBe("2");
    expect(merged.contributions).toHaveLength(1);
  });

  it("un-checks when a new entry contributes", () => {
    const existing = { ...first(), id: "item-1", checked: true };
    const built = build([entry(1, 1), entry(2, 2)], recipes)[0];
    const merged = mergeItem(existing, built);
    expect(merged.quantityText).toBe("3");
    expect(merged.checked).toBe(false);
    expect(merged.contributions).toHaveLength(2);
  });

  it("keeps staples checked after gaining a contribution", () => {
    const existing = { ...first(), id: "item-1", checked: false };
    const built = build([entry(1, 1), entry(2, 2)], recipes, ["egg"])[0];
    expect(mergeItem(existing, built).checked).toBe(true);
    expect(mergeItem(existing, built).isStaple).toBe(true);
  });

  it("keeps existing contributions from entries not in the built item", () => {
    const existing = {
      ...build([entry(1, 1), entry(2, 2)], recipes)[0], id: "item-1",
    };
    const merged = mergeItem(existing, build([entry(2, 2)], recipes)[0]);
    expect(merged.contributions).toHaveLength(2);
    expect(merged.quantityText).toBe("3");
  });

  it("category prefers existing, falls back to built; name/mergeKey unchanged", () => {
    const existing = { ...first(), id: "item-1", category: "" };
    const built = { ...first(), category: "Dairy", name: "Other name" };
    const merged = mergeItem(existing, built);
    expect(merged.category).toBe("Dairy");
    expect(merged.name).toBe("Egg");
    expect(merged.mergeKey).toBe(existing.mergeKey);
    expect(mergeItem({ ...existing, category: "Meat" }, built).category).toBe("Meat");
  });
});

describe("recipe that lists the same ingredient twice", () => {
  const salty = recipe(1, "Salty", [
    ing("Salt", "1", "tsp", { note: "for the marinade" }),
    ing("Salt", "2", "tsp", { note: "for the sauce" }),
  ]);

  it("builds one contribution per menu entry with the summed quantity", () => {
    const [item] = build([entry(1, 1)], [salty]);
    expect(item.contributions).toHaveLength(1);
    expect(item.quantityText).toBe("3");
    expect(item.contributions[0].note).toBe("for the marinade; for the sauce");
  });

  it("merging after a scale change replaces, not mixes, the old quantity", () => {
    const existing = { ...build([entry(1, 1)], [salty])[0], id: "item-1" };
    const merged = mergeItem(existing, build([entry(1, 1, 3)], [salty])[0]);
    expect(merged.contributions).toHaveLength(1);
    expect(merged.quantityText).toBe("9");
  });

  it("collapses duplicate contributions saved by older versions when merging", () => {
    const old = build([entry(1, 1)], [salty])[0];
    const dup = { ...old.contributions[0], quantity: parseQuantity("1"), quantityText: "1" };
    const existing = { ...old, id: "item-1", contributions: [dup, { ...dup, quantity: parseQuantity("2"), quantityText: "2" }] };
    const merged = mergeItem(existing, build([entry(1, 1, 2)], [salty])[0]);
    expect(merged.contributions.map((c) => c.menuEntryId)).toEqual(["entry-1"]);
    expect(merged.quantityText).toBe("6");
  });

  it("keeps two recipes as two contributions", () => {
    const [item] = build([entry(1, 1), entry(2, 1)], [salty]);
    expect(item.contributions.map((c) => c.menuEntryId)).toEqual(["entry-1", "entry-2"]);
    expect(item.quantityText).toBe("6");
  });
});

describe("mergeItem checked state when the amount changes", () => {
  const recipes = [recipe(1, "A", [ing("Butter", "4", "Tbsp")])];
  const checkedItem = () => ({ ...build([entry(1, 1)], recipes)[0], id: "item-1", checked: true });

  it("unchecks when the same entry now needs more (scale up)", () => {
    const merged = mergeItem(checkedItem(), build([entry(1, 1, 2)], recipes)[0]);
    expect(merged.quantityText).toBe("8");
    expect(merged.checked).toBe(false);
  });

  it("keeps checked when the amount is unchanged or smaller", () => {
    expect(mergeItem(checkedItem(), build([entry(1, 1)], recipes)[0]).checked).toBe(true);
    expect(mergeItem(checkedItem(), build([entry(1, 1, 0.5)], recipes)[0]).checked).toBe(true);
  });

  it("staples stay checked even when the amount grows", () => {
    const merged = mergeItem(checkedItem(), build([entry(1, 1, 2)], recipes, ["butter"])[0]);
    expect(merged.checked).toBe(true);
  });
});
