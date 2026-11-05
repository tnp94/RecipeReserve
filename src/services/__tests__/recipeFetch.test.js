import { fetchRecipeDraft } from "../recipeFetch";

const PAGE = `<script type="application/ld+json">{"@type":"Recipe","name":"Soup","recipeIngredient":["1 leek"]}</script>`;
const codeOf = (promise) => promise.then(() => "resolved", (e) => e.code);
const realFetch = global.fetch;

afterEach(() => {
  global.fetch = realFetch;
  jest.useRealTimers();
});

describe("fetchRecipeDraft", () => {
  it("returns a draft from the page", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => PAGE });
    const draft = await fetchRecipeDraft("https://example.com/soup");
    expect(draft.name).toBe("Soup");
    expect(global.fetch.mock.calls[0][0]).toBe("https://example.com/soup");
  });

  it("reports a site that refuses", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 403 });
    await expect(codeOf(fetchRecipeDraft("https://example.com"))).resolves.toBe("http");
  });

  it("reports a request that fails", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(codeOf(fetchRecipeDraft("https://example.com"))).resolves.toBe("network");
  });

  it("reports a page with no recipe", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: async () => "<html></html>" });
    await expect(codeOf(fetchRecipeDraft("https://example.com"))).resolves.toBe("no-recipe");
  });

  it("gives up on a page that never answers", async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn(
      (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))))
    );
    const result = codeOf(fetchRecipeDraft("https://example.com"));
    jest.advanceTimersByTime(15000);
    await expect(result).resolves.toBe("timeout");
  });
});
