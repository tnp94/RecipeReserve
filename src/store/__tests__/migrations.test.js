import { migrations } from "../migrations";

const v1 = () => ({
  recipes: { ids: [1, 2], entities: { 1: { id: 1, name: "A" }, 2: { id: 2, name: "B" } }, nextId: 3 },
  menu: {
    recipeID: 12,
    menu: {
      2: { id: 2, name: "B" },
      10: { id: 1, name: "A" },
      5: { id: 99, name: "Gone" },
    },
  },
  shoppingList: {
    itemID: 3,
    shoppingList: {
      0: { id: 0, name: "Onions", quantityUnit: "2", unit: "lb", category: "Produce", checked: true },
      1: { id: 1, name: "Salt", quantityUnit: "", checked: false },
    },
  },
  _persist: { version: 1, rehydrated: true },
});

describe("migration v2", () => {
  it("converts v1 menu and shopping list and adds new slices", () => {
    const out = migrations[2](v1());
    expect(out.menu.entries.ids).toEqual(["entry-1", "entry-2"]);
    expect(out.menu.entries.entities["entry-1"]).toEqual({ id: "entry-1", recipeId: 2, slotId: null, scale: 1 });
    expect(out.menu.entries.entities["entry-2"].recipeId).toBe(1);
    expect(out.menu.slots).toEqual({ ids: [], entities: {} });
    expect(out.menu.nextId).toBe(3);
    expect(out.shoppingList.ids).toEqual(["item-1", "item-2"]);
    expect(out.shoppingList.entities["item-1"]).toEqual({
      id: "item-1", mergeKey: null, nameKey: "onion", name: "Onions", unit: "lb",
      category: "Produce", quantityText: "2", checked: true, isStaple: false,
      source: "manual", contributions: [],
    });
    expect(out.shoppingList.entities["item-2"].quantityText).toBe("");
    expect(out.shoppingList.nextId).toBe(3);
    expect(out.pantry).toEqual({ staples: {} });
    expect(out.settings).toEqual({ showStapleReminder: true });
    expect(out.finder).toEqual({ ingredients: [], nextId: 1 });
    expect(out._persist).toEqual({ version: 1, rehydrated: true });
  });

  it("handles empty v1 state", () => {
    const out = migrations[2]({
      recipes: { ids: [], entities: {}, nextId: 1 },
      menu: { recipeID: 0, menu: {} },
      shoppingList: { itemID: 0, shoppingList: {} },
    });
    expect(out.menu.nextId).toBe(1);
    expect(out.shoppingList.nextId).toBe(1);
  });

  it("leaves new-shape state alone", () => {
    const state = {
      recipes: { ids: [], entities: {}, nextId: 1 },
      menu: { slots: { ids: [], entities: {} }, entries: { ids: [], entities: {} }, nextId: 5 },
      shoppingList: { ids: [], entities: {}, nextId: 7 },
      pantry: { staples: { a: { nameKey: "a", name: "a" } } },
    };
    const out = migrations[2](state);
    expect(out.menu).toBe(state.menu);
    expect(out.shoppingList).toBe(state.shoppingList);
    expect(out.pantry).toBe(state.pantry);
  });
});

describe("migration v3", () => {
  it("adds finder.recent preserving existing finder data", () => {
    const out = migrations[3]({
      finder: { ingredients: [{ id: "fi-1", name: "Egg", tag: null }], nextId: 2 },
      _persist: { version: 2, rehydrated: true },
    });
    expect(out.finder).toEqual({
      ingredients: [{ id: "fi-1", name: "Egg", tag: null }],
      nextId: 2,
      recent: [],
    });
    expect(out._persist).toEqual({ version: 2, rehydrated: true });
  });
  it("creates finder when missing and keeps existing recent", () => {
    expect(migrations[3]({}).finder).toEqual({ ingredients: [], nextId: 1, recent: [] });
    expect(migrations[3]({ finder: { ingredients: [], nextId: 1, recent: ["Egg"] } }).finder.recent).toEqual(["Egg"]);
  });
});

describe("migration v4", () => {
  it("recomputes pantry and shopping list keys with the new plural rules", () => {
    const out = migrations[4]({
      pantry: { staples: { peache: { nameKey: "peache", name: "Peaches" }, salt: { nameKey: "salt", name: "Salt" } } },
      shoppingList: {
        ids: ["item-1", "item-2"],
        entities: {
          "item-1": { id: "item-1", name: "Bay Leaves", unit: "Leaves", nameKey: "bay leave", mergeKey: "bay leave|leave|n" },
          "item-2": { id: "item-2", name: "Peaches", unit: "", nameKey: "peache", mergeKey: null },
        },
        nextId: 3,
      },
      _persist: { version: 3, rehydrated: true },
    });
    expect(Object.keys(out.pantry.staples).sort()).toEqual(["peach", "salt"]);
    expect(out.pantry.staples.peach).toEqual({ nameKey: "peach", name: "Peaches" });
    expect(out.shoppingList.entities["item-1"]).toMatchObject({ nameKey: "bay leaf", mergeKey: "bay leaf|leaf|n" });
    expect(out.shoppingList.entities["item-2"]).toMatchObject({ nameKey: "peach", mergeKey: null });
    expect(out.shoppingList.ids).toEqual(["item-1", "item-2"]);
    expect(out.shoppingList.nextId).toBe(3);
  });
  it("tolerates missing slices", () => {
    expect(migrations[4]({})).toEqual({ pantry: undefined, shoppingList: undefined });
  });
});

