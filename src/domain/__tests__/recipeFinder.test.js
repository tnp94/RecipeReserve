import { ingredientMatches, findRecipes, rankByMostUsed } from "../recipeFinder";

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
    expect(findRecipes(recipes, [])).toEqual({ fullMatches: [], nearMatches: [], otherMatches: [] });
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

  it("ranks by missing count, then fraction owned, then name", () => {
    const rs = [
      r(1, "Zed", ["Egg", "X"]),            // 1 missing, 1/2
      r(2, "Mid", ["Egg", "Y", "Z"]),       // 2 missing, 1/3
      r(3, "Ace", ["Egg", "Milk", "Q"]),    // 1 missing, 2/3
      r(4, "Bob", ["Egg", "W"]),            // 1 missing, 1/2, same as Zed
    ];
    const res = findRecipes(rs, [have("egg"), have("milk")]);
    expect(res.nearMatches.map((x) => x.recipe.name)).toEqual(["Ace", "Bob", "Zed", "Mid"]);
  });

  it("puts fewer missing ahead of a higher fraction owned", () => {
    const rs = [
      r(1, "Long", ["Egg", "Milk", "Rice", "Peas", "X", "Y"]), // 2 missing, 4/6
      r(2, "Short", ["Egg", "Z"]),                             // 1 missing, 1/2
    ];
    const res = findRecipes(rs, [have("egg"), have("milk"), have("rice"), have("peas")]);
    expect(res.nearMatches.map((x) => x.recipe.name)).toEqual(["Short", "Long"]);
  });

  it("counts each entered ingredient once in usedCount", () => {
    const res = findRecipes([r(1, "Peppers", ["Black Pepper", "Red Pepper", "Salt"])], [have("pepper"), have("kale")]);
    expect(res.nearMatches[0]).toMatchObject({ matchedCount: 2, usedCount: 1 });
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

  it("puts recipes missing more than maxMissing into otherMatches", () => {
    const many = [
      r(10, "Stew", ["Beef", "Garlic", "A", "B", "C", "D", "E", "F", "G", "H"]),
      r(11, "Pork", ["Pork", "Garlic", "A", "B", "C", "D", "E", "F", "G", "H"]),
      r(12, "Salad", ["Lettuce"]),
    ];
    const res = findRecipes(many, [have("garlic")]);
    expect(res.fullMatches).toEqual([]);
    expect(res.nearMatches).toEqual([]);
    expect(res.otherMatches.map((x) => x.recipe.id)).toEqual([11, 10]);
    expect(res.otherMatches[0].missing).toHaveLength(9);
  });

  it("still enforces required tags for otherMatches", () => {
    const many = [r(10, "Stew", ["Beef", "Garlic", "A", "B", "C", "D"])];
    const res = findRecipes(many, [have("garlic"), have("rice", "required")]);
    expect(res.otherMatches).toEqual([]);
  });
});

describe("rankByMostUsed", () => {
  const haves = [have("egg"), have("milk"), have("rice")];
  const rank = (recipes, list = haves) => rankByMostUsed(findRecipes(recipes, list)).map((x) => x.recipe.name);

  it("ranks across groups, so a long recipe can beat a full match", () => {
    const names = rank([
      r(1, "Quick", ["Egg"]), // full match, uses 1
      r(2, "Pair", ["Egg", "Milk", "Salt"]), // near match, uses 2
      r(3, "Feast", ["Egg", "Milk", "Rice", "A", "B", "C", "D"]), // too many missing, uses 3
    ]);
    expect(names).toEqual(["Feast", "Pair", "Quick"]);
  });

  it("breaks ties by fewest missing, then name", () => {
    const names = rank([
      r(1, "Zed", ["Egg", "X"]),
      r(2, "Long", ["Egg", "X", "Y"]),
      r(3, "Ace", ["Egg", "Y"]),
    ]);
    expect(names).toEqual(["Ace", "Zed", "Long"]);
  });

  it("still puts recipes using expiring ingredients first", () => {
    const names = rank(
      [r(1, "Most", ["Egg", "Rice"]), r(2, "Spoils", ["Milk"])],
      [have("egg"), have("rice"), have("milk", "expiring")]
    );
    expect(names).toEqual(["Spoils", "Most"]);
  });

  it("marks recipes missing more than maxMissing", () => {
    const res = rankByMostUsed(findRecipes([r(1, "Feast", ["Egg", "A", "B", "C"]), r(2, "Pair", ["Egg", "A"])], [have("egg")]));
    expect(res.map((x) => x.tooManyMissing)).toEqual([false, true]);
  });

  it("is empty when nothing matches", () => {
    expect(rank([r(1, "Salad", ["Lettuce"])])).toEqual([]);
  });
});

describe("ingredientMatches singular/plural", () => {
  it.each([
    ["Onion", "Onions"], ["Onions", "Onion"], ["Onion", "Yellow Onions"], ["Peach", "Fresh Peaches"],
    ["Bay Leaf", "Bay Leaves"], ["Radish", "Radishes"], ["Chili", "Red Chilies"],
  ])("%s matches %s", (have, recipe) => {
    expect(ingredientMatches(have, recipe)).toBe(true);
  });
  it("never matches part of a word", () => {
    expect(ingredientMatches("Pea", "Peanut Butter")).toBe(false);
    expect(ingredientMatches("Corn", "Popcorn")).toBe(false);
  });
});
