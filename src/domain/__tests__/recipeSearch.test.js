import { filterRecipes } from "../recipeSearch";

const recipes = [
  { id: 1, name: "Beef Stew", favorite: true, ingredients: [{ name: "Carrot" }] },
  { id: 2, name: "Pancakes", favorite: false, ingredients: [{ name: "Flour" }, { name: "Milk" }] },
  { id: 3, name: "Carrot Cake", ingredients: [{ name: "Flour" }] },
];

describe("filterRecipes", () => {
  it("returns all recipes for empty query", () => {
    expect(filterRecipes(recipes)).toEqual(recipes);
    expect(filterRecipes(recipes, { query: "   " })).toEqual(recipes);
  });
  it("filters by name case-insensitively", () => {
    expect(filterRecipes(recipes, { query: "PANcake" }).map((r) => r.id)).toEqual([2]);
  });
  it("filters by ingredient name and preserves input order", () => {
    expect(filterRecipes(recipes, { query: "carrot" }).map((r) => r.id)).toEqual([1, 3]);
  });
  it("favoritesOnly keeps only favorite === true", () => {
    expect(filterRecipes(recipes, { favoritesOnly: true }).map((r) => r.id)).toEqual([1]);
  });
  it("combines favoritesOnly with query", () => {
    expect(filterRecipes(recipes, { query: "carrot", favoritesOnly: true }).map((r) => r.id)).toEqual([1]);
    expect(filterRecipes(recipes, { query: "flour", favoritesOnly: true })).toEqual([]);
  });
});
