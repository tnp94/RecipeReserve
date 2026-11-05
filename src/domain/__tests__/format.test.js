import { formatMinutes, plural, totalMinutes } from "../format";

describe("formatMinutes", () => {
  it.each([[0, ""], [null, ""], ["", ""], [-5, ""], [5, "5 min"], [45, "45 min"], [60, "1 hr"], [75, "1 hr 15 min"], [150, "2 hr 30 min"], ["20", "20 min"]])(
    "%p -> %p",
    (input, expected) => expect(formatMinutes(input)).toBe(expected)
  );
});

describe("totalMinutes", () => {
  it("adds prep and active, treating blanks as 0", () => {
    expect(totalMinutes({ time: { prep: 20, active: "40" } })).toBe(60);
    expect(totalMinutes({ time: { prep: "", active: 0 } })).toBe(0);
    expect(totalMinutes({})).toBe(0);
  });
});

describe("plural", () => {
  it("picks the singular for 1", () => {
    expect(plural(1, "item")).toBe("1 item");
    expect(plural(3, "item")).toBe("3 items");
    expect(plural(2, "dish", "dishes")).toBe("2 dishes");
  });
});
