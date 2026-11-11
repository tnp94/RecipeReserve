import {
  RECIPE_SORT_EASIEST,
  RECIPE_SORT_FEWEST_INGREDIENTS,
  RECIPE_SORT_MOST_PLANNED,
  RECIPE_SORT_NAME,
  RECIPE_SORT_NEWEST,
  RECIPE_SORT_QUICKEST,
  RECIPE_SORT_RECENT,
  isRecipeSort,
  planCardText,
  planDateText,
  planSummary,
  recipeSortOption,
  sortRecipes,
  timesPlanned,
} from "../recipeSort";

const r = (id, name, extra = {}) => ({ id, name, ingredients: [], time: { prep: 0, active: 0 }, difficulty: "", ...extra });
const names = (list) => list.map((x) => x.name);

describe("sortRecipes", () => {
  it("sorts by name, ignoring case, without changing the input", () => {
    const input = [r(1, "banana bread"), r(2, "Apple pie"), r(3, "Carrot cake")];
    expect(names(sortRecipes(input, RECIPE_SORT_NAME))).toEqual(["Apple pie", "banana bread", "Carrot cake"]);
    expect(names(input)).toEqual(["banana bread", "Apple pie", "Carrot cake"]);
  });

  it("falls back to name for an unknown sort", () => {
    expect(names(sortRecipes([r(1, "B"), r(2, "A")], "bogus"))).toEqual(["A", "B"]);
  });

  it("quickest: total minutes ascending, no time last, ties by name", () => {
    const list = [
      r(1, "Slow", { time: { prep: 30, active: 60 } }),
      r(2, "No time"),
      r(3, "Fast B", { time: { prep: 5, active: 10 } }),
      r(4, "Fast A", { time: { prep: 15, active: 0 } }),
    ];
    expect(names(sortRecipes(list, RECIPE_SORT_QUICKEST))).toEqual(["Fast A", "Fast B", "Slow", "No time"]);
  });

  it("easiest: Easy, Medium, Hard, then unrecognised; free text maps to a level", () => {
    const list = [
      r(1, "H", { difficulty: "Hard" }),
      r(2, "U", { difficulty: "who knows" }),
      r(3, "M", { difficulty: "Intermediate" }),
      r(4, "E", { difficulty: "simple" }),
    ];
    expect(names(sortRecipes(list, RECIPE_SORT_EASIEST))).toEqual(["E", "M", "H", "U"]);
  });

  it("recent: latest lastPlannedAt first, never planned last", () => {
    const list = [r(1, "Old", { lastPlannedAt: 100 }), r(2, "Never"), r(3, "New", { lastPlannedAt: 500 })];
    expect(names(sortRecipes(list, RECIPE_SORT_RECENT))).toEqual(["New", "Old", "Never"]);
  });

  it("most planned: highest timesPlanned first, never planned last", () => {
    const list = [r(1, "Once", { timesPlanned: 1 }), r(2, "Never", { timesPlanned: 0 }), r(3, "Often", { timesPlanned: 7 })];
    expect(names(sortRecipes(list, RECIPE_SORT_MOST_PLANNED))).toEqual(["Often", "Once", "Never"]);
  });

  it("newest: highest id first", () => {
    expect(names(sortRecipes([r(2, "Two"), r(10, "Ten"), r(1, "One")], RECIPE_SORT_NEWEST))).toEqual(["Ten", "Two", "One"]);
  });

  it("fewest ingredients: counts named ingredients, none last", () => {
    const ing = (...ns) => ns.map((name) => ({ name }));
    const list = [
      r(1, "Three", { ingredients: ing("a", "b", "c") }),
      r(2, "Empty"),
      r(3, "One", { ingredients: ing("a", " ") }),
    ];
    expect(names(sortRecipes(list, RECIPE_SORT_FEWEST_INGREDIENTS))).toEqual(["One", "Three", "Empty"]);
  });
});

describe("sort options", () => {
  it("recognises known sorts and defaults unknown ones to Name", () => {
    expect(isRecipeSort(RECIPE_SORT_RECENT)).toBe(true);
    expect(isRecipeSort("nope")).toBe(false);
    expect(recipeSortOption("nope").value).toBe(RECIPE_SORT_NAME);
  });
});

describe("planning history text", () => {
  // Local-time dates, so day boundaries match the device's.
  const now = new Date(2026, 10, 10, 15, 0).getTime();
  const at = (y, m, d, h = 12) => new Date(y, m, d, h).getTime();

  it("timesPlanned is 0 for missing or bad values", () => {
    expect(timesPlanned({})).toBe(0);
    expect(timesPlanned({ timesPlanned: -2 })).toBe(0);
    expect(timesPlanned({ timesPlanned: "x" })).toBe(0);
    expect(timesPlanned({ timesPlanned: 4 })).toBe(4);
  });

  it("planDateText goes by calendar day", () => {
    expect(planDateText(at(2026, 10, 10, 1), now)).toBe("today");
    expect(planDateText(at(2026, 10, 9, 23), now)).toBe("yesterday");
    expect(planDateText(at(2026, 10, 7), now)).toBe("3 days ago");
    expect(planDateText(at(2026, 10, 2), now)).toMatch(/Nov/);
    expect(planDateText(at(2026, 10, 2), now)).not.toMatch(/2026/);
    expect(planDateText(at(2025, 10, 2), now)).toMatch(/2025/);
    expect(planDateText(undefined, now)).toBe("");
  });

  it("planSummary", () => {
    expect(planSummary({}, now)).toBe("Not planned yet");
    expect(planSummary({ timesPlanned: 1, lastPlannedAt: now }, now)).toBe("Planned once · last today");
    expect(planSummary({ timesPlanned: 3, lastPlannedAt: at(2026, 10, 9) }, now)).toBe("Planned 3 times · last yesterday");
    expect(planSummary({ timesPlanned: 2 }, now)).toBe("Planned 2 times");
  });

  it("planCardText only for the planning sorts", () => {
    const recipe = { timesPlanned: 3, lastPlannedAt: at(2026, 10, 8) };
    expect(planCardText(recipe, RECIPE_SORT_NAME, now)).toBeNull();
    expect(planCardText(recipe, RECIPE_SORT_MOST_PLANNED, now)).toBe("Planned 3 times");
    expect(planCardText({ timesPlanned: 1 }, RECIPE_SORT_MOST_PLANNED, now)).toBe("Planned once");
    expect(planCardText(recipe, RECIPE_SORT_RECENT, now)).toBe("Planned 2 days ago");
    expect(planCardText({}, RECIPE_SORT_MOST_PLANNED, now)).toBeNull();
    expect(planCardText({}, RECIPE_SORT_RECENT, now)).toBeNull();
  });
});
