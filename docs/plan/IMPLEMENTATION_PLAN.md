# RecipeReserve — Implementation Plan for REQUIREMENTS.md

_Written 2026-11-04. Source of truth for requirements: `docs/REQUIREMENTS.md`._

This plan is written so each task can be handed to an implementation agent with no
further clarification. **Section 2 (Shared contracts) is binding for every task.** If a
task says "exactly", do exactly that. If something is not specified, choose the simplest
option that is consistent with the contracts and note it in your final report.

---

## 0. Scope

**In scope (everything not yet ✅ in REQUIREMENTS.md section 1, plus the priority stretch goal):**

| Area | IDs |
|---|---|
| Recipe library | R-6 favorites, R-7 search/filter, R-9 clean rename |
| Weekly menu | M-4 days + free-form slots, M-5 move/swap, M-6 scaling, M-7 new week |
| Shopping list | S-5 manual items, S-6 combine same ingredient+unit, S-7 expandable per-recipe breakdown, S-8 replace-or-merge prompt |
| Pantry staples | P-1, P-2, P-3, P-4 |
| Platforms | A-2 web / large-screen layout |
| Stretch (priority) | X-7 "What can I make?" recipe finder |

**Out of scope:** X-1, X-2, X-3, X-4, X-5, X-6 (accounts, sync, OCR, URL import, text
parsing, saved plans). The data-model choices below keep them possible later (stable
string IDs, recipe references by ID, pure domain functions).

**Not doing:** drag-and-drop (see §1.6), TypeScript conversion, unit conversion
(cups ↔ tbsp), navigation library upgrades.

---

## 1. Analysis of the current app and key decisions

### 1.1 What exists today
- Expo SDK 54 / React Native 0.81 / React 19, JavaScript (no TS in `src/`).
- Redux Toolkit + redux-persist (AsyncStorage), persist `version: 1` with one migration.
- `recipes` slice already uses `createEntityAdapter` keyed by numeric `id`
  (`{ ids, entities, nextId }`). **CLAUDE.md is stale** — it still says recipes are keyed by
  name. R-9's data problem is therefore already solved; what remains is the UI: the edit
  form refuses to rename, and "Create as new recipe" uses `Alert.prompt`, which is iOS-only.
- `menu` slice stores **full copies** of recipes (`{ recipeID, menu: { [n]: recipe } }`), so
  editing a recipe does not update the menu, and there are no days/slots/scale.
- `shoppingList` slice flattens every ingredient of every menu recipe into its own line.
  No combining, no source tracking, no manual items UI, replaces without asking.
- Search box renders but has no state. `favorite` exists on recipes but has no UI.
- Ingredient category in the recipe form is a free-text field, so typos land in "Other".

### 1.2 Cross-cutting problems found
1. **`Alert.alert` does nothing on web** (react-native-web implements it as a no-op) and
   `Alert.prompt` only works on iOS. Every confirm/action-sheet in the app is invisible on
   web and "Create as new recipe" is broken on Android. **Decision:** build one
   cross-platform dialog system (`useDialog`) on top of RN `Modal` and replace every
   `Alert` call. This is a prerequisite for A-2.
2. **Swipe and long-press are not discoverable with a mouse.** **Decision:** every
   swipe/long-press action also gets a visible "⋯" button on web.
3. **No tests.** The new features are mostly logic (quantity parsing, combining, merging,
   ranking). **Decision:** add Jest (`jest-expo` preset) and put all logic in pure modules
   under `src/domain/` with unit tests. Screens stay thin.
4. **Recipe form bug:** `emptyRecipe.time` is `{}`, so a new recipe's card shows `NaN`.
   Fixed in Task 2A.
5. **Double headers:** the RecipeList tab shows a tab header *and* a stack header. Fixed in 2C.

### 1.3 Menu model (M-4, M-5, M-6, M-7)
- A menu **entry** references a recipe by `recipeId` (no more copies). Edits and renames
  flow through automatically. Deleting a recipe removes its entries (cascade).
- The week is 7 fixed days, Monday-first (`day` = 0…6). No calendar dates.
- Each day owns an ordered list of **slots** with free-form names. Days start with no
  slots. Quick-add chips ("Breakfast", "Lunch", "Dinner", "Snack", "Custom…") create slots;
  they never restrict anything. A slot may be empty ("skip"). A slot can hold several recipes.
