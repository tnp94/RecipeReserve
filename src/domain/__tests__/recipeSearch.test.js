import {
  NO_FILTERS,
  activeFilterCount,
  difficultyLevel,
  effectiveTotalLimit,
  filterRecipes,
  filterSummary,
  splitRecipes,
  unknownLabel,
} from "../recipeSearch";

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
  it("limits prep and cook time separately", () => {
    expect(ids({ maxPrep: 10 })).toEqual([1, 2]);
    expect(ids({ maxActive: 20 })).toEqual([1, 2]);
    expect(ids({ maxActive: 3 })).toEqual([1]);
    expect(ids({ maxPrep: 20, maxActive: 20 })).toEqual([1, 2]);
    expect(ids({ maxMinutes: 20, maxPrep: 20 })).toEqual([1]);
  });
  it("counts a blank prep or cook time as 0, but leaves out recipes with no time at all", () => {
    const noPrep = [{ id: 6, time: { prep: "", active: 25 } }, { id: 7, time: {} }];
    expect(filterRecipes(noPrep, { maxPrep: 0 }).map((r) => r.id)).toEqual([6]);
    expect(filterRecipes(noPrep, { maxActive: 30 }).map((r) => r.id)).toEqual([6]);
  });
  it("treats null, blank and non-numeric limits as off", () => {
    expect(ids({ maxMinutes: "", maxPrep: null, maxActive: "abc" })).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("splitRecipes", () => {
  const list = [
    { id: 1, name: "Toast", difficulty: "Easy", time: { prep: 2, active: 3 } },
    { id: 2, name: "Roast", difficulty: "Hard", time: { prep: 20, active: 70 } },
    { id: 3, name: "Untimed easy", difficulty: "Easy", favorite: true },
    { id: 4, name: "Untimed hard", difficulty: "Hard" },
    { id: 5, name: "Timed, no level", time: { prep: 5, active: 5 } },
    { id: 6, name: "Nothing set" },
  ];
  const split = (opts) => {
    const { matches, unknown } = splitRecipes(list, opts);
    return { matches: matches.map((r) => r.id), unknown: unknown.map((r) => r.id) };
  };

  it("has no unknowns when no time or difficulty filter is on", () => {
    expect(split({})).toEqual({ matches: [1, 2, 3, 4, 5, 6], unknown: [] });
    expect(split({ query: "untimed" })).toEqual({ matches: [3, 4], unknown: [] });
  });
  it("puts recipes with no time under unknown while a time limit is on", () => {
    expect(split({ maxMinutes: 30 })).toEqual({ matches: [1, 5], unknown: [3, 4, 6] });
    expect(split({ maxActive: 10 })).toEqual({ matches: [1, 5], unknown: [3, 4, 6] });
  });
  it("puts recipes with no recognised difficulty under unknown while a difficulty is picked", () => {
    expect(split({ difficulties: ["Easy"] })).toEqual({ matches: [1, 3], unknown: [5, 6] });
  });
  it("leaves out a recipe whose known value fails, even if the other is unknown", () => {
    // 4 has no time but is Hard; 5 has no level but is quick.
    expect(split({ maxMinutes: 30, difficulties: ["Easy"] })).toEqual({ matches: [1], unknown: [3, 5, 6] });
  });
  it("applies favourites and the search box to unknowns too", () => {
    expect(split({ maxMinutes: 30, favoritesOnly: true })).toEqual({ matches: [], unknown: [3] });
    expect(split({ maxMinutes: 30, query: "hard" })).toEqual({ matches: [], unknown: [4] });
  });
  it("filterRecipes returns only the matches", () => {
    expect(filterRecipes(list, { maxMinutes: 30 }).map((r) => r.id)).toEqual([1, 5]);
  });
});

describe("effectiveTotalLimit", () => {
  it("is off with no total, and the typed total with no prep or cook limit", () => {
    expect(effectiveTotalLimit({ maxPrep: 40 })).toEqual({ limit: null, overridden: false, typed: null });
    expect(effectiveTotalLimit({ maxMinutes: 30 })).toEqual({ limit: 30, overridden: false, typed: 30 });
  });
  it("keeps the typed total while prep + cook fits inside it", () => {
    expect(effectiveTotalLimit({ maxMinutes: 30, maxPrep: 10, maxActive: 20 })).toEqual({ limit: 30, overridden: false, typed: 30 });
  });
  it("uses prep + cook when it's larger, counting a blank one as 0", () => {
    expect(effectiveTotalLimit({ maxMinutes: 30, maxPrep: 30, maxActive: 30 })).toEqual({ limit: 60, overridden: true, typed: 30 });
    expect(effectiveTotalLimit({ maxMinutes: 30, maxPrep: 45 })).toEqual({ limit: 45, overridden: true, typed: 30 });
  });
  it("is what the list filters by", () => {
    const basic = [{ id: 1, time: { prep: 20, active: 40 } }];
    expect(filterRecipes(basic, { maxMinutes: 30, maxPrep: 30, maxActive: 30 })).toEqual([]); // cook 40 > 30
    expect(filterRecipes(basic, { maxMinutes: 30, maxPrep: 30, maxActive: 40 }).map((r) => r.id)).toEqual([1]); // limit 70
    expect(filterRecipes(basic, { maxMinutes: 30, maxPrep: 20, maxActive: 40 }).map((r) => r.id)).toEqual([1]); // limit 60
    expect(filterRecipes(basic, { maxMinutes: 30, maxActive: 40 })).toEqual([]); // limit 40 < total 60
  });
  it("is shown in the summary", () => {
    expect(filterSummary({ maxMinutes: 30, maxPrep: 30, maxActive: 30 })).toEqual([
      "Up to 1 hr (prep + cook)",
      "Prep up to 30 min",
      "Cook up to 30 min",
    ]);
  });
});

describe("unknownLabel", () => {
  it("names what's missing from which filters are on", () => {
    expect(unknownLabel({})).toBe("");
    expect(unknownLabel({ maxPrep: 10 })).toBe("No time set");
    expect(unknownLabel({ difficulties: ["Easy"] })).toBe("No difficulty set");
    expect(unknownLabel({ maxMinutes: 0, difficulties: ["Hard"] })).toBe("No time or difficulty set");
  });
});

describe("activeFilterCount and filterSummary", () => {
  it("are empty with no filters (Favorites isn't part of the dropdown)", () => {
    expect(activeFilterCount(NO_FILTERS)).toBe(0);
    expect(activeFilterCount({ favoritesOnly: true })).toBe(0);
    expect(filterSummary({})).toEqual([]);
  });
  it("count each time limit and the difficulty set once", () => {
    expect(activeFilterCount({ maxMinutes: 30, maxActive: 0, difficulties: ["Easy", "Hard"] })).toBe(3);
  });
  it("describe the filters in a fixed order", () => {
    expect(
      filterSummary({ maxMinutes: 90, maxPrep: 0, maxActive: 20, difficulties: ["Hard", "Easy"] })
    ).toEqual(["Up to 1 hr 30 min", "Prep up to 0 min", "Cook up to 20 min", "Easy or Hard"]);
  });
});
