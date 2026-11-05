import { collectIngredientNames, suggestIngredients } from "../ingredientSuggestions";

describe("collectIngredientNames", () => {
  it("dedupes by normalized name, trims, sorts case-insensitively", () => {
    const recipes = [
      { ingredients: [{ name: " onion " }, { name: "Garlic" }, { name: "" }] },
      { ingredients: [{ name: "Onions" }, { name: "apple" }] },
    ];
    expect(collectIngredientNames(recipes)).toEqual(["apple", "Garlic", "onion"]);
  });
});

describe("suggestIngredients", () => {
  const names = ["Black Garlic", "Garlic", "Garlic Powder", "Egg", "Onion", "Red Onions"];
  it("returns [] for empty query", () => {
    expect(suggestIngredients(names, "  ")).toEqual([]);
  });
  it("ranks prefix, then word-prefix, then contains", () => {
    expect(suggestIngredients(names, "gar")).toEqual(["Garlic", "Garlic Powder", "Black Garlic"]);
    expect(suggestIngredients(names, "lic")).toEqual(["Black Garlic", "Garlic", "Garlic Powder"]);
  });
  it("matches by normalized (singular) name", () => {
    expect(suggestIngredients(names, "onions")).toEqual(["Red Onions", "Onion"]);
  });
  it("excludes by normalized name and respects limit", () => {
    expect(suggestIngredients(names, "onion", { exclude: ["onions"] })).toEqual(["Red Onions"]);
    expect(suggestIngredients(names, "gar", { limit: 2 })).toHaveLength(2);
  });
});
