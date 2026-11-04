import { ingredientMatches, findRecipes } from "../recipeFinder";

const r = (id, name, names) => ({
  id, name, ingredients: names.map((n) => ({ name: n })),
});
const have = (name, tag = null) => ({ name, tag });

describe("ingredientMatches", () => {
  it("matches singular against plural multi-word names", () => {
    expect(ingredientMatches("potato", "Small Red Potatoes")).toBe(true);
  });
  it("requires every have-word", () => {
    expect(ingredientMatches("red onion", "Onion")).toBe(false);
    expect(ingredientMatches("red onion", "Red Onions")).toBe(true);
  });
  it("is false for empty have name", () => {
    expect(ingredientMatches("", "Onion")).toBe(false);
    expect(ingredientMatches("!!", "Onion")).toBe(false);
  });
});

describe("findRecipes", () => {
  const recipes = [
    r(1, "Omelette", ["Egg", "Cheese"]),
    r(2, "Fried Rice", ["Rice", "Egg", "Soy Sauce", "Peas"]),
    r(3, "Big Feast", ["Egg", "A", "B", "C"]),
    r(4, "Salad", ["Lettuce"]),
  ];

  it("returns empty groups for no ingredients", () => {
    expect(findRecipes(recipes, [])).toEqual({ fullMatches: [], nearMatches: [] });
  });

  it("splits full and near matches and excludes unmatched / too many missing", () => {
    const res = findRecipes(recipes, [have("egg"), have("cheese"), have("rice")]);
    expect(res.fullMatches.map((x) => x.recipe.id)).toEqual([1]);
    expect(res.nearMatches.map((x) => x.recipe.id)).toEqual([2]);
    expect(res.nearMatches[0].missing.map((m) => m.name)).toEqual(["Soy Sauce", "Peas"]);
    expect(res.nearMatches[0]).toMatchObject({ matchedCount: 2, totalCount: 4, isFullMatch: false });
  });

  it("respects maxMissing", () => {
    const res = findRecipes(recipes, [have("egg")], { maxMissing: 1 });
    expect(res.fullMatches).toEqual([]);
    expect(res.nearMatches.map((x) => x.recipe.id)).toEqual([1]);
    const res3 = findRecipes(recipes, [have("egg")], { maxMissing: 3 });
    expect(res3.nearMatches.map((x) => x.recipe.id)).toEqual([1, 3, 2]);
  });

  it("required tag excludes recipes lacking the ingredient", () => {
    const res = findRecipes(recipes, [have("egg"), have("rice", "required"), have("cheese")]);
    expect(res.fullMatches).toEqual([]);
    expect(res.nearMatches.map((x) => x.recipe.id)).toEqual([2]);
  });

  it("ranks by expiring count first", () => {
    const near = findRecipes(recipes, [have("peas", "expiring"), have("egg")], { maxMissing: 3 });
    expect(near.nearMatches.map((x) => x.recipe.id)).toEqual([2, 1, 3]);
    expect(near.nearMatches[0].expiringCount).toBe(1);
    const full = findRecipes(
      [r(10, "Alpha", ["Egg"]), r(11, "Beta", ["Milk"])],
      [have("egg"), have("milk", "expiring")]
    );
    expect(full.fullMatches.map((x) => x.recipe.name)).toEqual(["Beta", "Alpha"]);
    expect(full.fullMatches[0].expiringCount).toBe(1);
  });

  it("ranks by fraction owned, then missing count, then name", () => {
    const rs = [
      r(1, "Zed", ["Egg", "X"]),            // 1/2
      r(2, "Mid", ["Egg", "Y", "Z"]),       // 1/3
      r(3, "Ace", ["Egg", "Milk", "Q"]),    // 2/3
      r(4, "Bob", ["Egg", "W"]),            // 1/2, same as Zed
    ];
    const res = findRecipes(rs, [have("egg"), have("milk")]);
    expect(res.nearMatches.map((x) => x.recipe.name)).toEqual(["Ace", "Bob", "Zed", "Mid"]);
  });

  it("de-duplicates recipe ingredients by normalized name", () => {
    const res = findRecipes([r(1, "Dup", ["Onion", "Onions", " "])], [have("onion")]);
    expect(res.fullMatches[0]).toMatchObject({ matchedCount: 1, totalCount: 1 });
  });

  it("skips recipes with no ingredients", () => {
    const res = findRecipes([r(1, "Empty", [])], [have("egg")]);
    expect(res.fullMatches).toEqual([]);
    expect(res.nearMatches).toEqual([]);
  });
});
