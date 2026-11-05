import { INGREDIENTCATEGORIES as C } from "../Models/Ingredient";
import { normalizeName } from "./ingredientKey";

// Guesses an ingredient's store category from its name, so the user rarely has to pick
// one. Order of evidence:
//   1. What the user chose before: the category this exact ingredient has in their recipes.
//   2. A modifier that decides the aisle on its own ("frozen peas", "canned tomatoes").
//   3. A known multi-word phrase ("tomato paste", "peanut butter", "green beans").
//   4. The last word that is a known food (the head noun: "beef broth" -> broth), then
//      the remaining words right to left ("chicken thighs" -> chicken).
// Returns "" when nothing matches; callers show that as "Other".
//
// All keys below are in normalizeName() form (lowercase, singular).

const FRESH_HERBS = ["basil", "cilantro", "parsley", "mint", "dill", "chive", "thyme", "rosemary", "sage", "oregano", "tarragon"];

const WORDS = {
  [C.PRODUCE]: [
    "apple", "apricot", "arugula", "asparagus", "avocado", "banana", "beet", "berry", "blackberry", "blueberry",
    "bok", "broccoli", "brussels", "cabbage", "cantaloupe", "carrot", "cauliflower", "celery", "chard", "cherry",
    "corn", "cranberry", "cucumber", "eggplant", "fennel", "fig", "garlic", "ginger", "grape", "grapefruit",
    "jalapeno", "kale", "kiwi", "leek", "lemon", "lettuce", "lime", "mango", "melon", "mushroom", "nectarine",
    "okra", "onion", "orange", "papaya", "parsnip", "peach", "pear", "pineapple", "plum", "pomegranate", "potato",
    "pumpkin", "radish", "raspberry", "romaine", "rutabaga", "scallion", "shallot", "spinach", "sprout", "squash",
    "strawberry", "tomatillo", "tomato", "turnip", "watermelon", "yam", "zucchini", "herb", "lemongrass", "produce",
    ...FRESH_HERBS,
  ],
  [C.DAIRY]: [
    "butter", "buttermilk", "cheddar", "cheese", "cream", "creamer", "egg", "feta", "ghee", "gouda", "gruyere",
    "kefir", "margarine", "mascarpone", "milk", "mozzarella", "parmesan", "parmigiano", "pecorino",
    "provolone", "ricotta", "yogurt", "yoghurt", "brie", "swiss", "colby", "monterey",
  ],
  [C.MEAT]: [
    "bacon", "beef", "brisket", "chicken", "chop", "chorizo", "cod", "crab", "duck", "fillet", "filet", "fish",
    "halibut", "lamb", "lobster", "meat", "meatball", "mussel", "pork", "roast", "salmon", "sausage",
    "scallop", "shrimp", "sirloin", "steak", "tenderloin", "thigh", "tilapia", "trout", "tuna", "turkey", "veal",
    "venison", "wing", "drumstick", "breast", "loin", "chuck", "mince", "prawn", "clam", "oyster",
  ],
  [C.CANNED]: [
    "bean", "broth", "chickpea", "condiment", "honey", "jam", "jelly", "ketchup", "lentil", "mayo", "mayonnaise",
    "mustard", "olive", "paste", "pickle", "relish", "salsa", "sauce", "sriracha", "stock", "syrup", "tahini",
    "vinegar", "worcestershire", "caper", "bouillon", "preserve",
  ],
  [C.BAKING]: [
    "allspice", "baking", "breadcrumb", "cardamom", "chocolate", "cinnamon", "cocoa", "cornmeal", "cornstarch", "cumin",
    "extract", "flour", "nutmeg", "oil", "paprika", "pepper", "peppercorn", "powder", "salt", "seasoning", "spice",
    "sprinkle", "sugar", "turmeric", "vanilla", "yeast", "molasses", "shortening", "gelatin", "coriander", "panko",
  ],
  [C.BAKERY]: [
    "bagel", "baguette", "bread", "brioche", "bun", "ciabatta", "croissant", "focaccia", "muffin", "naan", "pita",
    "roll", "sourdough", "tortilla", "wrap", "flatbread", "english",
  ],
  [C.DELI]: ["deli", "ham", "hummus", "pastrami", "pepperoni", "prosciutto", "salami", "mortadella", "coleslaw", "pancetta"],
  [C.FROZEN]: ["frozen", "popsicle", "sorbet"],
};

