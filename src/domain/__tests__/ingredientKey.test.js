import {
  singularizeWord, normalizeName, normalizeUnit, ingredientKey, wordsMatch,
} from "../ingredientKey";

describe("singularizeWord", () => {
  it.each([
    ["onions", "onion"], ["potatoes", "potato"], ["berries", "berry"], ["peas", "pea"],
    ["glass", "glass"], ["hummus", "hummus"], ["egg", "egg"], ["gas", "gas"],
    // -ches/-shes/-xes/-zes/-sses drop "es"
    ["peaches", "peach"], ["radishes", "radish"], ["boxes", "box"], ["glasses", "glass"],
    ["sandwiches", "sandwich"],
    // -ves and other irregulars
    ["leaves", "leaf"], ["loaves", "loaf"], ["halves", "half"], ["knives", "knife"],
    ["chilis", "chili"], ["chilies", "chili"], ["chillies", "chilli"],
    ["cookies", "cookie"], ["pies", "pie"],
    // already singular despite the trailing "s"
    ["asparagus", "asparagus"], ["couscous", "couscous"], ["molasses", "molasses"],
    // plain -s, including words ending in -is
    ["kiwis", "kiwi"], ["chives", "chive"], ["mangoes", "mango"], ["anchovies", "anchovy"],
  ])("%s -> %s", (input, expected) => {
    expect(singularizeWord(input)).toBe(expected);
  });
});

describe("normalizeName", () => {
  it("handles multiple words", () => expect(normalizeName("Small Red Potatoes")).toBe("small red potato"));
  it("replaces punctuation with spaces", () =>
    expect(normalizeName("Boneless Beef Chuck-eye Roast")).toBe("boneless beef chuck eye roast"));
  it("trims and singularizes", () => expect(normalizeName("  Onions ")).toBe("onion"));
});

describe("normalizeUnit", () => {
  it("Lbs -> lb", () => expect(normalizeUnit("Lbs")).toBe("lb"));
  it("Tablespoons -> tbsp", () => expect(normalizeUnit("Tablespoons")).toBe("tbsp"));
  it("Tbsp. -> tbsp", () => expect(normalizeUnit("Tbsp.")).toBe("tbsp"));
  it("Cups -> cup", () => expect(normalizeUnit("Cups")).toBe("cup"));
  it("Whole -> empty", () => expect(normalizeUnit("Whole")).toBe(""));
  it("empty -> empty", () => expect(normalizeUnit("")).toBe(""));
  it("Leaf -> leaf", () => expect(normalizeUnit("Leaf")).toBe("leaf"));
  it("Leaves -> leaf", () => expect(normalizeUnit("Leaves")).toBe("leaf"));
});

describe("ingredientKey", () => {
  it("treats Onions/'' and onion/each as equal", () => {
    expect(ingredientKey("Onions", "")).toBe(ingredientKey("onion", "each"));
  });
});

describe("wordsMatch", () => {
  it.each([
    ["onion", "onion", true], ["tomato", "tomatoes", true], ["cheese", "cheeses", true],
    ["pea", "peanut", false], ["pea", "", false], ["corn", "corns", true], ["box", "boxes", true],
  ])("%s vs %s -> %s", (a, b, expected) => {
    expect(wordsMatch(a, b)).toBe(expected);
  });
});

describe("plural/singular pairs produce the same key", () => {
  it.each([
    ["Onion", "Onions"], ["Peach", "Peaches"], ["Radish", "Radishes"], ["Bay Leaf", "Bay Leaves"],
    ["Chili", "Chilis"], ["Chili", "Chilies"], ["Tomato", "Tomatoes"], ["Kiwi", "Kiwis"],
  ])("%s == %s", (a, b) => {
    expect(normalizeName(a)).toBe(normalizeName(b));
  });
});
