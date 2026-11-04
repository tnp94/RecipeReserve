import {
  singularizeWord, normalizeName, normalizeUnit, ingredientKey,
} from "../ingredientKey";

describe("singularizeWord", () => {
  it.each([
    ["onions", "onion"], ["potatoes", "potato"], ["berries", "berry"], ["peas", "pea"],
    ["glass", "glass"], ["hummus", "hummus"], ["egg", "egg"], ["gas", "gas"],
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
  it("Leaves -> leave (documented heuristic)", () => expect(normalizeUnit("Leaves")).toBe("leave"));
});

describe("ingredientKey", () => {
  it("treats Onions/'' and onion/each as equal", () => {
    expect(ingredientKey("Onions", "")).toBe(ingredientKey("onion", "each"));
  });
});
