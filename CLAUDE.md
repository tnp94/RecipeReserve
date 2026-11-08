# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (Expo Go works, except recipe scanning, which needs a development build)
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
                 shopping-list build/merge, recipe search, recipe finder, category guessing,
                 pasted-text parsing, display formatting, week helpers (+ __tests__)
src/store/       Redux Toolkit slices, thunks, persist migrations (+ __tests__)
src/services/    device and network work: recipeFetch.js downloads a recipe page; recipeScan.js picks
                 a photo and reads it with on-device OCR (+ __tests__)
src/components/  ui/ (shared kit), dialog/, toast/, AppModal, Chip, CategoryPicker,
                 menu/, recipeForm/, shopping/
src/screens/     screens and stack navigators
src/navigation/screenOptions.js   useHeaderOptions(): header styling for every tab and stack
src/hooks/       useLayout (isWide >= 900, isExtraWide >= 1200), useGenerateList
src/theme/       index.js (theme API), tokens.js, themes/ (colours)
```

Keep business logic in `src/domain/` with tests; keep screens thin.

Domain modules added for the recipe form and shopping list:
- `categoryGuess.js`: `guessCategory(name, memory)` returns a category or `""`. `memory` comes from `buildCategoryMemory(recipes)` (the most common real category per ingredient in the user's recipes) and wins over the built-in word lists.
- `ingredientParse.js`: `parseIngredientLine`, `parseIngredientList`, `parseDirections` turn pasted text into form rows. The output is a first draft that the user reviews in the form.
- `recipeImport.js`: `parseRecipeText` (a pasted block of text) and `parseRecipeHtml` (schema.org JSON-LD in a web page; null if none) both return the same draft, `{ name, ingredients, directions, time, yield, calories }`. Any new import route should produce this draft too.
- `format.js`: `formatMinutes`, `totalMinutes`, `plural`. `week.js`: `todayIndex`, `SHORT_DAYS` (Monday-first, matching menu days).

### Theme

Never hard-code colours, and don't use a bare `StyleSheet.create` for themed styles. Import from `src/theme`:

```js
const useStyles = makeStyles((t) => ({ box: { backgroundColor: t.colors.surface, padding: spacing.md } }));
const styles = useStyles();                 // inside the component; cached per theme
const theme = useTheme();                   // for colours passed as props (icons, tints)
```

- `tokens.js` holds the theme-independent `spacing`, `radius`, `typography`, `elevation(theme, level)` and `HIT` (44, the minimum touch target).
- `themes/freshWarm.js` holds colours under semantic names (`primary`, `surface`, `textMuted`, `danger`, `onPrimary`…). `DEFAULT_THEME_NAME` is in `themes/defaultName.js` so the store can import it without pulling in React Navigation.
- The active theme name is in `settings.themeName`. `App.js` passes it to `ThemeProvider`, and an unknown name falls back to the default.
- To add a theme: create `themes/<name>.js` with the same colour keys and register it in `THEMES` in `src/theme/index.js`. There is only one theme today, so Settings has no picker; add one that dispatches `setThemeName`.

### UI kit

Build screens from `src/components/ui` (import from the folder's `index.js`) rather than raw `Text`, `TextInput` or one-off buttons: `AppText` (`variant` is a `typography` key, plus `tone`), `Button`, `IconButton`, `Card`, `TextField`, `SegmentedControl`, `RecipeThumb` (placeholder tile when a recipe has no image), `HeaderButton`/`HeaderButtons`, `SectionHeader`, `EmptyState`, `ProgressBar`, `Badge`, `ListRow`, `Divider`.

### Shared flows

- `useGenerateList(navigation)` (`src/hooks/useGenerateList.js`) is the whole Generate-list flow: empty-menu message, Replace/Merge prompt, staple reminder, then opening the list. It returns `{ onGenerate, reminderModal, entryCount }`; render `reminderModal` in the screen. Used by Menu, Home and Shopping List.
- `useAddToMenu()` (`src/components/menu/AddToMenuSheet.js`) returns `{ openAddToMenu(recipe), addToMenuSheet }`; render `addToMenuSheet` in the screen. The sheet adds to Unplanned, a day or a meal slot, then shows a toast with a "View menu" action. Used by Recipes, Recipe Details and Recipe Finder.

### Navigation

`App.js`: Provider → PersistGate → ThemeProvider → GestureHandlerRootView → SafeAreaProvider →
DialogProvider → ToastProvider → NavigationContainer → bottom tabs. (SafeAreaProvider is required for web.)

There is no app-level `SafeAreaView`: it doubled the top padding under the navigator headers. Anything drawn outside a navigator header (Home, `AppModal`, the toast) applies `useSafeAreaInsets()` itself.

- Tabs (route name → title): `Home`, `RecipeList` → Recipes, `Menu`, `ShoppingList` → Shopping (badge shows unchecked items), `Settings`
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
level with the pointer — with a 56px zone, 300 ms dwell, speed scaling with depth, and full speed when the pointer is past the edge, e.g. over the tab bar: `autoScrollDelta` in `src/domain/menuDrag.js`), `DragHandle` (≡ grip; its Pan gesture is memoized so re-renders never replace it mid-drag), and
`useDropZone` (callback ref, so re-mounted Views re-register). Each zone passes `actionFor(payload)`, built on `menuDropAction` (`src/domain/menuDrag.js`): `DROP_SWAP`, `DROP_INSERT` or null. It sets the preview chip's icon (swap: `sync`, insert: `download-outline`, otherwise the grip), and `onDrop` only runs when it isn't null, so zones don't repeat no-op checks. For touch or stylus (`pointerType`, including on web) the chip sits `TOUCH_LIFT` above the finger, and it stays inside the container; the hit test still uses the finger position. Drags start only from ≡ handles
so tap and native swipe-to-remove keep working. Entry → entry swaps, entry → slot or Unplanned
moves, slot → day moves the slot, day → day swaps. Slot → slot reorders (`reorderSlot`; `onDrop(payload, {x,y,rect,half})` — the same `half` that drew the insertion line, shown as an insertion line). Menu scroll views come from
gesture-handler. Web entry rows render without `Swipeable`.

### State (Redux + redux-persist)

The whole root reducer (`src/store/rootReducer.js`) is persisted to AsyncStorage. Persist
`version: 8`; migrations live in `src/store/migrations.js` — bump the version and add a
migration (with a test) whenever a persisted shape changes. The one exception is a new optional
`settings` flag: saved `settings` from older versions won't have the key, so its selector must
fall back to the default (see `selectThemeName`), and no migration is needed.

| Slice | Shape |
|---|---|
| `recipes` | entity adapter `{ ids, entities, nextId }`, numeric ids |
| `menu` | `{ slots: {ids, entities}, entries: {ids, entities}, nextId }` — Slot `{ id, day: 0–6 (Mon-first), name }`, MenuEntry `{ id, recipeId, slotId \| null, day \| null, scale }` (`slotId` set → in that slot, `day` null; `slotId` null + `day` 0–6 → on that day with no meal; both null → Unplanned) |
| `shoppingList` | entity adapter `{ ids, entities, nextId, removed }` — items with `mergeKey, nameKey, name, unit, category, quantityText, checked, isStaple, source: "menu"\|"manual"\|"finder", contributions[]`; `removed[mergeKey]` = menu entries whose portion the user removed/deleted (Merge skips them; Replace/Clear reset it) |
| `pantry` | `{ staples: { [nameKey]: { nameKey, name } } }` |
| `settings` | `{ showStapleReminder, themeName, hideMenuTip, hideGettingStarted, finderSort }` |
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
- `deleteCheckedItems` ("Clear checked") records removed menu portions in `removed`, so Merge doesn't add bought items back. Checked items sort last on screen, and tapping a row toggles it. Items with no category appear under a guessed aisle; this is display only, and the stored `category` doesn't change.
- Units: one-letter `T` = tbsp and `t` = tsp are the only case-sensitive units (`normalizeUnit`).
- iOS can't present a `Modal` while another is dismissing. Every Modal goes through `useGatedModal` (`src/components/modalGate.js`): `AppModal` and `DialogProvider` render `visible={shown}` / `onDismiss`, and a Modal asked to show waits until no other is mid-dismiss. Never render a raw `Modal` elsewhere, and don't unmount a sheet while it is visible (keep its content, e.g. `EntryOptionsModal` keeps the last entry).
- Finder "Add missing" adds `source: "finder"` items with a merge key and a placeholder contribution (`fromFinder`, `menuEntryId: "finder:<recipeId>"`), skipping names already on the list. On Merge the placeholder is replaced when its own recipe is planned and kept (added to) for other recipes.
- Staples are pre-checked when a line first becomes a staple; after that, Merge keeps the user's own tick. Text amounts ("a pinch") use `textMergeKey` (entry + text, not ingredient position). Format amount + unit with `formatAmount` (`src/domain/quantity.js`).

### Data Model

Recipe objects (`src/Recipes.js` seed data) have the shape:
```js
{
  id, name, image, count, favorite,
  ingredients: [{ name, quantityUnit, unit, note, category }],  // quantityUnit is the quantity text ("1 1/2", "1-2")
  time: { prep, active },   // minutes
  difficulty, calories, dishesAmount, yield,   // yield is the form's "Serves" field
  directions: [string]
}
```
`difficulty` is `"Easy"`, `"Medium"`, `"Hard"` or `""` (`DIFFICULTIES` in `RecipeFormScreen.js`). Older recipes can hold free text, which the form keeps as an extra option rather than dropping it.
Ingredient categories: `INGREDIENTCATEGORIES` in `src/Models/Ingredient.js` (pick with `CategoryPicker`, or leave to `guessCategory`).

The recipe form (`RecipeFormScreen.js`, `components/recipeForm/`) guesses a category for a row until the user picks one (`_autoCategory`). `PasteModal` adds whole ingredient lists or directions. `ImportRecipeModal` (new recipes only) fills the whole form from a link, pasted text or a photo, and the form is the review step; there's no server, so on web a site that blocks cross-site requests falls back to paste. Scanning (`scanRecipe(photoUri)`, returning `{ draft, text }`) uses ML Kit, so it needs a development or store build: `isScanAvailable()` hides the Scan tab on web and in Expo Go. A scan shows what it found rather than going straight to the form: the user can scan the next page (pages are joined and parsed as one text, for recipes split across pages) or open the scanned text in the paste tab to fix. `parseIngredientList` rejoins ingredients that wrapped onto a second line (`joinWrappedIngredients`). Adding native code means bumping `version` and `android.runtimeVersion` in `app.json`, so an over-the-air update can't reach builds without that code. A `beforeRemove` listener warns about unsaved changes. Save overwrites the recipe; "Save as a new recipe" and "Delete recipe" are at the bottom of the form.
Quantities are parsed/scaled/formatted with `src/domain/quantity.js`.

### Seed data

`src/Recipes.js` exports `recipeList`, the initial recipes and what Settings → "Reset recipes to samples" restores.
