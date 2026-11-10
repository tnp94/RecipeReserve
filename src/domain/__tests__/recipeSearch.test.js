import { difficultyLevel, filterRecipes } from "../recipeSearch";

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

describe("difficultyLevel", () => {
  it("maps the three levels case-insensitively", () => {
    expect(difficultyLevel("easy")).toBe("Easy");
    expect(difficultyLevel(" MEDIUM ")).toBe("Medium");
    expect(difficultyLevel("Hard")).toBe("Hard");
  });
  it("maps older free-text words with a clear meaning", () => {
    expect(difficultyLevel("Simple")).toBe("Easy");
    expect(difficultyLevel("very  easy")).toBe("Easy");
    expect(difficultyLevel("Intermediate")).toBe("Medium");
    expect(difficultyLevel("Challenging")).toBe("Hard");
  });
  it("returns empty for blank or unknown values", () => {
    expect(difficultyLevel("")).toBe("");
    expect(difficultyLevel(undefined)).toBe("");
    expect(difficultyLevel("needs a blowtorch")).toBe("");
  });
});

describe("filterRecipes by time and difficulty", () => {
  const timed = [
    { id: 1, name: "Toast", difficulty: "Easy", time: { prep: 2, active: 3 } },
    { id: 2, name: "Stir fry", difficulty: "medium", time: { prep: 10, active: 20 } },
    { id: 3, name: "Roast", difficulty: "Hard", time: { prep: 20, active: 70 } },
    { id: 4, name: "Salad", difficulty: "Simple", time: { prep: "", active: "" } },
    { id: 5, name: "Mystery", difficulty: "", ingredients: [{ name: "Toast crumbs" }] },
  ];
  const ids = (opts) => filterRecipes(timed, opts).map((r) => r.id);

  it("keeps every recipe when no filter is set, including ones with no time or difficulty", () => {
    expect(ids({})).toEqual([1, 2, 3, 4, 5]);
    expect(ids({ maxMinutes: null, difficulties: [] })).toEqual([1, 2, 3, 4, 5]);
  });
  it("maxMinutes is inclusive on prep + active and leaves out recipes with no time", () => {
    expect(ids({ maxMinutes: 30 })).toEqual([1, 2]);
    expect(ids({ maxMinutes: 15 })).toEqual([1]);
    expect(ids({ maxMinutes: 90 })).toEqual([1, 2, 3]);
  });
  it("difficulties keeps any of the chosen levels, including mapped free text", () => {
    expect(ids({ difficulties: ["Easy"] })).toEqual([1, 4]);
    expect(ids({ difficulties: ["Medium", "Hard"] })).toEqual([2, 3]);
  });
  it("combines with each other, favourites and the search box", () => {
    expect(ids({ maxMinutes: 30, difficulties: ["Medium"] })).toEqual([2]);
    expect(ids({ query: "toast", maxMinutes: 30 })).toEqual([1]);
    expect(ids({ query: "toast", difficulties: ["Easy"] })).toEqual([1]);
    expect(ids({ favoritesOnly: true, maxMinutes: 30 })).toEqual([]);
  });
});
