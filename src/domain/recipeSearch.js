export function filterRecipes(recipes, { query = "", favoritesOnly = false } = {}) {
  const q = String(query ?? "").trim().toLowerCase();
  return recipes.filter((recipe) => {
    if (favoritesOnly && recipe.favorite !== true) return false;
    if (q === "") return true;
    if (String(recipe.name ?? "").toLowerCase().includes(q)) return true;
    return (recipe.ingredients ?? []).some((i) =>
      String(i?.name ?? "").toLowerCase().includes(q)
    );
  });
}
