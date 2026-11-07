import {
  extractUrl,
  hasRecipeContent,
  missingParts,
  parseDurationText,
  parseIsoDuration,
  parseRecipeHtml,
  parseRecipeText,
} from "../recipeImport";

const page = (json) => `<html><head><script type="application/ld+json">${typeof json === "string" ? json : JSON.stringify(json)}</script></head><body>x</body></html>`;
const names = (draft) => draft.ingredients.map((i) => i.name);

describe("parseDurationText", () => {
  it.each([
    ["1 hr 20 min", 80],
    ["1h20m", 80],
    ["90 minutes", 90],
    ["1 hour", 60],
    ["1 1/2 hours", 90],
    ["1/2 hour", 30],
    ["1.5 hours", 90],
    ["30-40 minutes", 40],
    ["soon", 0],
    [undefined, 0],
  ])("%s", (text, minutes) => expect(parseDurationText(text)).toBe(minutes));
});

describe("parseIsoDuration", () => {
  it.each([
    ["PT30M", 30],
    ["PT1H30M", 90],
    ["P0DT45M", 45],
    ["P1DT1H", 1500],
    ["PT90S", 2],
    ["20 minutes", 20],
    [15, 15],
    [undefined, 0],
  ])("%s", (value, minutes) => expect(parseIsoDuration(value)).toBe(minutes));
});

