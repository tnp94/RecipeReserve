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
