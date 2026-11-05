import { parseRecipeHtml } from "../domain/recipeImport";

const TIMEOUT_MS = 15000;

// code: "network" (unreachable, or blocked by the browser's cross-site rules on web),
//       "timeout" | "http" (the site refused) | "no-recipe" (no recipe data on the page)
export class RecipeFetchError extends Error {
  constructor(code) {
    super(code);
    this.name = "RecipeFetchError";
    this.code = code;
  }
}

// Downloads a recipe page on the device and reads it into a draft. There is no server, so
// on web this only works for sites that allow cross-site requests.
export async function fetchRecipeDraft(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let html;
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "text/html,application/xhtml+xml" } });
    if (!response.ok) throw new RecipeFetchError("http");
    html = await response.text();
  } catch (e) {
    if (e instanceof RecipeFetchError) throw e;
    throw new RecipeFetchError(controller.signal.aborted ? "timeout" : "network");
  } finally {
    clearTimeout(timer);
  }
  const draft = parseRecipeHtml(html);
  if (!draft) throw new RecipeFetchError("no-recipe");
  return draft;
}