describe("parseRecipeText", () => {
  it("reads a recipe with headings", () => {
    const draft = parseRecipeText(`Weeknight Chili
A family favorite that freezes well.
Prep time: 15 min
Cook time: 1 hr
Serves 6
Calories: 350 kcal

Ingredients
2 cups beans
1 onion, chopped
Salt, to taste

Directions
1. Chop the onion.
2. Simmer everything.
`);
    expect(draft.name).toBe("Weeknight Chili");
    expect(draft.time).toEqual({ prep: 15, active: 60 });
    expect(draft.yield).toBe(6);
    expect(draft.calories).toBe(350);
    expect(names(draft)).toEqual(["beans", "onion", "Salt"]);
    expect(draft.directions).toEqual(["Chop the onion.", "Simmer everything."]);
  });

  it("reads several details on one line", () => {
    const draft = parseRecipeText("Soup\nPrep: 10 min | Cook: 20 min | Serves 4\nIngredients\n1 leek");
    expect(draft.time).toEqual({ prep: 10, active: 20 });
    expect(draft.yield).toBe(4);
  });

  it("counts a total time as cook time, less prep", () => {
    expect(parseRecipeText("Soup\nPrep time: 10 min\nTotal time: 40 min").time).toEqual({ prep: 10, active: 30 });
    expect(parseRecipeText("Soup\nTotal time: 40 min").time).toEqual({ prep: 0, active: 40 });
  });

  it("sorts lines by shape when there are no headings", () => {
    const draft = parseRecipeText("Pancakes\n2 cups flour\n1 egg\nOlive oil\nMix everything together.\nFry until golden.");
    expect(draft.name).toBe("Pancakes");
    expect(names(draft)).toEqual(["flour", "egg", "Olive oil"]);
    expect(draft.directions).toEqual(["Mix everything together.", "Fry until golden."]);
  });

  it("starts the method at the first sentence when only ingredients have a heading", () => {
    const draft = parseRecipeText("Toast\nIngredients:\n1 slice bread\nButter\nToast the bread.\nButter it.");
    expect(names(draft)).toEqual(["bread", "Butter"]);
    expect(draft.directions).toEqual(["Toast the bread.", "Butter it."]);
  });

  it("does not make a title out of an ingredient or a sentence", () => {
    expect(parseRecipeText("2 cups flour\n1 egg").name).toBe("");
    expect(parseRecipeText("Mix it all together.").name).toBe("");
  });

  it("leaves a description out when headings mark where the recipe starts", () => {
    const draft = parseRecipeText("Soup\nWarming and simple\nIngredients\n1 leek\nMethod\nCook it.");
    expect(names(draft)).toEqual(["leek"]);
    expect(draft.directions).toEqual(["Cook it."]);
  });

  it("skips sections that are not part of the recipe", () => {
    const draft = parseRecipeText("Soup\nIngredients\n1 leek\nMethod\nCook it.\nNotes\nKeeps for 3 days in the fridge.");
    expect(draft.directions).toEqual(["Cook it."]);
  });

  it("joins numbered steps that wrap across lines", () => {
    const draft = parseRecipeText("Directions\n1. Heat the oil in a\nlarge pan.\n2. Add the onion\nand stir.");
    expect(draft.directions).toEqual(["Heat the oil in a large pan.", "Add the onion and stir."]);
  });

  it("handles step numbers on their own line", () => {
    const draft = parseRecipeText("Directions\nStep 1\nHeat the oil\nStep 2\nAdd the onion");
    expect(draft.directions).toEqual(["Heat the oil", "Add the onion"]);
  });

  it("joins an unnumbered line that starts in lower case onto an unfinished step", () => {
    const draft = parseRecipeText("Directions\nHeat the oil in a\nlarge pan.\nAdd the onion.");
    expect(draft.directions).toEqual(["Heat the oil in a large pan.", "Add the onion."]);
  });

  it("does not read a cooking step as a time or a yield", () => {
    const draft = parseRecipeText("Directions\nCook 20 minutes.\nMakes 12.");
    expect(draft.time).toEqual({ prep: 0, active: 0 });
    expect(draft.yield).toBe(0);
    expect(draft.directions).toEqual(["Cook 20 minutes.", "Makes 12."]);
  });

  it("reads text shaped like a scanned page", () => {
    const draft = parseRecipeText(`142
LEMON ROAST CHICKEN
PREP TIME: 15 MINUTES
COOK TIME: 1 HOUR 10 MINUTES
SERVES 4
INGREDIENTS
1 whole chicken
2 lemons, halved
3 Tbsp. butter, softened
143
METHOD
Heat the oven to 400°F. Rub the
chicken with butter and season
well.
Roast until the juices run clear.`);
    expect(draft.name).toBe("LEMON ROAST CHICKEN");
    expect(draft.time).toEqual({ prep: 15, active: 70 });
    expect(draft.yield).toBe(4);
    expect(names(draft)).toEqual(["chicken", "lemons", "butter"]);
    expect(draft.directions).toEqual([
      "Heat the oven to 400°F. Rub the chicken with butter and season well.",
      "Roast until the juices run clear.",
    ]);
  });

  it("returns an empty draft for nothing", () => {
    expect(hasRecipeContent(parseRecipeText(""))).toBe(false);
    expect(hasRecipeContent(parseRecipeText(null))).toBe(false);
  });
});

