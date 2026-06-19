# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (scan QR code with Expo Go)
npm run android    # Run on Android emulator/device
npm run ios        # Run on iOS simulator/device
npm run web        # Run in browser
```

There are no tests and no lint scripts configured.

## Architecture

RecipeReserve is an Expo / React Native app. All source lives in `src/`.

### Navigation

Two navigators are composed in `App.js`:
- **Bottom tab navigator** — top level with four tabs: Welcome, RecipeList, Menu, ShoppingList
- **Stack navigator** (`RecipeListNavigator`) — lives inside the RecipeList tab and manages: My Recipes → Recipe Details → New Recipe / Edit Recipe

Screens receive `navigation` and `route` props from React Navigation in the standard way.

### State (Redux + redux-persist)

`src/store/store.js` combines three slices and persists the entire root reducer to AsyncStorage, so state survives app restarts.

| Slice | File | Shape |
|---|---|---|
| `recipes` | `recipesSlice.js` | Object keyed by recipe name: `{ [name]: RecipeObject }` |
| `menu` | `menuSlice.js` | `{ recipeID: number, menu: { [id]: RecipeObject } }` |
| `shoppingList` | `shoppingListSlice.js` | `{ itemID: number, shoppingList: { [id]: IngredientObject } }` |

**Important:** Recipes are keyed by name, not a stable ID. The `addRecipe` reducer auto-appends `" copy N"` to prevent collisions. `editRecipe` takes `{ recipeName, recipe }` and overwrites in-place under the old key — renaming a recipe does not update the key. The `loadRecipeList` action resets recipes to the hardcoded seed data in `src/Recipes.js`.

The menu uses an auto-incrementing `recipeID` counter so deleting a menu item doesn't affect the keys of remaining items. The shopping list works the same way with `itemID`.

### Data Model

Recipe objects (`src/Recipes.js`) have the shape:
```js
{
  name, image, count, favorite,
  ingredients: [{ name, quantityUnit, unit, note, category }],
  time: { prep, active },   // minutes
  difficulty, calories, dishesAmount, yield,
  directions: [string]
}
```

Ingredient categories are defined as an enum in `src/Models/Ingredient.js` (`INGREDIENTCATEGORIES`). The `ingredientTemplate()` factory from the same file is used when adding new ingredients in the recipe forms.

### Key interaction patterns

- **RecipeCard** (swipeable): swipe left → "Add to Menu", swipe right → "Delete"; long press → action sheet with the same options.
- **MenuScreen**: "Generate List" button calls `generateShoppingList(menu)` which flattens all menu recipe ingredients into the shopping list slice, replacing the previous list.
- **ShoppingListScreen**: renders items grouped by `INGREDIENTCATEGORIES` order; items with unknown/empty categories appear under "Other".
- **EditRecipeScreen**: "Save/copy" prompts whether to overwrite the existing recipe or create a new one (`addRecipe` vs `editRecipe`).

### Seed data

`src/Recipes.js` exports `recipeList` — a hardcoded object with a few sample recipes. This is the initial Redux state and is also what "Reset recipes" on the list screen resets to.
