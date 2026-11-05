# RecipeReserve — Requirements & Features

_Last updated: 2026-11-05 (core requirements and X-7 implemented — see docs/plan/IMPLEMENTATION_PLAN.md; X-8 and X-9 added)_

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
| R-6 | User can mark recipes as favorites. | ✅ |
| R-7 | User can search/filter their recipes. | ✅ |
| R-8 | Recipes persist across app restarts. | ✅ (redux-persist / AsyncStorage) |
| R-9 | Renaming a recipe updates it cleanly (no stale keys / duplicates). | ✅ |

### 1.2 Weekly menu (meal planning)

| ID | Requirement | Status |
|---|---|---|
| M-1 | User can add a recipe to the menu (swipe or long-press on a recipe). | ✅ |
| M-2 | User can add the same recipe to the menu more than once. | ✅ |
| M-3 | User can remove a recipe from the menu. | ✅ |
| M-4 | The menu is organized as a **week**: each recipe can be placed on a day and in a meal slot (e.g. Tuesday dinner). Slots are free-form: the user can add, rename, remove, or skip them, and can leave a recipe unassigned. Suggested slots (breakfast, lunch, dinner, snack) are only shortcuts and never restrict what the user can do. | ✅ |
| M-5 | Moving or swapping meals and days is quick and easy (e.g. drag-and-drop, or a "move to…" / "swap with…" action). Plans change often, so this should take one or two taps. | ✅ "Move to…" / "Swap with…" (drag-and-drop not built) |
| M-6 | User can scale a recipe's servings on the menu (e.g. double or halve it), and shopping list quantities scale with it. | ✅ |
| M-7 | User can clear the menu and start a new week. | ✅ |

### 1.3 Shopping list (primary feature)

| ID | Requirement | Status |
|---|---|---|
| S-1 | One action ("Generate List") builds the shopping list from every ingredient in the menu. | ✅ |
| S-2 | Items are grouped by store category, with unknown categories under "Other". | ✅ |
| S-3 | User can check items off (and un-check them) while shopping. | ✅ |
| S-4 | User can delete individual items. | ✅ |
| S-5 | User can manually add items not tied to a recipe (e.g. paper towels). | ✅ |
| S-6 | The same ingredient from different recipes is combined into one line when the units match (e.g. 2 recipes × 1 onion → 2 onions). Ingredients with different units stay on separate lines. | ✅ |
| S-7 | A combined item can be expanded to show each recipe that needs it and the quantity/unit for each, so the user can make a substitution for one recipe. | ✅ |
| S-8 | If a shopping list already exists, "Generate List" asks the user whether to replace it or merge the new items in before doing anything. | ✅ |
| S-9 | Shopping list persists across app restarts. | ✅ |

### 1.4 Pantry staples

| ID | Requirement | Status |
|---|---|---|
| P-1 | User can mark ingredients as pantry staples they usually have on hand (e.g. salt, oil). | ✅ |
| P-2 | When the list is generated, pantry staples are added already checked off. | ✅ |
| P-3 | After generating, the app reminds the user which staples and quantities were pre-checked, so they can make sure they really have enough before shopping. | ✅ |
| P-4 | The reminder has a "Don't remind me again" option, and the user can turn it back on in settings. | ✅ |

### 1.5 Platforms & accounts

| ID | Requirement | Status |
|---|---|---|
| A-1 | Runs on iOS and Android. | ✅ (Expo) |
| A-2 | Runs on the web, with a fuller layout that takes advantage of larger screens. | ✅ |
| A-3 | Works with no account. All data can stay local on the device. | ✅ |

---

## 2. Stretch goals

| ID | Feature | Notes |
|---|---|---|
| X-1 | **Online recipe repository** — users can publish recipes and browse/import others'. | Requires accounts + a backend. |
| X-2 | **Family members / households** — share recipes, menu, and shopping list with others. | Requires accounts + sync. |
| X-3 | **Scan a recipe** from a printed page (camera → OCR → recipe form). | Pre-fill the recipe form for review. |
| X-4 | **Import from URL** — paste a link to a recipe web page and add it. | Many sites expose schema.org `Recipe` JSON-LD. |
| X-5 | **Paste recipe text** — copy/paste raw text and parse it into a recipe. | Shares the parsing/review step with X-3 and X-4. |
| X-7 ⭐ ✅ | **"What can I make?" recipe finder (priority)** — the user enters the ingredients they have on hand **for this search**. Nothing is stored long-term, so there's no inventory to keep up to date. The app suggests recipes that use those ingredients:<br>• **Full matches:** recipes the user can make with what they have.<br>• **Near matches:** recipes missing only one or two ingredients, with the missing items listed (and an option to add them to the shopping list).<br>Results are ranked by how many of the recipe's ingredients the user has. In the search, each entered ingredient can be quickly tagged with one tap:<br>• **Soon to expire:** prefer recipes that use it (ranks them higher).<br>• **Required ("use for sure"):** only show recipes that include it.<br>The ingredients from the last search are remembered and pre-filled next time. Each one can be removed with one tap, and a **Clear all** button empties the list. | Uses up food before it spoils and can save a trip to the store. Pantry staples (P-1) can be pre-filled as a starting point. Searches the user's own recipes first, and the online repository (X-1) later. |
| X-6 | **Saved meal plans** — save a whole week's menu and load it again later. | e.g. a "busy week" plan to reuse. |
| X-8 | **Filter recipes by time and difficulty** — in the recipe list, the user can filter by total time (prep + active), e.g. "under 30 min", and by difficulty (Easy / Medium / Hard). Filters can be combined with each other and with the search box. | Builds on R-7. Difficulty is free text today, so it needs a fixed set of levels to filter on. Recipes with no time or difficulty set should still be findable (e.g. not hidden by default). |
| X-9 | **Leftovers on the menu** — a recipe on the menu can be marked as "leftovers" with one tap. Its ingredients are left off the shopping list when it's generated, since the food is already made. | e.g. Monday's chili eaten again on Wednesday. Unlike pantry staples (P-2), which are added already checked off, leftover ingredients aren't added at all. The meal still shows on the menu so the week stays accurate. |

X-3, X-4, and X-5 are all "get a recipe into the app without typing it" and should share
one parse → review → save flow.

⭐ = priority stretch goal.

---

## 3. Decisions

- **Menu structure:** Recipes go into days and meals. Moving them around must be easy.
- **Combining ingredients:** Combine when units match. A combined item can be expanded to show which recipe needs what.
- **Regenerating the list:** Ask the user first: replace or merge.
- **Meal slots:** Fully flexible. Suggestions help the user but never restrict them.
- **Platforms:** iOS and Android, plus web, offering a fuller interface for people who want it.
- **Accounts:** Not required. The app works fully offline and local-only. Accounts are optional and only needed for sharing/sync stretch goals.
- **Stretch priority:** The recipe finder (X-7) is the priority stretch goal. The order of the rest will be decided after the core is complete.
- **Recipe finder:** Includes near matches. There's no inventory to maintain: ingredients are entered for each search and can be tagged with one tap (soon to expire / required). The last search's ingredients are remembered, each is easy to remove, and there's a Clear all button.
- **Promoted to core:** Scaling servings, manually added list items, and pantry staples with a reminder to check them.

## 4. Open questions

_None right now._ Stretch goal order (after X-7) will be revisited once the core requirements are complete.