// Multi-word phrases that the word rules would get wrong. Checked longest first.
const PHRASES = {
  [C.PRODUCE]: ["green bean", "snap pea", "snow pea", "bell pepper", "red pepper", "green pepper", "yellow pepper", "chili pepper", "jalapeno pepper", "serrano pepper", "poblano pepper", "habanero pepper", "sweet potato", "green onion", "spring onion", "bok choy", "collard green", "mixed green", "salad green"],
  [C.DAIRY]: ["sour cream", "cream cheese", "heavy cream", "whipping cream", "half and half", "cottage cheese", "greek yogurt"],
  [C.CANNED]: ["tomato paste", "tomato sauce", "diced tomato", "crushed tomato", "peanut butter", "almond butter", "coconut milk", "coconut cream", "soy sauce", "fish sauce", "hoisin sauce", "hot sauce", "black bean", "kidney bean", "pinto bean", "refried bean", "cannellini bean"],
  [C.BAKING]: ["baking soda", "baking powder", "garlic powder", "onion powder", "chili powder", "chili flake", "red pepper flake", "black pepper", "white pepper", "bay leaf", "brown sugar", "powdered sugar", "olive oil", "vegetable oil", "canola oil", "sesame oil", "coconut oil", "chocolate chip", "bread crumb", "panko bread crumb", "dried herb", "italian seasoning", "salt and pepper", "ground cinnamon", "ground cumin", "ground ginger", "ground clove", "whole clove"],
  [C.DELI]: ["deli meat", "sliced turkey", "turkey breast slice", "roast beef slice"],
  [C.FROZEN]: ["ice cream", "puff pastry", "pie crust", "frozen pea", "frozen corn"],
};

// Head nouns the categories above don't cover (no pasta/grains aisle). Stop here rather
// than guess from an earlier word ("egg noodles" is not Dairy).
const UNGUESSABLE = new Set([
  "pasta", "noodle", "spaghetti", "penne", "macaroni", "linguine", "fettuccine", "lasagna", "rice", "quinoa",
  "couscous", "oat", "cereal", "cracker", "chip", "water", "wine", "beer", "coffee", "tea", "tofu", "nut",
  "almond", "walnut", "pecan", "cashew", "peanut", "seed", "raisin",
]);

// Words that put the ingredient in a given aisle no matter what follows.
const MODIFIERS = { frozen: C.FROZEN, canned: C.CANNED, jarred: C.CANNED, can: C.CANNED };

const VALID = new Set(Object.values(C));

const WORD_TO_CATEGORY = new Map();
for (const [category, words] of Object.entries(WORDS)) {
  for (const w of words) if (!WORD_TO_CATEGORY.has(w)) WORD_TO_CATEGORY.set(w, category);
}

const PHRASE_LIST = Object.entries(PHRASES)
  .flatMap(([category, phrases]) => phrases.map((p) => ({ words: normalizeName(p).split(" "), category })))
  .sort((a, b) => b.words.length - a.words.length);

const containsPhrase = (words, phrase) => {
  for (let i = 0; i + phrase.length <= words.length; i += 1) {
    if (phrase.every((w, k) => words[i + k] === w)) return true;
  }
  return false;
};

// Most common real category (not "Other") each ingredient has across the user's recipes.
// Returns Map<nameKey, category>.
export function buildCategoryMemory(recipes) {
  const counts = new Map();
  for (const recipe of recipes ?? []) {
    for (const ing of recipe?.ingredients ?? []) {
      const category = ing?.category;
      if (!VALID.has(category) || category === C.UNCATEGORIZED) continue;
      const key = normalizeName(ing.name);
      if (!key) continue;
      const byCategory = counts.get(key) ?? new Map();
      byCategory.set(category, (byCategory.get(category) ?? 0) + 1);
      counts.set(key, byCategory);
    }
  }
  const memory = new Map();
  counts.forEach((byCategory, key) => {
    let best = null;
    byCategory.forEach((n, category) => {
      if (!best || n > best.n) best = { category, n };
    });
    memory.set(key, best.category);
  });
  return memory;
}

export function guessCategory(name, memory) {
  const key = normalizeName(name);
  if (!key) return "";
  if (memory && memory.has(key)) return memory.get(key);
  const words = key.split(" ");

  for (const w of words) if (MODIFIERS[w]) return MODIFIERS[w];

  for (const p of PHRASE_LIST) if (containsPhrase(words, p.words)) return p.category;

  // Dried or ground herbs live with the spices; fresh ones with produce.
  const dried = words.includes("dried") || words.includes("ground");
  for (let i = words.length - 1; i >= 0; i -= 1) {
    const w = words[i];
    if (dried && FRESH_HERBS.includes(w)) return C.BAKING;
    if (UNGUESSABLE.has(w)) return "";
    const category = WORD_TO_CATEGORY.get(w);
    if (category) return category;
  }
  return "";
}