describe("migration v5", () => {
  it("adds day: null to entries without one and keeps the rest", () => {
    const out = migrations[5]({
      menu: {
        slots: { ids: ["slot-1"], entities: { "slot-1": { id: "slot-1", day: 0, name: "A" } } },
        entries: {
          ids: ["entry-2", "entry-3"],
          entities: {
            "entry-2": { id: "entry-2", recipeId: 1, slotId: "slot-1", scale: 2 },
            "entry-3": { id: "entry-3", recipeId: 2, slotId: null, day: 4, scale: 1 },
          },
        },
        nextId: 4,
      },
      other: 1,
    });
    expect(out.menu.entries.entities["entry-2"]).toEqual({ id: "entry-2", recipeId: 1, slotId: "slot-1", day: null, scale: 2 });
    expect(out.menu.entries.entities["entry-3"].day).toBe(4);
    expect(out.menu.entries.ids).toEqual(["entry-2", "entry-3"]);
    expect(out.menu.nextId).toBe(4);
    expect(out.menu.slots.ids).toEqual(["slot-1"]);
    expect(out.other).toBe(1);
  });
  it("tolerates a missing menu", () => {
    expect(migrations[5]({})).toEqual({});
  });
});

describe("migration v6", () => {
  const item = (id, extra) => ({
    id, name: "", unit: "", category: "", quantityText: "", checked: false, isStaple: false,
    source: "menu", mergeKey: null, nameKey: "", contributions: [], ...extra,
  });
  const contrib = (entryId, n) => ({
    menuEntryId: entryId, recipeId: 1, recipeName: "R", scale: 1,
    quantity: { kind: "number", min: n, max: n }, quantityText: String(n), note: "",
  });

  it("re-keys T/t units so tablespoons and teaspoons separate", () => {
    const out = migrations[6]({
      shoppingList: {
        ids: ["item-1", "item-2"],
        entities: {
          "item-1": item("item-1", { name: "Sugar", unit: "T", nameKey: "sugar", mergeKey: "sugar|t|n" }),
          "item-2": item("item-2", { name: "Sugar", unit: "t", nameKey: "sugar", mergeKey: "sugar|t|n" }),
        },
        nextId: 3,
      },
    });
    expect(out.shoppingList.entities["item-1"].mergeKey).toBe("sugar|tbsp|n");
    expect(out.shoppingList.entities["item-2"].mergeKey).toBe("sugar|tsp|n");
    expect(out.shoppingList.ids).toEqual(["item-1", "item-2"]);
  });

  it("folds menu items whose keys now collide, keeping one line", () => {
    const out = migrations[6]({
      shoppingList: {
        ids: ["item-1", "item-2", "item-3"],
        entities: {
          "item-1": item("item-1", { name: "Peaches", nameKey: "peache", mergeKey: "peache||n", checked: true, contributions: [contrib("entry-1", 2)] }),
          "item-2": item("item-2", { name: "Peach", nameKey: "peach", mergeKey: "peach||n", checked: false, contributions: [contrib("entry-2", 1)] }),
          "item-3": item("item-3", { name: "Peach", nameKey: "peach", source: "manual" }),
        },
        nextId: 4,
      },
      pantry: { staples: { quich: { nameKey: "quich", name: "Quiches" } } },
    });
    const { ids, entities } = out.shoppingList;
    expect(ids).toEqual(["item-1", "item-3"]); // manual items never fold
    expect(entities["item-2"]).toBeUndefined();
    expect(entities["item-1"].mergeKey).toBe("peach||n");
    expect(entities["item-1"].contributions.map((c) => c.menuEntryId)).toEqual(["entry-1", "entry-2"]);
    expect(entities["item-1"].quantityText).toBe("3");
    expect(entities["item-1"].checked).toBe(false); // one line wasn't bought yet
    expect(Object.keys(out.pantry.staples)).toEqual(["quiche"]);
  });

  it("tolerates missing slices", () => {
    expect(migrations[6]({})).toEqual({ pantry: undefined, shoppingList: undefined });
  });
});
