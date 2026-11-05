import { buildCategoryMemory, guessCategory } from "../categoryGuess";
import { recipeList } from "../../Recipes";

describe("guessCategory", () => {
  it.each([
    ["Onions", "Produce"],
    ["Small Red Potatoes", "Produce"],
    ["Fresh Chives", "Produce"],
    ["Fresh Thyme", "Produce"],
    ["Dried thyme", "Baking"],
    ["Green Beans", "Produce"],
    ["Bell pepper", "Produce"],
    ["Jalapeno pepper", "Produce"],
    ["Salt and Pepper", "Baking"],
    ["Black pepper", "Baking"],
    ["Red pepper flakes", "Baking"],
    ["Unsalted Butter", "Dairy"],
    ["Peanut butter", "Canned"],
    ["Eggs", "Dairy"],
    ["Sour cream", "Dairy"],
    ["Ice cream", "Frozen"],
    ["Coconut milk", "Canned"],
    ["Boneless Beef Chuck-eye Roast", "Meat"],
    ["Pork Tenderloin", "Meat"],
    ["Ground beef", "Meat"],
    ["Chicken thighs", "Meat"],
    ["Beef Broth", "Canned"],
    ["Chicken stock", "Canned"],
    ["Tomato Paste", "Canned"],
    ["Hoisin Sauce", "Canned"],
    ["Black beans", "Canned"],
    ["All-Purpose Flour", "Baking"],
    ["Extra Virgin Olive Oil", "Baking"],
    ["Garlic powder", "Baking"],
    ["Bay Leaf", "Baking"],
    ["Garlic", "Produce"],
    ["Garlic cloves", "Produce"],
    ["Celery ribs", "Produce"],
    ["Peach halves", "Produce"],
    ["Sourdough bread", "Bakery"],
    ["Flour tortillas", "Bakery"],
    ["Prosciutto", "Deli"],
    ["Frozen Peas", "Frozen"],
    ["Frozen spinach", "Frozen"],
    ["Canned tomatoes", "Canned"],
    ["Swiss chard", "Produce"],
  ])("%s -> %s", (name, category) => {
    expect(guessCategory(name)).toBe(category);
  });

  it.each(["Dry Red Wine", "Egg noodles", "Basmati rice", "Water", "Mystery ingredient", "", "  "])(
    "%p -> no guess",
    (name) => {
      expect(guessCategory(name)).toBe("");
    }
  );

  it("prefers what the user chose before", () => {
    const memory = new Map([["hoisin sauce", "Deli"]]);
    expect(guessCategory("Hoisin sauces", memory)).toBe("Deli");
    expect(guessCategory("Soy sauce", memory)).toBe("Canned");
  });
});

describe("buildCategoryMemory", () => {
  it("keeps the most common real category per ingredient and ignores Other/blank/invalid", () => {
    const recipes = [
      { ingredients: [{ name: "Garlic", category: "Produce" }, { name: "Salt", category: "" }] },
      { ingredients: [{ name: "garlic", category: "Produce" }, { name: "Salt", category: "Other" }] },
      { ingredients: [{ name: "Garlic", category: "Baking" }, { name: "Salt", category: "bogus" }] },
    ];
    const memory = buildCategoryMemory(recipes);
    expect(memory.get("garlic")).toBe("Produce");
    expect(memory.has("salt")).toBe(false);
  });

  it("handles missing data", () => {
    expect(buildCategoryMemory(undefined).size).toBe(0);
    expect(buildCategoryMemory([{}, { ingredients: [null, { name: "" , category: "Dairy" }] }]).size).toBe(0);
  });

  it("learns from the seed recipes", () => {
    const memory = buildCategoryMemory(recipeList);
    expect(memory.get("unsalted butter")).toBe("Dairy");
  });
});
