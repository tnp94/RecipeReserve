import { initialState as recipesInitialState } from "./recipesSlice";
import { normalizeName, normalizeUnit } from "../domain/ingredientKey";
import { computeQuantityText, textMergeKey } from "../domain/shoppingList";

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
  // v6: unit "T" vs "t" (tablespoon vs teaspoon) and "-che" plurals (quiches) changed the
  // key rules again; re-key, and fold menu items whose keys now collide (also cleans up
  // duplicates an earlier re-key could leave behind).
  6: (state) => ({
    ...state,
    pantry: rekeyPantry(state.pantry),
    shoppingList: rekeyShoppingList(state.shoppingList),
  }),
  // v7: the shopping list remembers removed per-recipe portions (`removed`).
  7: (state) =>
    state.shoppingList
      ? { ...state, shoppingList: { removed: {}, ...state.shoppingList } }
      : state,
  // v8: text-amount merge keys use the text instead of the ingredient's position.
  8: (state) => ({ ...state, shoppingList: rekeyShoppingList(state.shoppingList) }),
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
      const unitKey = normalizeUnit(item.unit ?? "");
      if (parts[2] === "t") {
        // Text amounts ("a pinch"): keyed by entry + text (older lists used the
        // ingredient's position, which changes when the recipe is edited).
        const c = (item.contributions ?? [])[0];
        const text = c?.quantity?.text ?? c?.quantityText ?? item.quantityText ?? "";
        mergeKey = textMergeKey(nameKey, unitKey, parts[3], text);
      } else {
        parts[0] = nameKey;
        parts[1] = unitKey;
        mergeKey = parts.join("|");
      }
    }
    entities[id] = { ...item, nameKey, mergeKey };
  }
  // Fold menu items that now share a merge key into the first one, so later merges
  // (which update the first match only) see a single line.
  const ids = [];
  const firstByKey = new Map();
  for (const id of list.ids ?? Object.keys(entities)) {
    const item = entities[id];
    if (!item) continue;
    const key = item.source === "menu" && typeof item.mergeKey === "string" ? item.mergeKey : null;
    const firstId = key ? firstByKey.get(key) : undefined;
    if (firstId === undefined) {
      if (key) firstByKey.set(key, id);
      ids.push(id);
      continue;
    }
    entities[firstId] = foldItems(entities[firstId], item);
    delete entities[id];
  }
  return { ...list, ids, entities };
}

function foldItems(keep, dup) {
  const seen = new Set();
  const contributions = [];
  for (const c of [...(keep.contributions ?? []), ...(dup.contributions ?? [])]) {
    if (seen.has(c.menuEntryId)) continue;
    seen.add(c.menuEntryId);
    contributions.push(c);
  }
  return {
    ...keep,
    contributions,
    quantityText: computeQuantityText(contributions),
    // Only "bought" if both lines were ticked off; staple if either was.
    checked: !!keep.checked && !!dup.checked,
    isStaple: !!keep.isStaple || !!dup.isStaple,
    category: keep.category || dup.category,
  };
}