- An entry with `slotId: null` is **Unplanned**. Adding from My Recipes puts the recipe
  in Unplanned (keeps today's one-swipe add).
- Moving: tap an entry → "Move to…" → tap a target slot (or a quick-add chip that creates
  the slot and moves in one tap) = 2–3 taps. "Swap with…" swaps two entries' positions.
  Slots can move to another day; whole days can be swapped.
- Scaling: each entry has `scale` (default 1). Presets ½×, 1×, 2×, 3× and −/+ in steps of 0.5.
- New week: "Clear recipes, keep meal slots" or "Clear everything".

### 1.4 Shopping list model (S-5 … S-8)
- Items carry **contributions** — one per (menu entry × ingredient) — so the list knows
  which recipe needs what (S-7) and can merge idempotently (S-8).
- **Combining rule (S-6):** two ingredients combine when their normalized name AND
  normalized unit match AND both quantities are numeric (or both blank). Unparseable text
  quantities ("a pinch") never combine. No unit conversion.
- Normalization is a heuristic: lower-case, punctuation → space, simple singularization
  ("Onions" = "onion"), unit aliases ("Lbs" = "lb", "tablespoons" = "tbsp").
- **Replace** clears the whole list (including manual items) and rebuilds it.
  **Merge** keeps everything, updates contributions for entries already on the list,
  adds new ones, and un-checks an item if it gained a contribution from a new menu entry
  (you now need more) unless it is a pantry staple. Regenerating the same menu with Merge
  therefore never doubles quantities.
- If the list is empty, Generate just builds it (no question). If the menu is empty, say so.
- Substitution (S-7): in the expanded view each recipe's portion has a "Remove" button
  that removes just that contribution and recomputes the total.
- Manual items (S-5) are never combined with menu items.

### 1.5 Pantry staples (P-1 … P-4)
- Staples are stored by normalized ingredient name. Mark/unmark from: the shopping list
  item menu, the recipe details ingredient list, and a Pantry Staples screen in Settings.
- On generate, staple items are added **checked** and flagged `isStaple`. Afterwards a
  reminder lists each pre-checked staple with its quantity. "Don't remind me again" turns
  the reminder off; a Settings switch turns it back on.

### 1.6 Web / large screens (A-2)
- `useLayout()` hook: `isWide` when window width ≥ 900.
- Wide: recipe grid uses 3–5 columns; recipe details shows ingredients and directions side
  by side; the menu shows the week as 7 columns plus an Unplanned column; shopping list and
  settings are centered at max width 720.
- **Drag-and-drop is deliberately not built now.** It needs `react-native-reanimated` plus
  a draggable-list library, behaves differently per platform, and the tap-based
  "Move to… / Swap with…" already meets M-5's "one or two taps". Recommended as a later
  enhancement for web.

### 1.7 Recipe finder (X-7)
- Separate screen in the Recipes stack. Ingredients for the search persist (remembered and
  pre-filled), each with one-tap tags "Expiring soon" / "Must use", one-tap remove, and
  "Clear all". "Add pantry staples" pre-fills staples.
- Matching: every word of the entered ingredient (normalized) must appear in the recipe
  ingredient's normalized words ("potato" matches "Small Red Potatoes").
- Full matches (missing 0) and near matches (missing 1–2). Must-use items filter.
  Ranking within each group: expiring matches ↓, fraction owned ↓, missing count ↑, name.
- Near matches offer "Add missing to shopping list" (adds manual items).

### 1.8 Navigation after the change
```
Tabs: Home (Welcome) | Recipes (stack) | Menu | Shopping List | Settings (stack)
Recipes stack: My Recipes → Recipe Details → Recipe Form ; My Recipes → Recipe Finder
Settings stack: Settings → Pantry Staples
```
Route names stay `Welcome`, `RecipeList`, `Menu`, `ShoppingList`; new tab route `Settings`.
Only display titles change.

---

## 2. Shared contracts (binding for all tasks)

### 2.1 Folder layout
```
src/
  domain/                 pure JS, no React, no Redux imports (may import src/Models/*)
    quantity.js
    ingredientKey.js
    shoppingList.js
    recipeSearch.js
    recipeFinder.js
    __tests__/*.test.js
  hooks/useLayout.js
  theme.js
  components/
    dialog/DialogProvider.js
    AppModal.js
    Chip.js
    CategoryPicker.js
    menu/…                (Task 2B only)
    shopping/…            (Task 2C only)
  store/
    recipesSlice.js  menuSlice.js  shoppingListSlice.js
    pantrySlice.js   settingsSlice.js  finderSlice.js
    thunks.js  migrations.js  store.js
    __tests__/*.test.js
  screens/ …
```
Existing code style: functional components, `StyleSheet.create` preferred for new code,
double quotes, semicolons optional (match the file you are in). No new runtime
dependencies unless a task says so.

### 2.2 Theme (`src/theme.js`, created in Task 0B)
```js
export const colors = {
  primary: "#f96163", text: "#333333", muted: "#777777", border: "#dddddd",
  background: "#f5f5f5", surface: "#ffffff", danger: "#d62d20",
  favorite: "#f5b301", accent: "#99ccff", accentStrong: "#2f80ed",
};
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 6, md: 10, lg: 16, pill: 999 };
```

### 2.3 Domain function signatures (Task 0A and 1A implement; everyone else only calls)

`src/domain/quantity.js`
```js
// Quantity = { kind: "blank" } | { kind: "number", min: number, max: number } | { kind: "text", text: string }
export function parseQuantity(input)          // string | number | null | undefined -> Quantity
export function scaleQuantity(q, factor)      // number kind: min*factor, max*factor; others unchanged
export function addQuantities(a, b)           // both number -> {kind:"number", min:a.min+b.min, max:a.max+b.max}; otherwise throws Error
export function formatNumber(n)               // see rules below
export function formatQuantity(q)             // number: min===max ? formatNumber(min) : `${formatNumber(min)}-${formatNumber(max)}`; text: q.text; blank: ""
```
`parseQuantity` rules (after `String(input).trim()`; `null`/`undefined`/`""` → blank;
a finite number input → number kind):
- Single value forms: integer `2`; decimal `1.5`, `.5`; fraction `1/4`; mixed `1 1/2`;
  unicode vulgar fractions `½ ¼ ¾ ⅓ ⅔ ⅛ ⅜ ⅝ ⅞` alone or after a whole number with or
  without a space (`1½`, `1 ½`).
- Range: two single values separated by `-`, `–`, `—`, or the word `to`, with optional
  spaces (`1-2`, `1/2 - 1`, `2 to 3`) → `min`=first, `max`=second. If first > second, swap.
- Single value → `min === max`.
- Anything else (including `0`-denominator fractions) → `{ kind: "text", text: <trimmed original> }`.

`formatNumber(n)` rules: round to 2 decimals first. Integer → `"2"`. Otherwise split into
whole + fractional part; if the fractional part is within 0.02 of one of
1/8, 1/4, 1/3, 3/8, 1/2, 5/8, 2/3, 3/4, 7/8 → `"1 1/2"` (or `"1/2"` when whole is 0);
otherwise the number with up to 2 decimals, trailing zeros trimmed (`"1.43"`; note `1.38` → `"1 3/8"`).

`src/domain/ingredientKey.js`
```js
export function singularizeWord(word)   // rules below
export function normalizeName(name)     // lower-case; any char not [a-z0-9] -> space; collapse/trim spaces; singularize each word; join with " "
export function normalizeUnit(unit)     // rules below
export function ingredientKey(name, unit) // `${normalizeName(name)}|${normalizeUnit(unit)}`
```
`singularizeWord`: if length ≤ 3 → unchanged; ends with `ies` → replace with `y`
("berries"→"berry"); ends with `oes` → drop `es` ("potatoes"→"potato"); ends with `ss`,
`us`, or `is` → unchanged; ends with `s` → drop it; else unchanged.

`normalizeUnit`: lower-case, trim, strip trailing `.`, then map aliases:
| canonical | aliases |
|---|---|
| `lb` | lb, lbs, pound, pounds |
| `oz` | oz, ounce, ounces |
| `tbsp` | tbsp, tbs, tbl, tablespoon, tablespoons |
| `tsp` | tsp, teaspoon, teaspoons |
| `cup` | cup, cups, c |
| `clove` | clove, cloves |
| `g` | g, gram, grams |
| `kg` | kg, kilogram, kilograms |
| `ml` | ml, milliliter, milliliters, millilitre, millilitres |
| `l` | l, liter, liters, litre, litres |
| `can` | can, cans |
| `` (empty) | "", whole, each, ea |
Anything not in the table → `singularizeWord(lowercased)`.

`src/domain/shoppingList.js` (Task 1A)
```js
export function buildShoppingItems({ entries, recipesById, stapleKeys }) // -> BuiltItem[]
export function computeQuantityText(contributions)                       // -> string
export function mergeItem(existingItem, builtItem)                       // -> new item object (pure)
```
`src/domain/recipeSearch.js` (Task 1A)
```js
export function filterRecipes(recipes, { query = "", favoritesOnly = false } = {}) // -> Recipe[] (input order preserved)
```
`src/domain/recipeFinder.js` (Task 1A)
```js
export function ingredientMatches(haveName, recipeIngredientName) // -> boolean
export function findRecipes(recipes, haveIngredients, { maxMissing = 2 } = {})
// -> { fullMatches: FinderResult[], nearMatches: FinderResult[] }
```
Full semantics are in Task 1A.

### 2.4 Redux state shape (Task 1B implements)
```js
{
  recipes: { ids: number[], entities: { [id]: Recipe }, nextId: number },   // unchanged shape
  menu: {
    slots:   { ids: string[], entities: { [slotId]: Slot } },
    entries: { ids: string[], entities: { [entryId]: MenuEntry } },
    nextId: number,                       // shared counter for slot and entry ids, starts at 1
  },
  shoppingList: { ids: string[], entities: { [itemId]: ShoppingItem }, nextId: number }, // nextId starts at 1
  pantry:   { staples: { [nameKey]: { nameKey: string, name: string } } },
  settings: { showStapleReminder: boolean },            // default true
  finder:   { ingredients: FinderIngredient[], nextId: number },   // nextId starts at 1
}

Slot       = { id: "slot-<n>", day: 0..6, name: string }
MenuEntry  = { id: "entry-<n>", recipeId: number, slotId: string | null, scale: number }
ShoppingItem = {
  id: "item-<n>",
  mergeKey: string | null,     // null for manual items
  nameKey: string,             // normalizeName(name)
  name: string, unit: string, category: string,
  quantityText: string,        // display total (computed for menu items, typed for manual)
  checked: boolean,
  isStaple: boolean,
  source: "menu" | "manual",
  contributions: Contribution[],   // [] for manual items
}
Contribution = {
  menuEntryId: string, recipeId: number, recipeName: string,
  scale: number, quantity: Quantity, quantityText: string, note: string,
}
FinderIngredient = { id: "fi-<n>", name: string, tag: null | "expiring" | "required" }
```
Order of `slots.ids` = display order of slots within a day (filter by `day`).
Order of `entries.ids` = display order of entries within a slot / Unplanned.

### 2.5 Actions and selectors (Task 1B implements; UI tasks only use these names)

`recipesSlice.js` — existing `addRecipe, deleteRecipe, loadRecipeList, editRecipe,
selectAllRecipes, selectRecipeById` **plus**:
- `toggleFavorite(recipeId)`
- `export function isRecipeNameTaken(state, name, excludeId)` — case-insensitive, trimmed comparison against all recipes except `excludeId`.

`menuSlice.js`:
- `addRecipeToMenu({ recipeId, slotId = null, scale = 1 })`
- `removeMenuEntry(entryId)`
- `moveMenuEntry({ entryId, slotId })` — `slotId` may be `null`; entry moves to the END of the target's order
- `swapMenuEntries({ entryIdA, entryIdB })` — swaps `slotId`s AND swaps their positions in `entries.ids`
- `setMenuEntryScale({ entryId, scale })` — clamp to [0.25, 20], round to 2 decimals
- `addSlot({ day, name })` — trims name; empty → `"Meal"`; appended at end
- `addSlotAndMoveEntry({ day, name, entryId })` — creates slot as `addSlot` then moves entry into it (one action, one undo-able step)
- `renameSlot({ slotId, name })` — trimmed; ignore if empty
- `removeSlot({ slotId, removeEntries })` — `removeEntries` true deletes its entries, false sets their `slotId` to `null`
- `moveSlot({ slotId, day })` — changes `day`, moves slot id to end of `slots.ids`
- `swapDays({ dayA, dayB })` — every slot with `day === dayA` gets `dayB` and vice versa
- `clearMenuEntries()` — removes all entries, keeps slots
- `clearMenu()` — resets to initial state
- extraReducers: `deleteRecipe` → remove entries with that `recipeId`; `loadRecipeList` → remove entries whose `recipeId` is not an id in `recipeList` (seed).
- Selectors (memoized with `createSelector`):
  - `WEEK_DAYS` constant export: `["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]`
  - `SUGGESTED_SLOT_NAMES` constant export: `["Breakfast","Lunch","Dinner","Snack"]`
  - `selectMenuEntries(state)` → `MenuEntry[]` in order
  - `selectMenuWeek(state)` → `Array<{ day, label, slots: Array<Slot & { entries: Array<MenuEntry & { recipe: Recipe }> }> }>` (length 7; entries whose recipe no longer exists are omitted)
  - `selectUnplannedEntries(state)` → `Array<MenuEntry & { recipe }>`
  - `selectMenuEntryCount(state)` → number (entries with an existing recipe)

`shoppingListSlice.js`:
- `addManualItem({ name, quantityText = "", unit = "", category = "" })` — ignored if trimmed name empty; `isStaple` set from current pantry is NOT known here, so the payload may include `isStaple` (UI/thunk passes it); default `false`; `checked: false`
- `deleteItem(itemId)`
- `toggleItemChecked(itemId)` (replaces `checkOffShoppingItem`)
- `clearShoppingList()`
- `replaceMenuItems(builtItems)` — clears everything, adds built items with new ids
- `mergeMenuItems(builtItems)` — for each built item: if an existing item has the same `mergeKey` and `source === "menu"` → replace it with `mergeItem(existing, built)` (keep its id); else add with a new id
- `removeContribution({ itemId, menuEntryId })` — removes that contribution, recomputes `quantityText`; if none left, deletes the item
- extraReducers on pantry actions `addStaple`, `removeStaple`, `toggleStaple`: set `isStaple` on every item whose `nameKey` matches (never changes `checked`)
- Selectors: `selectShoppingItems(state)` → array in order; `selectShoppingItemCount(state)`

`pantrySlice.js`: `addStaple(name)`, `removeStaple(nameKey)`, `toggleStaple(name)`;
selectors `selectStaplesList` (sorted by name, case-insensitive), `selectStapleKeys`
(memoized `Set<string>`), `selectIsStaple(state, name)`.

`settingsSlice.js`: `setShowStapleReminder(boolean)`; selector `selectShowStapleReminder`.

`finderSlice.js`: `addFinderIngredients(names: string[])` (trims, ignores empty and any
whose `normalizeName` already exists in the list), `removeFinderIngredient(id)`,
`setFinderIngredientTag({ id, tag })` (tag `null|"expiring"|"required"`),
`clearFinderIngredients()`; selector `selectFinderIngredients`.

`thunks.js`:
```js
export const generateShoppingList = (mode /* "replace" | "merge" */) => (dispatch, getState) => {
  // builds with buildShoppingItems from state.menu entries (in order), state.recipes.entities,
  // selectStapleKeys(state); dispatches replaceMenuItems or mergeMenuItems;
  // returns { itemCount: builtItems.length,
  //           prechecked: builtItems.filter(i => i.isStaple).map(i => ({ name: i.name, quantityText: i.quantityText, unit: i.unit })) }
};
export const addItemsToShoppingList = (ingredients) => (dispatch, getState) => {
  // ingredients: Array<{ name, quantityUnit, unit, category }> (recipe ingredient shape)
  // dispatches addManualItem for each with quantityText = String(quantityUnit ?? ""),
  // isStaple = selectStapleKeys(state).has(normalizeName(name)); returns number added
};
```

### 2.6 Shared UI components (Task 0B implements)

`src/components/dialog/DialogProvider.js` exports `DialogProvider` and `useDialog()`:
```js
const dialog = useDialog();
dialog.alert(title, message?, buttons?)   // same arguments as Alert.alert
// buttons: Array<{ text: string, onPress?: () => void, style?: "default" | "cancel" | "destructive" }>
// default: [{ text: "OK" }]
dialog.prompt({ title, message?, defaultValue = "", placeholder = "", confirmText = "OK", onSubmit /* (text) => void */ })
```
- One dialog visible at a time; later calls queue FIFO.
- Pressing a button closes the dialog first, then calls `onPress` (so `onPress` may open another dialog).
- Backdrop tap / Android back: triggers the `style: "cancel"` button if present; otherwise just closes.
- Layout: centered card, max width 420, padding 16. ≤ 2 buttons → in a row, right-aligned; ≥ 3 → stacked full width. Destructive text uses `colors.danger`; cancel is bold.
- `prompt`: TextInput autofocused with `defaultValue`; buttons "Cancel" and `confirmText`; confirm disabled while trimmed text is empty; `onSubmitEditing` = confirm; `onSubmit` receives the trimmed text.

`src/components/AppModal.js`: `<AppModal visible onClose title footer?>{children}</AppModal>`
— RN `Modal` (transparent, animationType "fade"), dim backdrop (tap = `onClose`), card
with header (title + "Close" text button), `ScrollView` body, optional `footer` node.
Narrow: card anchored to bottom, full width, `maxHeight: "85%"`. Wide (`isWide`): centered,
max width 560.

`src/components/Chip.js`: `<Chip label selected onPress onLongPress? disabled? style?>` —
pill (`radius.pill`), border `colors.border`, selected = background `colors.accentStrong`
and white text; min height 32, horizontal padding 12, `accessibilityRole="button"`,
`accessibilityState={{ selected }}`.

`src/components/CategoryPicker.js`: `<CategoryPicker value onChange>` — wrapped row of
`Chip`s, one per `Object.values(INGREDIENTCATEGORIES)`; tapping the selected chip calls
`onChange("")`.

`src/hooks/useLayout.js`: `useLayout()` → `{ width, height, isWide: width >= 900, isExtraWide: width >= 1200 }` using `useWindowDimensions`.

### 2.7 Rules for every implementation agent
1. Only create/modify the files listed under your task's **Files you own**. If you think
   another file must change, do not change it — say so in your report.
2. **Do not run `git commit`, `git push`, `git checkout`, `git stash`, or `git reset`.** The
   orchestrator commits.
3. Do not add dependencies unless your task says to.
4. No `Alert` imports from `react-native` anywhere after Task 0B. Use `useDialog`.
5. Before reporting, run and pass:
   - `npm test` (after Task 0A exists)
   - `npx expo export --platform web --output-dir <scratch dir given in your prompt>` — must exit 0.
6. Final report: files changed, anything you deviated from or could not do, and anything
   the orchestrator should check.

---

## 3. Task breakdown and order

```
Phase 0 (parallel):  0A Test infra + quantity/ingredientKey   |  0B Dialog + shared UI + Alert removal
Phase 1 (serial):    1A Domain logic (needs 0A)  →  1B Store rewrite + migration (needs 1A)
Phase 2 (parallel):  2A Recipes UI  |  2B Menu UI  |  2C Shopping list + Settings + Pantry UI
Phase 3:             3  Recipe finder UI (needs 2A done: shares RecipeListScreen)
Phase 4:             Orchestrator: integration check in browser, docs (CLAUDE.md, REQUIREMENTS.md)
```

---

### Task 0A — Test infrastructure + quantity and ingredient-key modules

**Files you own:** `package.json`, `package-lock.json`, `src/domain/quantity.js`,
`src/domain/ingredientKey.js`, `src/domain/__tests__/quantity.test.js`,
`src/domain/__tests__/ingredientKey.test.js`.

1. `npm install --save-dev jest-expo@~54.0.18 jest@~29.7.0` (use the versions npm resolves
   for those ranges). Add script `"test": "jest"` and top-level `"jest": { "preset": "jest-expo" }`
   to `package.json`.
2. Implement `quantity.js` and `ingredientKey.js` exactly per §2.3.
3. Tests (each a separate `it`):
   - parse: `""`→blank, `null`→blank, `"2"`→2/2, `"1.5"`, `".5"`, `"1/4"`→0.25,
     `"1 1/2"`→1.5, `"½"`→0.5, `"1½"`→1.5, `"1-2"`→1/2, `"1/2 - 1"`→0.5/1, `"2 to 3"`,
     `"3-1"`→1/3 (swapped), `"a pinch"`→text, `"1/0"`→text, number `3`→3/3.
   - format: `2`→"2", `0.5`→"1/2", `1.5`→"1 1/2", `0.333`→"1/3", `2.75`→"2 3/4",
     `1.43`→"1.43", `1.38`→"1 3/8", `0.1`→"0.1"; range `{1,2}`→"1-2".
   - scale: `"1-2"` × 2 → 2/4; text unchanged; blank unchanged.
   - addQuantities throws on text.
   - singularize: onions→onion, potatoes→potato, berries→berry, peas→pea, glass→glass,
     hummus→hummus, egg→egg, gas→gas (length 3).
   - normalizeName: `"Small Red Potatoes"`→`"small red potato"`,
     `"Boneless Beef Chuck-eye Roast"`→`"boneless beef chuck eye roast"`, `"  Onions "`→`"onion"`.
   - normalizeUnit: Lbs→lb, Tablespoons→tbsp, `"Tbsp."`→tbsp, Cups→cup, Whole→"", `""`→"",
     Leaf→leaf, Leaves→leave (documented heuristic).
   - ingredientKey("Onions","") === ingredientKey("onion","each").
4. `npm test` passes.

### Task 0B — Dialog system, shared UI, and removal of `Alert`

**Files you own:** `App.js`, `src/theme.js`, `src/hooks/useLayout.js`,
`src/components/dialog/DialogProvider.js`, `src/components/AppModal.js`,
`src/components/Chip.js`, `src/components/CategoryPicker.js`, `src/screens/MenuScreen.js`,
`src/components/RecipeCard.js`, `src/screens/RecipeFormScreen.js`.

1. Create `theme.js`, `useLayout.js`, `DialogProvider.js`, `AppModal.js`, `Chip.js`,
   `CategoryPicker.js` per §2.2 and §2.6.
2. `App.js`: wrap `NavigationContainer` in `<DialogProvider>` (inside `GestureHandlerRootView`).
3. Replace every `Alert.alert` with `dialog.alert` keeping the same titles/buttons/behavior,
   in `MenuScreen.js`, `RecipeCard.js`, `RecipeFormScreen.js`. In `RecipeCard.js` change the
   long-press message from `'My Alert Msg'` to `undefined` (title only).
4. In `RecipeFormScreen.js`, replace `Alert.prompt` with `dialog.prompt({ title: "New Recipe Name",
   message: "Please enter the new recipe name", defaultValue: recipe.name, confirmText: "Create",
   onSubmit: (text) => { dispatch(addRecipe({ ...recipe, name: text })); navigation.popToTop(); } })`.
   Also replace the `Alert.alert("To alter the name, …")` with `dialog.alert(...)`.
5. Remove `Alert` from all `react-native` imports. `grep -rn "Alert" src App.js` must only
   show `dialog.alert` / `useDialog` usages.
6. Do NOT otherwise change behavior of those screens (later tasks rewrite them).
7. Verify with the web export. Note: there are no tests for UI.

### Task 1A — Domain logic: shopping list build/merge, recipe search, recipe finder

**Depends on 0A.** **Files you own:** `src/domain/shoppingList.js`,
`src/domain/recipeSearch.js`, `src/domain/recipeFinder.js`, and their tests in
`src/domain/__tests__/`.

**`buildShoppingItems({ entries, recipesById, stapleKeys })`**
- `entries`: ordered `MenuEntry[]`; `recipesById`: `{ [id]: Recipe }`; `stapleKeys`: `Set<string>`.
- Skip entries whose recipe is missing. For each ingredient (in recipe order) whose
  `name.trim()` is non-empty:
  - `q = scaleQuantity(parseQuantity(ingredient.quantityUnit), entry.scale ?? 1)`
  - `nameKey = normalizeName(name)`, `unitKey = normalizeUnit(ingredient.unit ?? "")`
  - `mergeKey`: number → `` `${nameKey}|${unitKey}|n` ``; blank → `` `${nameKey}|${unitKey}|b` ``;
    text → `` `${nameKey}|${unitKey}|t|${entry.id}|${ingredientIndex}` `` (never combines).
  - contribution `{ menuEntryId: entry.id, recipeId: recipe.id, recipeName: recipe.name,
    scale: entry.scale ?? 1, quantity: q, quantityText: formatQuantity(q), note: (ingredient.note ?? "").trim() }`
- Group by `mergeKey` keeping first-appearance order. Each BuiltItem:
  `{ mergeKey, nameKey, name: <first name, trimmed>, unit: <first unit, trimmed>,
     category: <first contribution category that is one of Object.values(INGREDIENTCATEGORIES), else "">,
     contributions, quantityText: computeQuantityText(contributions),
     isStaple: stapleKeys.has(nameKey), checked: stapleKeys.has(nameKey), source: "menu" }`
  (BuiltItem has no `id`.)

**`computeQuantityText(contributions)`**: `[]` → `""`. All number → `formatQuantity` of the
sum. All blank → `""`. Otherwise (single text contribution) → that contribution's `quantityText`.
If kinds are mixed (should not happen), join each `quantityText` that is non-empty with `" + "`.

**`mergeItem(existing, built)`** → new object:
- Start from `existing`. For each built contribution: if `existing` has a contribution with
  the same `menuEntryId`, replace it; otherwise append it and mark `gainedNew = true`.
- `quantityText` recomputed. `isStaple = built.isStaple`.
- `checked`: if `built.isStaple` → `true`; else if `gainedNew` → `false`; else `existing.checked`.
- `category`: `existing.category || built.category`. Name/unit/id/mergeKey unchanged.

**`filterRecipes(recipes, { query, favoritesOnly })`**: `q = query.trim().toLowerCase()`.
Keep a recipe when (`!favoritesOnly || recipe.favorite === true`) AND (`q === ""` OR
`recipe.name.toLowerCase().includes(q)` OR any `ingredient.name.toLowerCase().includes(q)`).

**`ingredientMatches(haveName, recipeIngredientName)`**: `haveWords = normalizeName(haveName).split(" ").filter(Boolean)`;
`recipeWords = new Set(normalizeName(recipeIngredientName).split(" ").filter(Boolean))`;
true iff `haveWords.length > 0` and every have-word is in `recipeWords`.

**`findRecipes(recipes, haveIngredients, { maxMissing = 2 })`**
- `haveIngredients`: `Array<{ name, tag }>`. If none → `{ fullMatches: [], nearMatches: [] }`.
- Per recipe: candidate ingredients = ingredients with non-empty trimmed name, de-duplicated
  by `normalizeName` (keep first). Skip if no candidates.
- `matched` = candidates matched by ≥ 1 have-ingredient; `missing` = the rest (ingredient objects).
- Skip if `matched.length === 0`.
- Skip if any have-ingredient with `tag === "required"` matches none of the candidates.
- Skip if `missing.length > maxMissing`.
- `expiringCount` = number of have-ingredients with `tag === "expiring"` that match ≥ 1 candidate.
- Result `{ recipe, matchedCount, totalCount: candidates.length, missing, expiringCount, isFullMatch: missing.length === 0 }`.
- Sort each group by: `expiringCount` desc, `matchedCount/totalCount` desc, `missing.length` asc,
  `recipe.name.localeCompare` asc.

**Tests** (use small inline fixture recipes, not the seed): combining two recipes ×
"1 onion" → one item "2"; "1 Lbs" + "2 lb" combine to "3"; "1 cup" + "2 tbsp" stay
separate; blank+blank combine to ""; "a pinch" twice → two items; scale 2 doubles and
range scales; staple → checked & isStaple; category picks first valid; missing recipe
skipped; `mergeItem` idempotent for same entry (quantity not doubled, checked preserved);
new entry un-checks; staple stays checked; `filterRecipes` by name, by ingredient,
favoritesOnly; finder full/near/required/expiring ordering/empty input/maxMissing.

### Task 1B — Store rewrite, thunks, migration

**Depends on 1A.** **Files you own:** everything in `src/store/` (including new files and
`src/store/__tests__/`), plus minimal call-site updates in `src/screens/MenuScreen.js`,
`src/screens/ShoppingListScreen.js`, `src/components/RecipeCard.js` **only** to keep the app
compiling and working with the new shapes (see step 6).

1. Implement every action/selector in §2.4–§2.5. Use `createEntityAdapter` for
   `menu.slots`, `menu.entries`, `shoppingList` (with the counter field). Ids are strings
   built from `nextId` inside reducers (`` `slot-${n}` ``, `` `entry-${n}` ``, `` `item-${n}` ``,
   `` `fi-${n}` ``), then `nextId += 1`.
2. `pantrySlice`: `addStaple(name)` stores `{ nameKey: normalizeName(name), name: name.trim() }`
   (ignore if empty key); `toggleStaple(name)` adds or removes.
3. Root reducer keys: `recipes, menu, shoppingList, pantry, settings, finder`.
4. `migrations.js` exports `migrations` (keep the existing v1 entry) and adds **v2**:
   - Old menu `state.menu.menu` (`{ [k]: recipeCopy }`): iterate `Object.keys` sorted
     numerically; for each copy with `id` present in `state.recipes.entities`, create entry
     `{ id: "entry-<n>", recipeId: copy.id, slotId: null, scale: 1 }` with n = 1, 2, …
     New `menu = { slots: { ids: [], entities: {} }, entries: {…}, nextId: n_last + 1 }` (1 if none).
   - Old list `state.shoppingList.shoppingList` (`{ [k]: item }`): each becomes a manual
     item `{ id: "item-<n>", mergeKey: null, nameKey: normalizeName(item.name ?? ""), name: item.name ?? "",
     unit: item.unit ?? "", category: item.category ?? "", quantityText: String(item.quantityUnit ?? ""),
     checked: !!item.checked, isStaple: false, source: "manual", contributions: [] }`.
   - Add `pantry: { staples: {} }`, `settings: { showStapleReminder: true }`,
     `finder: { ingredients: [], nextId: 1 }` if missing.
   - If `state.menu` / `state.shoppingList` are already in the new shape (have `entries` /
     `ids`), leave them as they are.
   `store.js` imports `migrations` and sets persist `version: 2`.
5. Tests in `src/store/__tests__/`: test reducers directly (import slices, not `store.js`).
   Cover every menu action incl. cascade on `deleteRecipe` and `loadRecipeList`, clamp of
   scale, swap order; shopping list replace/merge/removeContribution/manual/staple
   extraReducer; finder dedupe; migration v2 from a hand-written v1 state; the
   `generateShoppingList` thunk using a real `configureStore` with the root reducer (not persisted).
6. Minimal call-site updates (no new UI):
   - `RecipeCard.js`: `addRecipeToMenu({ recipeId })` instead of passing the recipe.
   - `MenuScreen.js`: list `selectUnplannedEntries` + all entries from `selectMenuEntries`
     joined to recipes (simple flat list of recipe names is fine), delete via
     `removeMenuEntry(entry.id)`, Generate uses `dispatch(generateShoppingList("replace"))`.
   - `ShoppingListScreen.js`: use `selectShoppingItems`, `toggleItemChecked`, `quantityText`
     instead of `quantityUnit`.
   - `WelcomeScreen.js` is unchanged (its imported actions still exist).

### Task 2A — Recipes UI (R-6, R-7, R-9, category picker, web layout)

**Depends on 1B.** **Files you own:** `src/screens/RecipeListScreen.js`,
`src/components/RecipeCards.js`, `src/components/RecipeCard.js`,
`src/components/SearchFilter.js`, `src/components/NewRecipeButton.js`,
`src/screens/RecipeFormScreen.js`, `src/screens/RecipeDetailsScreen.js`.

1. **SearchFilter**: controlled `value` / `onChangeText` props; show a "✕" clear button
   (accessibilityLabel "Clear search") when `value` is non-empty.
2. **RecipeListScreen**: state `query` and `favoritesOnly`. Top row: `SearchFilter`,
   `Chip` "★ Favorites" (selected = `favoritesOnly`), `NewRecipeButton`. Remove the
   "Reset recipes" header button (moves to Settings in 2C). Passes
   `filterRecipes(useSelector(selectAllRecipes), { query, favoritesOnly })` to `RecipeCards`.
   Leave `headerRight` unset (Task 3 adds a button).
3. **RecipeCards**: takes `recipes` prop. `numColumns`: width < 600 → 2, < 900 → 3,
   < 1200 → 4, else 5 (from `useLayout().width`). Pass `key={numColumns}` to `FlatList`.
   Cell width `` `${100 / numColumns}%` ``. Empty state text: if no recipes at all
   "No recipes yet. Tap New Recipe to add one."; otherwise "No recipes match your search."
4. **RecipeCard**:
   - Star toggle absolutely positioned top-right over the image: "★" in `colors.favorite`
     when favorite, "☆" in `colors.muted` otherwise; hit area ≥ 36×36;
     `accessibilityLabel` "Add to favorites"/"Remove from favorites"; dispatches `toggleFavorite(recipeId)`.
   - Actions dialog (long press, and a "⋯" button bottom-right of the card shown only when
     `Platform.OS === "web"`): title `recipe.name`, buttons "Add to menu", "Delete" (destructive), "Cancel".
   - "Delete" (from dialog or swipe) asks to confirm: title `` `Delete "${recipe.name}"?` ``,
     message "It will also be removed from your menu.", buttons "Cancel" (cancel), "Delete" (destructive).
   - Remove the unused `index` prop usage and the `console.log`.
5. **RecipeDetailsScreen**:
   - `headerRight`: star toggle (same as card) and "Edit" button (navigates to
     "Recipe Form" with `{ recipeId }`). Effect deps must include `recipe?.favorite`.
   - Under the title: a row with "Add to menu" button (dispatch `addRecipeToMenu({ recipeId })`
     then `dialog.alert("Added to menu", "Find it under Unplanned on the Menu tab.")`).
   - Show "Serves {yield}" when `yield > 0`, "{calories} calories" when `calories > 0`.
   - Each ingredient row: text as today plus a trailing small `Chip` labeled "Staple"
     (selected when `selectIsStaple(state, ingredient.name)`) that dispatches `toggleStaple(ingredient.name)`.
   - When `isWide`: Ingredients and Directions sections side by side (`flexDirection: "row"`, each `flex: 1`).
   - Remove the commented-out image code.
6. **RecipeFormScreen**:
   - `emptyRecipe.time = { prep: 0, active: 0 }`. On save, coerce `time.prep`/`time.active`
     `""` → `0`.
   - Name is an editable `TextInput` in both modes (remove the read-only Text and its alert).
   - Save validation: trimmed name empty → `dialog.alert("Recipe needs a name")`, abort.
   - New mode: `addRecipe({ ...recipe, name: trimmed })`, `popToTop()`.
   - Edit mode: dialog title "Save changes", buttons:
     - "Save changes": if `isRecipeNameTaken(state, trimmed, recipeId)` →
       `dialog.alert("Name already used", `Another recipe is already named "${trimmed}".`)` and abort;
       else `editRecipe({ id: recipeId, changes: { ...recipe, name: trimmed } })`, `pop()`.
       (Use `useStore().getState()` to read state inside the handler.)
     - "Save as new recipe": `addRecipe({ ...recipe, name: trimmed })` (reducer auto-suffixes
       duplicates), `popToTop()`. Remove the `dialog.prompt` flow.
     - "Cancel".
   - Ingredient category: replace the category `TextInput` with `<CategoryPicker>` on its own
     row under the note field.
   - When `isWide`: wrap content in a centered container `maxWidth: 800, width: "100%", alignSelf: "center"`.

### Task 2B — Menu UI (M-4, M-5, M-6, M-7, S-8, P-3, P-4 reminder, web layout)

**Depends on 1B.** **Files you own:** `src/screens/MenuScreen.js` and new files under
`src/components/menu/` (suggested: `MenuDay.js`, `MenuSlot.js`, `MenuEntryRow.js`,
`EntryOptionsModal.js`, `SlotPickerModal.js`, `EntryPickerModal.js`, `DayPickerModal.js`,
`StapleReminderModal.js`).

1. **Header**: `headerRight` "Generate list" button. A toolbar row at the top of the
   screen content with a "New week" button (right-aligned) and the text "{n} recipes planned".
2. **Generate flow** (exact):
   - If `selectMenuEntryCount === 0` → `dialog.alert("Your menu is empty", "Add recipes from My Recipes first.")`.
   - Else if `selectShoppingItemCount === 0` → run `generate("replace")`.
   - Else `dialog.alert("You already have a shopping list", "Replace it with a new list from this menu, or merge this menu's ingredients into it?", [ { text: "Cancel", style: "cancel" }, { text: "Merge", onPress: () => generate("merge") }, { text: "Replace", style: "destructive", onPress: () => generate("replace") } ])`.
   - `generate(mode)`: `const result = dispatch(generateShoppingList(mode))`. If
     `result.prechecked.length > 0 && showStapleReminder` → open `StapleReminderModal`;
     when it closes, `navigation.navigate("ShoppingList")`. Otherwise navigate immediately.
3. **StapleReminderModal** (`AppModal`): title "Check your pantry staples"; text "These
   were added already checked off because they're pantry staples. Make sure you have enough:";
   one row per prechecked item: name in bold + `` `${quantityText} ${unit}`.trim() `` (omit if
   empty). Footer buttons: "Don't remind me again" (dispatch `setShowStapleReminder(false)`,
   close) and "Got it" (close).
4. **Layout (narrow)**: vertical `ScrollView`:
   - Empty state when there are no entries and no slots: "Your menu is empty. Swipe a recipe
     in My Recipes and tap Add to Menu."
   - "Unplanned" section first (always shown). Empty hint: "Recipes you add land here. Tap one to plan it."
   - Then 7 day cards (`selectMenuWeek`). Day header: label + "⋯" button → dialog title label,
     buttons "Swap with another day…" (opens `DayPickerModal` excluding this day → `swapDays`), "Cancel".
   - Slot header: slot name (tap → `dialog.prompt` rename → `renameSlot`) + "⋯" → dialog:
     "Rename", "Move to another day…" (`DayPickerModal` → `moveSlot`), "Remove" → if slot has
     entries: `dialog.alert("Remove {name}?", "What should happen to its {n} recipe(s)?",
     [Cancel, "Move to Unplanned" → removeSlot({removeEntries:false}), "Remove them too" (destructive) → removeSlot({removeEntries:true})])`,
     else remove directly. Empty slot body: muted "Nothing planned".
   - Under each day's slots: quick-add `Chip`s for each `SUGGESTED_SLOT_NAMES` not already
     used on that day (case-insensitive), plus "+ Custom…" (`dialog.prompt` "New meal slot",
     placeholder "e.g. Brunch" → `addSlot`).
5. **MenuEntryRow**: recipe name, a scale badge "×{scale}" when scale ≠ 1, a "⋯" icon on
   web. Tap (or "⋯") → `EntryOptionsModal`. Swipe → "Remove" (right action) dispatches `removeMenuEntry`.
6. **EntryOptionsModal** (`AppModal`, title = recipe name):
   - Servings: text "Serves {round(yield*scale, 1)}" if `recipe.yield > 0`, else "Scale ×{scale}".
     Chips "½×" (0.5), "1×", "2×", "3×" (selected when equal) and "−"/"+" buttons
     (step 0.5, min 0.5, max 20) → `setMenuEntryScale`.
   - Buttons: "Move to…" (opens `SlotPickerModal`), "Swap with…" (opens `EntryPickerModal`),
     "View recipe" (`navigation.navigate("RecipeList", { screen: "Recipe Details", params: { recipeId } })`),
     "Remove from menu" (destructive).
   - Only one modal is visible at a time: opening a picker closes the options modal.
7. **SlotPickerModal** (title "Move to…"): row "Unplanned"; then for each day: day label,
   its slots as rows (current slot marked "(current)" and disabled), and quick-add chips for
   unused `SUGGESTED_SLOT_NAMES` that dispatch `addSlotAndMoveEntry`. Tapping a slot row →
   `moveMenuEntry`. Closes on selection.
8. **EntryPickerModal** (title "Swap with…"): every other entry grouped as
   "Unplanned" / "{Day} · {Slot}" with recipe names → `swapMenuEntries`. Empty text when none.
9. **DayPickerModal**: props `title`, `excludeDay?`, `onSelect(day)`; 7 rows.
10. **New week**: `dialog.alert("Start a new week?", "Your shopping list won't change.",
    [Cancel, "Clear recipes, keep meal slots" → clearMenuEntries, "Clear everything" (destructive) → clearMenu])`.
11. **Wide** (`isWide`): horizontal `ScrollView` of columns: Unplanned column + 7 day
    columns, each width `Math.max(220, (width - 32) / 8)`, each column vertically scrollable.
    Same components inside.
12. Touch targets ≥ 44px high for rows.

### Task 2C — Shopping list, manual items, Settings, Pantry, tabs (S-5, S-7, P-1, P-4, A-2)

**Depends on 1B.** **Files you own:** `src/screens/ShoppingListScreen.js`, new files under
`src/components/shopping/` (suggested `ShoppingItemRow.js`, `AddItemModal.js`),
`src/screens/SettingsScreen.js`, `src/screens/SettingsNavigator.js`,
`src/screens/PantryStaplesScreen.js`, `src/screens/WelcomeScreen.js`, `App.js`.

1. **App.js tabs**: `Welcome` (title "Home"), `RecipeList` (title "Recipes",
   `headerShown: false`), `Menu` (title "Menu"), `ShoppingList` (title "Shopping List"),
   `Settings` (component `SettingsNavigator`, title "Settings", `headerShown: false`).
   Keep the `DialogProvider` from 0B.
2. **SettingsNavigator**: stack with "Settings" (`SettingsScreen`) and "Pantry Staples" (`PantryStaplesScreen`).
3. **SettingsScreen** (centered max width 720 when wide), sections:
   - "Reminders": RN `Switch` "Remind me to check pantry staples after generating a list"
     bound to `selectShowStapleReminder` / `setShowStapleReminder`.
   - "Pantry": row "Pantry staples ({count})" → navigate "Pantry Staples".
   - "Data": buttons each confirmed with `dialog.alert` (Cancel + destructive action):
     "Reset recipes to samples" (`loadRecipeList`; message "Your own recipes will be deleted."),
     "Clear menu" (`clearMenu`), "Clear shopping list" (`clearShoppingList`).
4. **PantryStaplesScreen**: explanation text "Pantry staples are things you usually have.
   When you generate a shopping list they're added already checked off."; `TextInput` +
   "Add" button (also on submit) → `addStaple`; list from `selectStaplesList` with a
   "Remove" button each → `removeStaple(nameKey)`; empty state "No pantry staples yet.".
5. **WelcomeScreen**: remove the three reset buttons and unused imports; the remaining
   button's `title` becomes "Let's go!".
6. **ShoppingListScreen**:
   - `headerRight`: "Add item" → `AddItemModal`.
   - Sections by category exactly as today (order of `INGREDIENTCATEGORIES`, unknown → "Other"),
     items sorted by name (case-insensitive).
   - Empty state: "Your shopping list is empty. Plan your menu and tap Generate list, or add an item."
   - Wide: list centered with `maxWidth: 720`.
7. **ShoppingItemRow**:
   - Left: name (+ `` ` (${note})` `` when exactly one contribution has a non-empty note);
     checked → strikethrough + `colors.muted`. Right: `` `${quantityText} ${unit}`.trim() ``
     and a checkbox (hit area ≥ 44) → `toggleItemChecked`. A small "Pantry" pill when `isStaple`.
   - Under the name, muted small text: one contribution → "for {recipeName}"; ≥ 2 →
     a toggle "▸ {n} recipes" / "▾ {n} recipes" that expands per-row (local state).
   - Expanded: one line per contribution: "{recipeName}{scale !== 1 ? ` (×${scale})` : ""}:
     {`${quantityText} ${unit}`.trim() || "—"}{note ? ` · ${note}` : ""}" and a "Remove"
     text button → `removeContribution({ itemId, menuEntryId })`.
   - Manual items show no sub-text.
   - Long press (and "⋯" on web) → `dialog.alert(item.name, undefined, [ "Mark as pantry staple" | "Remove from pantry staples" → toggleStaple(item.name), "Delete item" (destructive) → deleteItem, "Cancel" ])`.
   - Swipe right action "Delete" (as today).
8. **AddItemModal** (`AppModal`, title "Add item"): fields Name (required), Quantity,
   Unit, `CategoryPicker`. Footer: "Cancel", "Add" (disabled while name empty). On add:
   `dispatch(addManualItem({ name, quantityText, unit, category, isStaple: selectStapleKeys(state).has(normalizeName(name)) }))`,
   reset fields, close.

### Task 3 — Recipe finder screen (X-7)

**Depends on 1B and 2A.** **Files you own:** `src/screens/RecipeFinderScreen.js`,
`src/screens/RecipeListNavigator.js`, `src/screens/RecipeListScreen.js` (header button only).

1. Register stack screen name `"Recipe Finder"` with `options={{ title: "What can I make?" }}`.
2. `RecipeListScreen`: `headerRight` button "What can I make?" → navigate "Recipe Finder".
3. Screen (centered max width 800 when wide):
   - Input row: `TextInput` placeholder "Add an ingredient you have", `blurOnSubmit={false}`,
     `onSubmitEditing` and an "Add" button → split on commas → `addFinderIngredients(names)`, clear input.
   - Toolbar: "Add pantry staples" (disabled when there are none; adds `selectStaplesList` names),
     "Clear all" (one tap, no confirm, disabled when empty).
   - Hint (muted): "Tap Expiring soon to prefer recipes that use it. Tap Must use to only show recipes that include it."
   - One row per ingredient: name, `Chip` "Expiring soon" (selected when tag "expiring"),
     `Chip` "Must use" (selected when tag "required"), "✕" button (accessibilityLabel
     `` `Remove ${name}` ``). Tapping a selected chip sets tag `null`; tapping the other replaces it.
   - Results via `useMemo(() => findRecipes(recipes, ingredients), [recipes, ingredients])`:
     - "You can make" (full matches) and "Almost there" (near matches) section titles, hidden when empty.
     - Card: recipe name (bold), "Have {matchedCount} of {totalCount} ingredients",
       "Uses {expiringCount} expiring item(s)" when > 0, near: "Missing: a, b" and button
       "Add missing to shopping list" → `dispatch(addItemsToShoppingList(missing))` then
       `dialog.alert("Added to shopping list", `${n} item(s) added.`)`.
     - Tap card → navigate "Recipe Details" `{ recipeId }`.
   - Empty states: no ingredients → "Add ingredients you have on hand to see what you can make.";
     ingredients but no results → "No recipes match yet. Try adding more ingredients or removing a Must use tag."

### Phase 4 — Orchestrator integration (not delegated)
- Run tests and the web export; serve the export and click through every flow in Chromium
  at 390px and 1280px widths; fix integration issues.
- Update `CLAUDE.md` (state shapes, domain layer, dialog rule, tests) and the status column
  of `docs/REQUIREMENTS.md`.

---

## 4. Risks and mitigations
| Risk | Mitigation |
|---|---|
| Persisted v1 state breaks on upgrade | v2 migration with a unit test from a hand-written v1 state |
| Name matching false positives/negatives (combining, finder) | Pure, tested heuristics in one place (`ingredientKey.js`) so they are easy to tune |
| Parallel agents editing the same files | Strict file ownership per task; orchestrator commits between phases |
| Web behavior differs (Alert, swipe) | `useDialog` everywhere; visible "⋯" buttons on web; browser smoke test in Phase 4 |
| Native-only issues not testable in this cloud container | Web export + Jest here; owner should smoke-test on iOS/Android via Expo Go |

---

## 5. Follow-up round 2 (owner feedback, 2026-11-04)

Feedback: (1) the finder shows nothing for "Garlic"; add recent-ingredient and
recipe-ingredient suggestions to the finder input; (2) tab icons; (3) drag-and-drop on web;
(4) a short "Added to menu" confirmation when adding by swipe.

**Root cause of (1):** `findRecipes` drops every recipe missing more than 2 ingredients.
Both seed recipes that use garlic miss 8+, so nothing showed. Fix: keep Full/Almost
groups and add a third group of recipes that use at least one entered ingredient.

All §2.7 rules still apply. Persisted shape changes require a migration + test.

### Task 5A — Finder: partial matches, recent ingredients, autocomplete
**Files you own:** `src/domain/recipeFinder.js`, `src/domain/ingredientSuggestions.js` (new),
their tests, `src/store/finderSlice.js`, `src/store/migrations.js`, `src/store/store.js`,
`src/store/__tests__/*` (finder/migration tests), `src/screens/RecipeFinderScreen.js`.

1. `findRecipes` returns `{ fullMatches, nearMatches, otherMatches }`. `otherMatches` = recipes
   that pass every other rule (≥ 1 matched, every "required" matched) but have
   `missing.length > maxMissing`. Same sort. Update tests (add one for "garlic" against two
   recipes with many ingredients → appears in `otherMatches`).
2. `ingredientSuggestions.js`:
   - `collectIngredientNames(recipes)` → unique trimmed ingredient names across all recipes
     (dedupe by `normalizeName`, keep first seen), sorted case-insensitively.
   - `suggestIngredients(allNames, query, { exclude = [], limit = 8 } = {})`: `q = query.trim().toLowerCase()`;
     `""` → `[]`. Drop names whose `normalizeName` equals the `normalizeName` of any `exclude`
     entry. Keep names where lower-case name contains `q` OR `normalizeName(name)` contains
     `normalizeName(q)`. Rank: 0 = name starts with q, 1 = some word starts with q, 2 = other;
     ties by name (case-insensitive). Return at most `limit`. Tests for each rule.
3. `finderSlice`: new field `recent: string[]` (most recent first, max 12, de-duplicated by
   `normalizeName`, newest display text wins). `addFinderIngredients(names)` moves every
   valid submitted name to the front of `recent` (even if it was already in the current list).
   New action `clearRecentFinderIngredients()`. Selector `selectRecentFinderIngredients`
   (returns `state.finder.recent ?? []`). Initial state `{ ingredients: [], recent: [], nextId: 1 }`.
4. Migration **v3**: `finder.recent = finder.recent ?? []` (create `finder` if missing). Persist
   `version: 3`. Test it.
5. `RecipeFinderScreen` input:
   - Track `focused`. `onBlur` hides suggestions after a 150 ms delay so taps register; the
     screen's `ScrollView` uses `keyboardShouldPersistTaps="handled"`.
   - Focused and input empty → inline dropdown titled "Recent" with up to 8 recent names not
     already in the current list, plus a "Clear recent" text button. Hidden if none.
   - Input non-empty → inline dropdown titled "From your recipes" with
     `suggestIngredients(collectIngredientNames(recipes), text, { exclude: currentNames })`.
     Hidden if none.
   - Tapping a suggestion adds it (`addFinderIngredients([name])`), clears the input and keeps
     focus. Enter / "Add" still add the typed text (comma-split).
   - Dropdown is rendered inline directly under the input (not an absolute overlay), rows
     ≥ 44 px tall, bordered card style.
6. Results: third section "Uses some of your ingredients" for `otherMatches`. Card shows
   "Have {matched} of {total} ingredients" and "Missing {n} ingredients" (no add-missing button).

### Task 5B — Tab icons and toast confirmation
**Files you own:** `package.json`, `package-lock.json`, `App.js`, `src/components/toast/ToastProvider.js` (new),
`src/components/RecipeCard.js`, `src/screens/RecipeDetailsScreen.js`.

1. `npx expo install @expo/vector-icons` (adds the SDK-54-compatible version to dependencies).
2. Tab icons with `Ionicons` (`focused ? filled : outline`): Home `home`, Recipes `book`,
   Menu `calendar`, Shopping List `cart`, Settings `settings` (outline = `<name>-outline`).
   `tabBarActiveTintColor: colors.accentStrong`.
3. `ToastProvider` + `useToast()` → `show(message, { actionLabel, onAction, duration = 2500 } = {})`.
   One toast at a time (a new `show` replaces the current one and restarts the timer).
   Absolutely positioned dark pill (`rgba(30,30,30,0.92)`, white text, radius pill), centered
   horizontally, `bottom: 72`, max width 480, fade in/out with `Animated`
   (`useNativeDriver: Platform.OS !== "web"`), container `pointerEvents="box-none"`,
   `accessibilityLiveRegion="polite"`. Optional action is a bold `accentStrong`-light text
   button that calls `onAction` and hides the toast. Place `<ToastProvider>` in `App.js`
   inside `DialogProvider`, wrapping `NavigationContainer`.
4. `RecipeCard`: swipe "Add to Menu" and the actions-dialog "Add to menu" call
   `toast.show(`Added "${recipe.name}" to menu`, { actionLabel: "View", onAction: () => navigation.navigate("Menu") })`.
   `RecipeDetailsScreen` "Add to menu": replace the dialog with the same toast.

### Task 5C — Drag-and-drop on the menu (web only)
**Files you own:** `src/screens/MenuScreen.js`, `src/components/menu/*` (incl. new `useWebDrag.js`).

1. Only when `Platform.OS === "web"`; native behavior unchanged. Use HTML5 drag-and-drop on
   the DOM nodes behind react-native-web Views (a host `View` ref is the DOM element): set
   `draggable="true"` and attach `dragstart/dragend/dragover/dragenter/dragleave/drop`
   listeners in effects; clean up on unmount. Payload in `dataTransfer` under
   `application/x-recipereserve` as JSON `{ type: "entry" | "slot" | "day", id }`.
2. `useWebDrag.js` exports `useDraggable(ref, payload, enabled)` and
   `useDropTarget(ref, { accepts: string[], onDrop(payload) }, enabled)` → `isOver` boolean.
   `dragover` calls `preventDefault()` only for accepted types (check `dataTransfer.types`
   includes the MIME type; store the dragged type in a module-level variable on dragstart
   since payload data is unreadable during dragover).
3. Behaviors:
   - Entry row → another entry row: `swapMenuEntries`.
   - Entry row → a slot (header or body, including an empty slot): `moveMenuEntry` (no-op if same slot).
   - Entry row → Unplanned section: `moveMenuEntry({ slotId: null })`.
   - Slot header → another day card/column: `moveSlot` (no-op if same day).
   - Day header → another day header: `swapDays`.
4. While dragging, the dragged element has opacity 0.5; a target under the pointer gets a
   2px `colors.accentStrong` border/background tint. Draggable elements: `cursor: "grab"`,
   `userSelect: "none"`. Taps still open the existing options.
5. On web, show a muted hint under the toolbar: "Tip: drag a recipe onto a meal to move it,
   or onto another recipe to swap. Drag a day's name onto another day to swap days."
6. Verify with Playwright's `page.dragAndDrop()` (Chromium supports HTML5 DnD).

---

## 6. Follow-up round 3: cross-platform drag-and-drop

Owner report: "drag and drop isn't working at all." Reproduced: the HTML5 implementation
(§5, Task 5C) works with a desktop mouse but **not with touch** (phone/tablet browsers do
not fire HTML5 drag events for fingers) and is intentionally disabled in the native app
(Expo Go). Also found: `useDropTarget` attaches listeners only on mount, so the Unplanned
target in `MenuScreen` goes stale if its View re-mounts (e.g. empty state → board, or
narrow ↔ wide).

Decision: replace HTML5 DnD with one implementation built on `react-native-gesture-handler`
(already installed, works on iOS, Android, and web with mouse and touch). Dragging starts
from a visible **grip handle (≡)** so tap-to-open and swipe-to-remove keep working.
`react-native-reanimated` is NOT installed: use the Gesture API with `.runOnJS(true)` and
React Native's `Animated` for the floating preview.

### Task 6A — Gesture-based drag-and-drop for the weekly menu
**Files you own:** `src/screens/MenuScreen.js`, `src/components/menu/*` (delete
`useWebDrag.js`; create `src/components/menu/drag/DragProvider.js`, `DragHandle.js`,
`useDropZone.js`).

1. **DragProvider** (wraps the menu board inside `MenuScreen`; context):
   - State: `active` (`{ type, id, label } | null`), `hoverKey` (string | null).
   - Zone registry (a ref `Map`): `key → { key, accepts: string[], onDrop(payload), node }`.
   - `begin(payload, x, y)`: set `active`; measure every registered zone with
     `node.measureInWindow((x, y, w, h) => …)` into a rect cache; measure the provider's own
     container in window coordinates (for positioning the preview); disable scrolling.
   - `move(x, y)` (window coordinates from `absoluteX/absoluteY`): update the preview
     position; hit-test cached rects — among zones containing the point whose `accepts`
     includes `active.type`, pick the **smallest area** (innermost wins); set `hoverKey`
     only when it changes. Auto-scroll: if the point is within 80px of the active
     ScrollView's edge (vertical in narrow layout; horizontal outer ScrollView in wide layout),
     `scrollTo` by 12px per move event (clamped to content), then re-measure zones
     (throttle re-measure to once per 100 ms). Track scroll offsets via `onScroll`
     (`scrollEventThrottle={16}`).
   - `end()`: if `hoverKey` is set, call that zone's `onDrop(activePayload)`; then clear
     state and re-enable scrolling. `cancel()`: clear without dropping.
   - Renders a floating preview while `active`: an absolutely positioned pill
     (`colors.accentStrong` background, white bold text = `label`, radius pill, shadow/elevation,
     `pointerEvents="none"`) centered on the pointer via `Animated.ValueXY` translate.
2. **useDropZone({ key, accepts, onDrop })** → `{ ref, isOver }`. `ref` is a **callback ref**
   that registers/unregisters the current host node (so re-mounted Views re-register — fixes
   the stale-target bug). `isOver = hoverKey === key`. Keep `onDrop` in a ref.
   Keys: `unplanned`, `slot:<id>`, `entry:<id>`, `day:<n>`, `dayheader:<n>`.
3. **DragHandle({ payload, label })**: `GestureDetector` with
   `Gesture.Pan().minDistance(4).runOnJS(true)` — `onStart` → `begin`, `onUpdate` → `move`,
   `onEnd` → `end`, `onFinalize(_, success)` → `cancel()` if not ended. Renders an Ionicons
   `reorder-three` icon (size 22, `colors.muted`) in a 44×44 hit area with
   `accessibilityLabel={`Drag ${label}`}`, `accessibilityHint="Drag to move"`; on web add style
   `{ cursor: "grab", touchAction: "none", userSelect: "none" }`.
4. Where handles go (all platforms):
   - **Entry row**: handle at the left of the row. Row is also a drop zone (accepts `entry` → `swapMenuEntries`).
     Native keeps `Swipeable` for swipe-to-remove; web renders without `Swipeable` (as now).
   - **Slot header**: handle before the slot name (payload `slot`). Whole slot is a drop zone
     (accepts `entry` → `moveMenuEntry`, no-op if same slot).
   - **Day header**: handle before the day label (payload `day`). Header is a drop zone
     (accepts `day` → `swapDays`). Whole day card is a drop zone (accepts `slot` → `moveSlot`, no-op if same day).
   - **Unplanned** section is a drop zone (accepts `entry` → `moveMenuEntry({ slotId: null })`).
   - Highlight targets with `isOver`: 2px `colors.accentStrong` border (use `borderColor`
     on an existing 2px transparent border so layout doesn't shift) + `rgba(47,128,237,0.12)` background.
5. Use `ScrollView` from `react-native-gesture-handler` for the menu's scroll views (so the
   pan and scrolling coordinate on native) and pass `scrollEnabled={!active}`.
6. Hint text (all platforms, muted, under the toolbar): "Tip: hold ≡ and drag a recipe onto a
   meal to move it, or onto another recipe to swap. Drag a day's ≡ onto another day to swap days."
7. Remove `useWebDrag.js` and every import of it. Taps, "⋯", Move to…/Swap with… unchanged.
8. Verify in Chromium (Playwright) at 1280×800 with **mouse** (`page.mouse.down/move/up`
   in ≥ 15 steps) and at Pixel-7 emulation with **touch** (CDP `Input.dispatchTouchEvent`
   touchStart/touchMove×10/touchEnd), against `npx expo export --platform web` served
   locally: entry → slot, entry → entry swap, entry → Unplanned, slot → another day, day →
   day swap; plus one auto-scroll drag in the narrow layout (Monday entry → Sunday slot).

---

## 7. Follow-up round 4: recipes on a day without a meal slot

Owner request: "add recipes to days without having to be assigned to a meal."

### Data model change
`MenuEntry = { id, recipeId, slotId: string | null, day: 0..6 | null, scale }`
- `slotId !== null` → in that slot (its day comes from the slot; store `day: null`).
- `slotId === null && day !== null` → on that day, no meal ("day-level entry").
- both null → Unplanned.
Invariant: an entry never has both `slotId` and `day` set.

### Task 7A — Day-level menu entries
**Files you own:** `src/store/menuSlice.js`, `src/store/migrations.js`, `src/store/store.js`,
`src/store/__tests__/*`, `src/screens/MenuScreen.js`, `src/components/menu/*` (incl. `drag/`),
`CLAUDE.md` (menu row of the state table + persist version only).

1. **Reducers** (`menuSlice.js`):
   - `addRecipeToMenu({ recipeId, slotId = null, day = null, scale = 1 })`: if a valid `slotId` is given, `day` is stored `null`; else `day` kept only if 0–6.
   - `moveMenuEntry({ entryId, slotId })`: unchanged behavior; also sets `day: null`.
   - New `moveMenuEntryToDay({ entryId, day })`: `slotId: null`, `day` (0–6, else ignore), move id to end of `entries.ids`. No-op if already day-level on that day.
   - `swapMenuEntries`: swap both `slotId` and `day` (and positions, as today).
   - `addSlotAndMoveEntry`: sets `day: null` on the entry.
   - `removeSlot({ slotId, removeEntries })`: when `removeEntries` is false, entries become day-level on the slot's day (`slotId: null, day: slot.day`) — no longer Unplanned.
   - `swapDays({ dayA, dayB })`: also swaps `day` on day-level entries.
   - `extraReducers` cascades unchanged.
2. **Selectors:**
   - `selectMenuWeek`: each day object gains `entries` (day-level entries with recipe, in `entries.ids` order) next to `slots`.
   - `selectUnplannedEntries`: `slotId === null && day == null` (treat missing `day` as null).
3. **Migration v5**: every menu entry without a `day` key gets `day: null`. Persist `version: 5`. Test it.
4. **Tests**: every reducer change above, the invariant (never both set), selectors, migration.
5. **UI:**
   - `MenuDay`: render the day-level entries with `MenuEntryRow` directly under the day header, above the slots (no sub-heading). If the day has no slots and no entries, nothing extra (the quick-add chips stay).
   - Drop zones: the **day card** zone now accepts `["slot", "entry"]`; `entry` → `moveMenuEntryToDay` (no-op if the entry is already day-level on that day). Slot zones and entry rows are smaller so they still win when the pointer is over them (innermost wins). The day header zone stays `["day"]`; an entry dropped on the header falls through to the card → day-level.
   - `SlotPickerModal` ("Move to…"): under each day label, first row "{Day} — no specific meal" → `moveMenuEntryToDay` (marked "(current)" and disabled when it is the entry's current placement), then that day's slots, then the quick-add chips.
   - `EntryPickerModal` ("Swap with…"): group day-level entries as "{Day}".
   - `EntryOptionsModal` / anything that shows the entry's location: day-level reads "{Day}".
   - `MenuScreen` remove-slot dialog: button "Move to Unplanned" becomes `Keep them on ${dayLabel}` (still `removeEntries: false`). Message unchanged.
   - Hint text: "Tip: hold ≡ and drag a recipe onto a day or a meal to move it, or onto another recipe to swap. Drag a day's ≡ onto another day to swap days."
   - Wide layout and narrow layout both.
6. Verify: `npm test`; web export; Playwright (mouse 1280×800 and touch Pixel 7) — drag Unplanned entry onto Monday's card (outside any slot) → appears under Monday header with no meal; drag it into a slot → moves into slot; drag from slot back onto the day card area → day-level again; "Move to…" → "Tuesday — no specific meal" works; swap days carries day-level entries; remove a slot with entries → "Keep them on Monday" leaves them day-level; Generate list still includes day-level recipes.
