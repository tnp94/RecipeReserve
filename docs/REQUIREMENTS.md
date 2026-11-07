# RecipeReserve — Requirements & Features

_Last updated: 2026-11-07 (core requirements and X-7 implemented — see docs/plan/IMPLEMENTATION_PLAN.md; X-8 and X-9 added; UX revamp recorded: R-10 to R-12, S-10, S-11; recipe import X-3 to X-5 built, with optional follow-ups listed under section 2)_

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
| R-4 | User can edit a recipe. Save overwrites it, and "Save as a new recipe" keeps the original. | ✅ |
| R-5 | User can delete a recipe (swipe, long-press or "⋯" action sheet, or from the recipe form). | ✅ |
| R-6 | User can mark recipes as favorites. | ✅ |
| R-7 | User can search/filter their recipes. | ✅ |
| R-8 | Recipes persist across app restarts. | ✅ (redux-persist / AsyncStorage) |
| R-9 | Renaming a recipe updates it cleanly (no stale keys / duplicates). | ✅ |
| R-10 | User can paste a whole ingredient list or set of directions into the recipe form and review the parsed rows. | ✅ |
| R-11 | Ingredient store categories are guessed automatically, using the user's own recipes first, and the user can change them. | ✅ |
| R-12 | The recipe form warns before leaving with unsaved changes. | ✅ |

### 1.2 Weekly menu (meal planning)

| ID | Requirement | Status |
|---|---|---|
| M-1 | User can add a recipe to the menu from a picker that offers a day, one of that day's meal slots, or "Not sure yet" (Unplanned). | ✅ |
| M-2 | User can add the same recipe to the menu more than once. | ✅ |
| M-3 | User can remove a recipe from the menu. | ✅ |
| M-4 | The menu is organized as a **week**: each recipe can be placed on a day and in a meal slot (e.g. Tuesday dinner). Slots are free-form: the user can add, rename, remove, or skip them, and can leave a recipe unassigned. Suggested slots (breakfast, lunch, dinner, snack) are only shortcuts and never restrict what the user can do. | ✅ |
| M-5 | Moving or swapping meals and days is quick and easy (e.g. drag-and-drop, or a "move to…" / "swap with…" action). Plans change often, so this should take one or two taps. | ✅ Drag-and-drop, plus "Move to…" / "Swap with…" |
| M-6 | User can scale a recipe's servings on the menu (e.g. double or halve it), and shopping list quantities scale with it. | ✅ |
| M-7 | User can clear the menu and start a new week. | ✅ |

### 1.3 Shopping list (primary feature)

| ID | Requirement | Status |
|---|---|---|
| S-1 | One action ("Generate List") builds the shopping list from every ingredient in the menu. | ✅ |
| S-2 | Items are grouped by store category. Items with no category appear under a guessed aisle, or "Other" if no guess is possible. | ✅ |
| S-3 | User can check items off (and un-check them) by tapping the row while shopping. Checked items sort last. | ✅ |
| S-4 | User can delete individual items. | ✅ |
| S-5 | User can manually add items not tied to a recipe (e.g. paper towels). | ✅ |
| S-6 | The same ingredient from different recipes is combined into one line when the units match (e.g. 2 recipes × 1 onion → 2 onions). Ingredients with different units stay on separate lines. | ✅ |
| S-7 | A combined item can be expanded to show each recipe that needs it and the quantity/unit for each, so the user can make a substitution for one recipe. | ✅ |
| S-8 | If a shopping list already exists, "Generate List" asks the user whether to replace it or merge the new items in before doing anything. | ✅ |
| S-9 | Shopping list persists across app restarts. | ✅ |
| S-10 | User can clear all checked items at once. A later Merge doesn't add them back. | ✅ |
| S-11 | The list shows shopping progress, and the tab badge shows how many items are left. | ✅ |

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
| X-3 🟡 | **Scan a recipe** from a printed page (camera → OCR → recipe form). | Built with on-device OCR. Tested on Android, not yet on iOS. Pre-fills the recipe form for review. Not available on web or in Expo Go. Built for single-column pages; multi-column pages and handwriting (confirmed to read poorly) are left for a possible online AI scan later. Known limit: a photo of a sideways page doesn't read unless the phone rotates the photo itself. |
| X-4 ✅ | **Import from URL** — paste a link to a recipe web page and add it. | Reads schema.org `Recipe` JSON-LD. The page is fetched on the device, with no server, so on web many sites are blocked by the browser's cross-site rules; the app then offers paste (X-5) instead. Known limit: ingredient notes on some altonbrown.com recipes parse incorrectly; left for possible AI interpretation later. |
| X-5 ✅ | **Paste recipe text** — copy/paste raw text and parse it into a recipe. | Shares the parsing/review step with X-3 and X-4. |
| X-7 ⭐ ✅ | **"What can I make?" recipe finder (priority)** — the user enters the ingredients they have on hand **for this search**. Nothing is stored long-term, so there's no inventory to keep up to date. The app suggests recipes that use those ingredients:<br>• **Full matches:** recipes the user can make with what they have.<br>• **Near matches:** recipes missing only one or two ingredients, with the missing items listed (and an option to add them to the shopping list).<br>A toggle sorts results by **fewest ingredients missing** (the default, in the groups above) or by **uses most of the list** (one flat list, most entered ingredients used first). The choice is remembered. In the search, each entered ingredient can be quickly tagged with one tap:<br>• **Soon to expire:** prefer recipes that use it (ranks them higher).<br>• **Required ("use for sure"):** only show recipes that include it.<br>The ingredients from the last search are remembered and pre-filled next time. Each one can be removed with one tap, and a **Clear all** button empties the list. | Uses up food before it spoils and can save a trip to the store. Pantry staples (P-1) can be pre-filled as a starting point. Searches the user's own recipes first, and the online repository (X-1) later. |
| X-6 | **Saved meal plans** — save a whole week's menu and load it again later. | e.g. a "busy week" plan to reuse. |
| X-8 | **Filter recipes by time and difficulty** — in the recipe list, the user can filter by total time (prep + active), e.g. "under 30 min", and by difficulty (Easy / Medium / Hard). Filters can be combined with each other and with the search box. | Builds on R-7. The recipe form now offers Easy / Medium / Hard, but older recipes can still hold free text, so the filter must handle those. Recipes with no time or difficulty set should still be findable (e.g. not hidden by default). |
| X-9 | **Leftovers on the menu** — a recipe on the menu can be marked as "leftovers" with one tap. Its ingredients are left off the shopping list when it's generated, since the food is already made. | e.g. Monday's chili eaten again on Wednesday. Unlike pantry staples (P-2), which are added already checked off, leftover ingredients aren't added at all. The meal still shows on the menu so the week stays accurate. |

X-3, X-4, and X-5 are all "get a recipe into the app without typing it" and should share
one parse → review → save flow.

### Recipe import follow-ups (optional)

From the review of X-3 to X-5. None of these block a release.

- **Trim the scan languages.** `@react-native-ml-kit/text-recognition` bundles the Chinese, Japanese, Korean and Devanagari text models as well as Latin, on Android and iOS. ML Kit adds about 22 MB to the Android debug APK, but most of that is native code for four processor types, and a Play Store download only includes one. Removing the four extra languages takes a small patch to the library; the saving hasn't been measured.
- **Send a browser-style User-Agent when fetching a link.** Link import sends no browser identifier, and some sites refuse requests like that. No site has failed this way yet, so leave it until one does.
- **Store listing: data safety.** Scanning adds camera and photo permissions. When publishing, the Play Store's data safety form should say photos are processed on the device and not collected or shared.

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
