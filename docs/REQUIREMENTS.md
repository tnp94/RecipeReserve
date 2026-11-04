# RecipeReserve — Requirements & Features

_Last updated: 2026-11-04_

## Vision

RecipeReserve lets a user store their favorite recipes and ingredients, plan a weekly
**menu** from those recipes, and then — **in one action** — turn that menu into a
shopping list they can check off while they shop.

The one-tap "menu → shopping list" flow is the core reason the app exists. Every other
feature supports or extends it.

## Status legend

| Status | Meaning |
|---|---|
| ✅ Done | Implemented in the current app |
| 🟡 Partial | Started, but incomplete or not wired up |
| ⬜ Planned | Core requirement, not yet built |
| 🔭 Stretch | Stretch goal, not committed |

---

## 1. Core requirements

### 1.1 Recipe library

| ID | Requirement | Status |
|---|---|---|
| R-1 | User can create a recipe with name, image, ingredients, directions, prep/active time, difficulty, calories, dish count, and yield. | ✅ |
| R-2 | Each ingredient has a name, quantity, unit, note, and store category (Dairy, Produce, Canned, Meat, Baking, Bakery, Deli, Frozen, Other). | ✅ |
| R-3 | User can view a list of saved recipes and open a recipe's details. | ✅ |
| R-4 | User can edit a recipe, choosing to overwrite it or save it as a copy. | ✅ |
| R-5 | User can delete a recipe (swipe or long-press action sheet). | ✅ |
| R-6 | User can mark recipes as favorites. | 🟡 `favorite` field exists in the data model; no UI yet |
| R-7 | User can search/filter their recipes. | 🟡 Search box is rendered but does not filter |
| R-8 | Recipes persist across app restarts. | ✅ (redux-persist / AsyncStorage) |
| R-9 | Renaming a recipe updates it cleanly (no stale keys / duplicates). | ⬜ Recipes are keyed by name; renaming keeps the old key |

### 1.2 Weekly menu (meal planning)

| ID | Requirement | Status |
|---|---|---|
| M-1 | User can add a recipe to the menu (swipe or long-press on a recipe). | ✅ |
| M-2 | User can add the same recipe to the menu more than once. | ✅ |
| M-3 | User can remove a recipe from the menu. | ✅ |
| M-4 | The menu is organized as a **week** (e.g. recipes assigned to days / meals). | ⬜ See open question Q1 |
| M-5 | User can clear/start a new week's menu. | ⬜ |

### 1.3 Shopping list (primary feature)

| ID | Requirement | Status |
|---|---|---|
| S-1 | One action ("Generate List") builds the shopping list from every ingredient in the menu. | ✅ |
| S-2 | Items are grouped by store category, with unknown categories under "Other". | ✅ |
| S-3 | User can check items off (and un-check them) while shopping. | ✅ |
| S-4 | User can delete individual items. | ✅ |
| S-5 | User can manually add items not tied to a recipe (e.g. paper towels). | 🟡 `addItem` reducer exists; no UI yet |
| S-6 | Duplicate ingredients across recipes are combined (e.g. 2 recipes × 1 onion → 2 onions). | ⬜ See open question Q3 |
| S-7 | Shopping list persists across app restarts. | ✅ |

---

## 2. Stretch goals

| ID | Feature | Notes |
|---|---|---|
| X-1 | **Online recipe repository** — users can publish recipes and browse/import others'. | Requires accounts + a backend. |
| X-2 | **Family members / households** — share recipes, menu, and shopping list with others. | Requires accounts + sync. |
| X-3 | **Scan a recipe** from a printed page (camera → OCR → recipe form). | Pre-fill the recipe form for review. |
| X-4 | **Import from URL** — paste a link to a recipe web page and add it. | Many sites expose schema.org `Recipe` JSON-LD. |
| X-5 | **Paste recipe text** — copy/paste raw text and parse it into a recipe. | Shares the parsing/review step with X-3 and X-4. |

X-3, X-4, and X-5 are all "get a recipe into the app without typing it" and should share
one parse → review → save flow.

---

## 3. Open questions

1. **Menu structure (M-4):** Should the weekly menu assign recipes to specific days (and
   meals like breakfast/lunch/dinner), or stay a simple unordered list of recipes for the week?
2. **Servings scaling:** Should the user be able to scale a recipe's servings on the menu
   (e.g. double a recipe) and have the shopping list quantities scale with it?
3. **Combining ingredients (S-6):** Should "Generate List" merge the same ingredient across
   recipes and sum quantities? Only when units match, or with unit conversion?
4. **Regenerating the list:** Today "Generate List" replaces the whole list, losing check
   marks and manually added items. Should it instead merge, or ask first?
5. **Pantry items:** Should there be a way to mark staples you already have (salt, oil) so
   they're skipped or pre-checked?
6. **Platforms:** Target iOS and Android only, or also web?
7. **Accounts & sync:** Is the core app intended to stay local-only (no login) until the
   stretch goals, or should accounts/cloud backup come earlier?
8. **Stretch priority:** Which stretch goal matters most first?