describe("parseRecipeHtml", () => {
  const recipe = {
    "@type": "Recipe",
    name: "Mac &amp; Cheese",
    prepTime: "PT10M",
    cookTime: "PT25M",
    recipeYield: ["4", "4 servings"],
    nutrition: { "@type": "NutritionInformation", calories: "1,200 kcal" },
    recipeIngredient: ["2 cups macaroni", "1 &frac12; cups cheddar, grated"],
    recipeInstructions: [
      { "@type": "HowToStep", text: "Boil the pasta." },
      { "@type": "HowToStep", text: "<p>Stir in the cheese.</p>" },
    ],
  };

  it("maps a recipe's fields", () => {
    const draft = parseRecipeHtml(page(recipe));
    expect(draft.name).toBe("Mac & Cheese");
    expect(draft.time).toEqual({ prep: 10, active: 25 });
    expect(draft.yield).toBe(4);
    expect(draft.calories).toBe(1200);
    expect(draft.ingredients[0]).toEqual({ quantityUnit: "2", unit: "cups", name: "macaroni", note: "" });
    expect(draft.ingredients[1]).toEqual({ quantityUnit: "1 ½", unit: "cups", name: "cheddar", note: "grated" });
    expect(draft.directions).toEqual(["Boil the pasta.", "Stir in the cheese."]);
  });

  it.each([
    ["in an array", [{ "@type": "WebSite" }, recipe]],
    ["in @graph", { "@context": "https://schema.org", "@graph": [{ "@type": "Article" }, recipe] }],
    ["under mainEntity", { "@type": "WebPage", mainEntity: recipe }],
    ["with a list of types", { ...recipe, "@type": ["Recipe", "NewsArticle"] }],
    ["with a prefixed type", { ...recipe, "@type": "schema:Recipe" }],
  ])("finds a recipe %s", (_label, json) => {
    expect(parseRecipeHtml(page(json)).name).toBe("Mac & Cheese");
  });

  it("flattens sections of steps", () => {
    const draft = parseRecipeHtml(
      page({
        ...recipe,
        recipeInstructions: [
          { "@type": "HowToSection", name: "Sauce", itemListElement: [{ "@type": "HowToStep", text: "Melt butter." }] },
          { "@type": "HowToSection", name: "Finish", itemListElement: [{ "@type": "HowToStep", name: "Bake it." }] },
        ],
      })
    );
    expect(draft.directions).toEqual(["Melt butter.", "Bake it."]);
  });

  it("splits instructions given as one string", () => {
    const draft = parseRecipeHtml(page({ ...recipe, recipeInstructions: "<ol><li>1. Boil.</li><li>2. Stir.</li></ol>" }));
    expect(draft.directions).toEqual(["Boil.", "Stir."]);
  });

  it("uses total time when there is no cook time", () => {
    const { cookTime, ...rest } = recipe;
    expect(parseRecipeHtml(page({ ...rest, totalTime: "PT1H" })).time).toEqual({ prep: 10, active: 50 });
  });

  it("reads JSON with raw line breaks inside strings", () => {
    const raw = `{"@type":"Recipe","name":"Soup","recipeIngredient":["1 leek
      trimmed"],"recipeInstructions":"Cook it."}`;
    expect(names(parseRecipeHtml(page(raw)))).toEqual(["leek trimmed"]);
  });

  it("skips a broken block and uses the next", () => {
    expect(parseRecipeHtml(page("{ nope") + page(recipe)).name).toBe("Mac & Cheese");
  });

  it("prefers a recipe with ingredients over a bare reference", () => {
    const json = [{ "@type": "Recipe", name: "Stub" }, recipe];
    expect(parseRecipeHtml(page(json)).name).toBe("Mac & Cheese");
  });

  it("returns null when the page has no usable recipe", () => {
    expect(parseRecipeHtml("<html><body>No data</body></html>")).toBeNull();
    expect(parseRecipeHtml(page({ "@type": "Article", name: "News" }))).toBeNull();
    expect(parseRecipeHtml(page({ "@type": "Recipe", name: "Stub" }))).toBeNull();
    expect(parseRecipeHtml(undefined)).toBeNull();
  });
});

describe("missingParts", () => {
  it("lists what was not found", () => {
    expect(missingParts({ name: "", ingredients: [], directions: ["x"] })).toEqual(["name", "ingredients"]);
    expect(missingParts({ name: "A", ingredients: [{}], directions: ["x"] })).toEqual([]);
  });
});

describe("extractUrl", () => {
  it.each([
    ["https://example.com/soup", "https://example.com/soup"],
    ["  http://example.com/a?b=1  ", "https://example.com/a?b=1"],
    ["HTTP://Example.com/soup", "https://Example.com/soup"],
    ["Try this: https://example.com/soup!", "https://example.com/soup"],
    ["(https://example.com/soup).", "https://example.com/soup"],
    ["example.com/soup", "https://example.com/soup"],
    ["www.example.co.uk", "https://www.example.co.uk"],
    ["not a link", null],
    ["soup", null],
    ["", null],
    [undefined, null],
  ])("%s", (text, url) => expect(extractUrl(text)).toBe(url));
});
