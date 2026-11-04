import { initialState as recipesInitialState } from "./recipesSlice";
import { normalizeName, normalizeUnit } from "../domain/ingredientKey";

const numericSort = (a, b) => Number(a) - Number(b);

function migrateMenu(oldMenu, recipeEntities) {
  if (oldMenu && oldMenu.entries) return oldMenu;
  const copies = oldMenu?.menu ?? {};
  const ids = [];
  const entities = {};
  let n = 0;
  Object.keys(copies)
    .sort(numericSort)
    .forEach((key) => {
      const copy = copies[key];
      if (!copy || copy.id === undefined || !recipeEntities[copy.id]) return;
      n += 1;
      const id = `entry-${n}`;
      ids.push(id);
      entities[id] = { id, recipeId: copy.id, slotId: null, scale: 1 };
    });
  return {
    slots: { ids: [], entities: {} },
    entries: { ids, entities },
    nextId: n + 1,
  };
}

function migrateShoppingList(oldList) {
  if (oldList && oldList.ids) return oldList;
  const old = oldList?.shoppingList ?? {};
  const ids = [];
  const entities = {};
  let n = 0;
  Object.keys(old)
    .sort(numericSort)
    .forEach((key) => {
      const item = old[key];
      if (!item) return;
      n += 1;
      const id = `item-${n}`;
      ids.push(id);
      entities[id] = {
        id,
        mergeKey: null,
        nameKey: normalizeName(item.name ?? ""),
        name: item.name ?? "",
        unit: item.unit ?? "",
        category: item.category ?? "",
        quantityText: String(item.quantityUnit ?? ""),
        checked: !!item.checked,
        isStaple: false,
        source: "manual",
        contributions: [],
      };
    });
  return { ids, entities, nextId: n + 1 };
}

export const migrations = {
  1: (state) => ({
    ...state,
    recipes: recipesInitialState,
  }),
  2: (state) => ({
    ...state,
    menu: migrateMenu(state.menu, state.recipes?.entities ?? {}),
    shoppingList: migrateShoppingList(state.shoppingList),
    pantry: state.pantry ?? { staples: {} },
    settings: state.settings ?? { showStapleReminder: true },
    finder: state.finder ?? { ingredients: [], nextId: 1 },
  }),
  3: (state) => ({
    ...state,
    finder: {
      ingredients: [],
      nextId: 1,
      ...(state.finder ?? {}),
      recent: state.finder?.recent ?? [],
    },
  }),
  // v4: singularization rules improved (peaches -> peach, leaves -> leaf, ...), so
  // recompute the stored name keys for pantry staples and shopping list items.
  4: (state) => ({
    ...state,
    pantry: rekeyPantry(state.pantry),
    shoppingList: rekeyShoppingList(state.shoppingList),
  }),
  // v5: menu entries gain `day` (null unless the entry sits on a day without a meal slot).
  5: (state) => {
    const entries = state.menu?.entries;
    if (!entries?.entities) return state;
    const entities = {};
    for (const [id, entry] of Object.entries(entries.entities)) {
      entities[id] = "day" in entry ? entry : { ...entry, day: null };
    }
    return { ...state, menu: { ...state.menu, entries: { ...entries, entities } } };
  },
};

function rekeyPantry(pantry) {
  if (!pantry?.staples) return pantry;
  const staples = {};
  for (const staple of Object.values(pantry.staples)) {
    const nameKey = normalizeName(staple.name ?? staple.nameKey ?? "");
    if (nameKey) staples[nameKey] = { ...staple, nameKey };
  }
  return { ...pantry, staples };
}

function rekeyShoppingList(list) {
  if (!list?.entities) return list;
  const entities = {};
  for (const [id, item] of Object.entries(list.entities)) {
    const nameKey = normalizeName(item.name ?? "");
    let mergeKey = item.mergeKey;
    if (typeof mergeKey === "string") {
      // mergeKey = `${nameKey}|${unitKey}|kind[|entryId|index]`
      const parts = mergeKey.split("|");
      parts[0] = nameKey;
      parts[1] = normalizeUnit(item.unit ?? "");
      mergeKey = parts.join("|");
    }
    entities[id] = { ...item, nameKey, mergeKey };
  }
  return { ...list, entities };
}
