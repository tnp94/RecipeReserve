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
For brief confirmations use `useToast().show(message, { actionLabel, onAction })` from
`src/components/toast/ToastProvider.js`. Tab icons use `Ionicons` from `@expo/vector-icons`.

### Menu drag-and-drop (all platforms)

Built on `react-native-gesture-handler` (no reanimated: gestures use `.runOnJS(true)`), in
`src/components/menu/drag/`: `DragProvider` (drag state in a small external store read via
`useSyncExternalStore`, so a hover change re-renders only the affected zones; zone registry
measured with `measureInWindow`; smallest-zone hit test limited to the board's visible area;
floating preview; edge auto-scroll on any registered `DragScrollView` — the innermost one
under the pointer — with a 56px zone, 300 ms dwell, speed scaling with depth), `DragHandle` (≡ grip; its Pan gesture is memoized so re-renders never replace it mid-drag), and
`useDropZone` (callback ref, so re-mounted Views re-register). Drags start only from ≡ handles
so tap and native swipe-to-remove keep working. Entry → entry swaps, entry → slot or Unplanned
moves, slot → day moves the slot, day → day swaps. Slot → slot reorders (`reorderSlot`; `onDrop(payload, {x,y,rect,half})` — the same `half` that drew the insertion line, shown as an insertion line). Menu scroll views come from
gesture-handler. Web entry rows render without `Swipeable`.

### State (Redux + redux-persist)

The whole root reducer (`src/store/rootReducer.js`) is persisted to AsyncStorage. Persist
`version: 7`; migrations live in `src/store/migrations.js` — bump the version and add a
migration (with a test) whenever a persisted shape changes.

| Slice | Shape |
|---|---|
| `recipes` | entity adapter `{ ids, entities, nextId }`, numeric ids |
| `menu` | `{ slots: {ids, entities}, entries: {ids, entities}, nextId }` — Slot `{ id, day: 0–6 (Mon-first), name }`, MenuEntry `{ id, recipeId, slotId \| null, day \| null, scale }` (`slotId` set → in that slot, `day` null; `slotId` null + `day` 0–6 → on that day with no meal; both null → Unplanned) |
| `shoppingList` | entity adapter `{ ids, entities, nextId, removed }` — items with `mergeKey, nameKey, name, unit, category, quantityText, checked, isStaple, source: "menu"\|"manual"\|"finder", contributions[]`; `removed[mergeKey]` = menu entries whose portion the user removed/deleted (Merge skips them; Replace/Clear reset it) |
| `pantry` | `{ staples: { [nameKey]: { nameKey, name } } }` |
| `settings` | `{ showStapleReminder }` |
| `finder` | `{ ingredients: [{ id, name, tag: null\|"expiring"\|"required" }], recent: string[], nextId }` |

Key points:
- Menu entries reference recipes by `recipeId` (no copies). Deleting a recipe or "Reset recipes" removes orphaned entries via `extraReducers`. Placement: `slotId` set = in that meal slot (`day: null`); `slotId: null` + `day` 0–6 = on that day with no meal; both null = Unplanned (never both set). Order = order of `entries.ids`. Breakfast/Lunch/Dinner slots always display in that order within a day (`orderDaySlots` in `src/domain/menuOrder.js`, display-only); other slots keep their position.
- `generateShoppingList(mode)` thunk (`src/store/thunks.js`, mode `"replace"`/`"merge"`) uses `buildShoppingItems` and returns `{ itemCount, prechecked }` for the staple reminder.
- Combining: same `normalizeName` + `normalizeUnit` and both numeric (or both blank) → one item with per-recipe `contributions`. Text quantities ("a pinch") never combine. No unit conversion. Merge is idempotent per menu entry.
- Plurals: `singularizeWord` (`src/domain/ingredientKey.js`) handles -ies/-oes/-ches/-shes/-xes/-sses/-s plus `IRREGULAR` (leaves→leaf, chilies→chili, cookies→cookie…) and `UNCHANGED` (asparagus, hummus…) lists. The finder also uses `wordsMatch` (whole words differing only by a trailing s/es). Changing these rules changes stored keys — add a migration that re-keys pantry and shopping list (see v4).
- Slot order: `reorderSlot` edits `slots.ids`; display is always `orderDaySlots` (Breakfast/Lunch/Dinner keep relative order). "Move up/down" in the slot menu uses `moveSlotTarget` (`src/domain/menuOrder.js`).
- `toggleStaple(name)` is a thunk that dispatches `addStaple`/`removeStaple`; the shopping list mirrors `isStaple` from those.
- Ids for slots/entries/items/finder ingredients are strings (`slot-3`, `entry-7`, `item-12`, `fi-2`). Never reset `menu.nextId` (even `clearMenu` keeps it): shopping-list contributions remember `menuEntryId`, and a reused id would make Merge overwrite last week's amount.
- Merge unchecks an item when it gains a recipe or its total grows; one contribution per menu entry per item (a recipe listing an ingredient twice is summed).
- Units: one-letter `T` = tbsp and `t` = tsp are the only case-sensitive units (`normalizeUnit`).
- iOS can't present a `Modal` while another is dismissing. `DialogProvider` runs a button's `onPress` only after its Modal's `onDismiss` on iOS (timer fallback), so a dialog button may safely open a sheet; sheet → sheet switches use `switchModal` in `MenuScreen`.
- Finder "Add missing" adds `source: "finder"` items with a merge key (skipping names already on the list); a later Merge turns a matching finder item into the menu line instead of duplicating it.

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
