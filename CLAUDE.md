# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (scan QR code with Expo Go)
npm run android    # Run on Android emulator/device
npm run ios        # Run on iOS simulator/device
npm run web        # Run in browser
npm test           # Jest (jest-expo preset) — domain + store unit tests
npx expo export --platform web --output-dir <dir>   # Bundle smoke check
```

No lint script is configured. Requirements live in `docs/REQUIREMENTS.md`; the design
rationale and data contracts are in `docs/plan/IMPLEMENTATION_PLAN.md`.

## Architecture

RecipeReserve is an Expo SDK 54 / React Native app (JavaScript). All source lives in `src/`.

```
src/domain/      pure logic, no React/Redux — quantity parsing, ingredient keys,
                 shopping-list build/merge, recipe search, recipe finder (+ __tests__)
src/store/       Redux Toolkit slices, thunks, persist migrations (+ __tests__)
src/components/  shared UI (dialog/, AppModal, Chip, CategoryPicker), menu/, shopping/
src/screens/     screens and stack navigators
src/hooks/useLayout.js   width breakpoints (isWide >= 900, isExtraWide >= 1200)
src/theme.js     colors / spacing / radius tokens
```

Keep business logic in `src/domain/` with tests; keep screens thin.

### Navigation

`App.js`: Provider → PersistGate → GestureHandlerRootView → SafeAreaProvider → SafeAreaView →
DialogProvider → NavigationContainer → bottom tabs. (SafeAreaProvider is required for web.)

- Tabs (route name → title): `Welcome` → Home, `RecipeList` → Recipes, `Menu`, `ShoppingList` → Shopping List, `Settings`
- `RecipeListNavigator` stack: My Recipes → Recipe Details → Recipe Form; My Recipes → Recipe Finder ("What can I make?")
- `SettingsNavigator` stack: Settings → Pantry Staples

### Dialogs — never use `Alert`

`Alert.alert` is a no-op on web and `Alert.prompt` is iOS-only. Use
`const dialog = useDialog()` from `src/components/dialog/DialogProvider.js`:
`dialog.alert(title, message, buttons)` (same API as `Alert.alert`) and
`dialog.prompt({ title, defaultValue, confirmText, onSubmit })`. Use `AppModal` for richer sheets.
Every swipe / long-press action also has a visible "⋯" button on web.

### State (Redux + redux-persist)

The whole root reducer (`src/store/rootReducer.js`) is persisted to AsyncStorage. Persist
`version: 2`; migrations live in `src/store/migrations.js` — bump the version and add a
migration (with a test) whenever a persisted shape changes.

| Slice | Shape |
|---|---|
| `recipes` | entity adapter `{ ids, entities, nextId }`, numeric ids |
| `menu` | `{ slots: {ids, entities}, entries: {ids, entities}, nextId }` — Slot `{ id, day: 0–6 (Mon-first), name }`, MenuEntry `{ id, recipeId, slotId \| null, scale }` |
| `shoppingList` | entity adapter `{ ids, entities, nextId }` — items with `mergeKey, nameKey, name, unit, category, quantityText, checked, isStaple, source: "menu"\|"manual", contributions[]` |
| `pantry` | `{ staples: { [nameKey]: { nameKey, name } } }` |
| `settings` | `{ showStapleReminder }` |
| `finder` | `{ ingredients: [{ id, name, tag: null\|"expiring"\|"required" }], nextId }` |

Key points:
- Menu entries reference recipes by `recipeId` (no copies). Deleting a recipe or "Reset recipes" removes orphaned entries via `extraReducers`. Entry `slotId: null` = Unplanned. Order within a slot = order of `entries.ids`.
- `generateShoppingList(mode)` thunk (`src/store/thunks.js`, mode `"replace"`/`"merge"`) uses `buildShoppingItems` and returns `{ itemCount, prechecked }` for the staple reminder.
- Combining: same `normalizeName` + `normalizeUnit` and both numeric (or both blank) → one item with per-recipe `contributions`. Text quantities ("a pinch") never combine. No unit conversion. Merge is idempotent per menu entry.
- `toggleStaple(name)` is a thunk that dispatches `addStaple`/`removeStaple`; the shopping list mirrors `isStaple` from those.
- Ids for slots/entries/items/finder ingredients are strings (`slot-3`, `entry-7`, `item-12`, `fi-2`).

### Data Model

Recipe objects (`src/Recipes.js` seed data) have the shape:
```js
{
  id, name, image, count, favorite,
  ingredients: [{ name, quantityUnit, unit, note, category }],  // quantityUnit is the quantity text ("1 1/2", "1-2")
  time: { prep, active },   // minutes
  difficulty, calories, dishesAmount, yield,
  directions: [string]
}
```
Ingredient categories: `INGREDIENTCATEGORIES` in `src/Models/Ingredient.js` (pick with `CategoryPicker`).
Quantities are parsed/scaled/formatted with `src/domain/quantity.js`.

### Seed data

`src/Recipes.js` exports `recipeList`, the initial recipes and what Settings → "Reset recipes to samples" restores.
