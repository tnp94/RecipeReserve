import reducer, { addRecipe, isRecipeNameTaken, initialState } from "../recipesSlice";

const names = (state) => state.ids.map((id) => state.entities[id].name);

describe("addRecipe name de-duplication", () => {
  it("adds ' copy N' for an exact duplicate", () => {
    const s = reducer(initialState, addRecipe({ name: "Best Beef Stew", ingredients: [] }));
    expect(names(s)).toContain("Best Beef Stew copy 1");
  });

  it("treats names that differ only by case or spaces as duplicates", () => {
    const s = reducer(initialState, addRecipe({ name: "  best beef stew ", ingredients: [] }));
    expect(names(s)).toContain("best beef stew copy 1");
  });

  it("a recipe added this way is never blocked by isRecipeNameTaken", () => {
    const s = reducer(initialState, addRecipe({ name: "BEST BEEF STEW", ingredients: [] }));
    const id = s.ids[s.ids.length - 1];
    expect(isRecipeNameTaken({ recipes: s }, s.entities[id].name, id)).toBe(false);
  });

  it("keeps a unique name unchanged (trimmed)", () => {
    const s = reducer(initialState, addRecipe({ name: " Tacos ", ingredients: [] }));
    expect(names(s)).toContain("Tacos");
  });
});
