import { parseIngredientLine, parseIngredientList, parseDirections } from "../ingredientParse";

const row = (quantityUnit, unit, name, note = "") => ({ quantityUnit, unit, name, note });

describe("parseIngredientLine", () => {
  it.each([
    ["2 cups flour", row("2", "cups", "flour")],
    ["2 cups of flour", row("2", "cups", "flour")],
    ["1 onion, chopped", row("1", "", "onion", "chopped")],
    ["2 cloves garlic, minced", row("2", "cloves", "garlic", "minced")],
    ["1 1/2 cups milk", row("1 1/2", "cups", "milk")],
    ["1-1/2 lbs potatoes", row("1-1/2", "lbs", "potatoes")],
    ["1½ tsp salt", row("1½", "tsp", "salt")],
    ["½ cup sugar", row("½", "cup", "sugar")],
    ["1/4 cup flour", row("1/4", "cup", "flour")],
    ["1.5 lb beef", row("1.5", "lb", "beef")],
    ["1-2 pork tenderloins", row("1-2", "", "pork tenderloins")],
    ["2 to 3 carrots", row("2 to 3", "", "carrots")],
    ["1 (14.5 oz) can diced tomatoes", row("1", "can", "diced tomatoes", "14.5 oz")],
    ["3 Tbsp. butter", row("3", "Tbsp", "butter")],
    ["2 T butter", row("2", "T", "butter")],
    ["1 t vanilla", row("1", "t", "vanilla")],
    ["8 fl oz cream", row("8", "fl oz", "cream")],
    ["a pinch of salt", row("1", "pinch", "salt")],
    ["an onion", row("1", "", "onion")],
    ["Salt and pepper to taste", row("", "", "Salt and pepper", "to taste")],
    ["Salt, to taste", row("", "", "Salt", "to taste")],
    ["Fresh parsley (optional)", row("", "", "Fresh parsley", "optional")],
    ["- 2 eggs", row("2", "", "eggs")],
    ["• 1 lemon", row("1", "", "lemon")],
    ["1. 2 cups rice", row("2", "cups", "rice")],
    ["2 large eggs, beaten", row("2", "", "large eggs", "beaten")],
    ["Garlic", row("", "", "Garlic")],
    ["  4   Tbsp   unsalted butter , softened ", row("4", "Tbsp", "unsalted butter", "softened")],
  ])("%s", (line, expected) => {
    expect(parseIngredientLine(line)).toEqual(expected);
  });

  it("treats a trailing unit word with nothing after it as the name", () => {
    expect(parseIngredientLine("2 cups")).toEqual(row("2", "", "cups"));
  });

  it("keeps a line that is only an amount as the name", () => {
    expect(parseIngredientLine("1 1/2")).toEqual(row("", "", "1 1/2"));
  });

  it("returns blanks for empty input", () => {
    expect(parseIngredientLine("   ")).toEqual(row("", "", ""));
    expect(parseIngredientLine(undefined)).toEqual(row("", "", ""));
  });

  it("does not treat a lone c or l as a unit without an amount", () => {
    expect(parseIngredientLine("c flour").name).toBe("c flour");
  });
});

describe("parseIngredientList", () => {
  it("splits lines and skips blanks and headings", () => {
    const text = "Ingredients:\n\n2 cups flour\nFor the sauce:\n1 tbsp soy sauce\r\n  \n";
    expect(parseIngredientList(text)).toEqual([row("2", "cups", "flour"), row("1", "tbsp", "soy sauce")]);
  });

  it("returns [] for nothing", () => {
    expect(parseIngredientList("")).toEqual([]);
    expect(parseIngredientList(null)).toEqual([]);
  });
});

describe("parseDirections", () => {
  it("strips numbering and bullets, one step per line", () => {
    const text = "Directions\n1. Preheat oven.\n2) Mix it.\nStep 3: Bake.\n- Serve\n\n";
    expect(parseDirections(text)).toEqual(["Preheat oven.", "Mix it.", "Bake.", "Serve"]);
  });

  it("keeps lines without numbering as they are", () => {
    expect(parseDirections("Heat the pan. Add oil.\nCook 5 minutes.")).toEqual(["Heat the pan. Add oil.", "Cook 5 minutes."]);
  });
});

describe("parseIngredientList with wrapped lines", () => {
  const names = (text) => parseIngredientList(text).map((r) => [r.quantityUnit, r.unit, r.name, r.note]);

  it("joins a line that continues after a comma", () => {
    expect(names("1 (15 oz) can black beans,\ndrained and rinsed\n2 cups rice")).toEqual([
      ["1", "can", "black beans", "15 oz; drained and rinsed"],
      ["2", "cups", "rice", ""],
    ]);
  });

  it("joins after an open bracket or a connecting word", () => {
    expect(names("2 lb chicken thighs (bone-in and\nskin-on)\n1 cup chopped fresh basil or\nparsley")).toEqual([
      ["2", "lb", "chicken thighs", "bone-in and skin-on"],
      ["1", "cup", "chopped fresh basil or parsley", ""],
    ]);
  });

  it("joins an amount on its own line to the name below", () => {
    expect(names("1/2 cup\nsugar\n2 eggs")).toEqual([
      ["1/2", "cup", "sugar", ""],
      ["2", "", "eggs", ""],
    ]);
  });

  it("joins a lower-case line after one that ran the full column width", () => {
    expect(names("1 (14.5 oz) can diced tomatoes with\ngreen chilies\n1 cup shredded cheddar cheese\nsalt")).toEqual([
      ["1", "can", "diced tomatoes with green chilies", "14.5 oz"],
      ["1", "cup", "shredded cheddar cheese", ""],
      ["", "", "salt", ""],
    ]);
    expect(names("1 large yellow onion, finely\ndiced\n3 cups vegetable broth")).toEqual([
      ["1", "", "large yellow onion", "finely diced"],
      ["3", "cups", "vegetable broth", ""],
    ]);
  });

  it("joins unbulleted lines in a bulleted list", () => {
    expect(names("• 2 cups flour\n• 1 tsp baking soda\n• 1 cup buttermilk, at room\nTemperature\n• Salt")).toEqual([
      ["2", "cups", "flour", ""],
      ["1", "tsp", "baking soda", ""],
      ["1", "cup", "buttermilk", "at room Temperature"],
      ["", "", "Salt", ""],
    ]);
  });

  it("keeps short ingredients without amounts on their own lines", () => {
    expect(names("2 cups flour\nSalt and pepper\nFresh parsley")).toEqual([
      ["2", "cups", "flour", ""],
      ["", "", "Salt and pepper", ""],
      ["", "", "Fresh parsley", ""],
    ]);
  });
});
