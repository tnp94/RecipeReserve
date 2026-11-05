import { todayIndex } from "../week";

describe("todayIndex", () => {
  it("maps JS days (Sunday = 0) onto the Monday-first week", () => {
    expect(todayIndex(new Date(2026, 10, 2))).toBe(0); // Monday 2 Nov 2026
    expect(todayIndex(new Date(2026, 10, 5))).toBe(3); // Thursday
    expect(todayIndex(new Date(2026, 10, 8))).toBe(6); // Sunday
  });
});
