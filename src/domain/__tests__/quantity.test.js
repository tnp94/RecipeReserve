import {
  parseQuantity, scaleQuantity, addQuantities, formatNumber, formatQuantity,
} from "../quantity";

const num = (min, max = min) => ({ kind: "number", min, max });

describe("parseQuantity", () => {
  it("parses empty string as blank", () => expect(parseQuantity("")).toEqual({ kind: "blank" }));
  it("parses null as blank", () => expect(parseQuantity(null)).toEqual({ kind: "blank" }));
  it("parses integer", () => expect(parseQuantity("2")).toEqual(num(2)));
  it("parses decimal", () => expect(parseQuantity("1.5")).toEqual(num(1.5)));
  it("parses leading-dot decimal", () => expect(parseQuantity(".5")).toEqual(num(0.5)));
  it("parses fraction", () => expect(parseQuantity("1/4")).toEqual(num(0.25)));
  it("parses mixed number", () => expect(parseQuantity("1 1/2")).toEqual(num(1.5)));
  it("parses vulgar fraction", () => expect(parseQuantity("½")).toEqual(num(0.5)));
  it("parses whole plus vulgar fraction without space", () => expect(parseQuantity("1½")).toEqual(num(1.5)));
  it("parses whole plus vulgar fraction with space", () => expect(parseQuantity("1 ½")).toEqual(num(1.5)));
  it("parses range", () => expect(parseQuantity("1-2")).toEqual(num(1, 2)));
  it("parses range with fractions", () => expect(parseQuantity("1/2 - 1")).toEqual(num(0.5, 1)));
  it("parses 'to' range", () => expect(parseQuantity("2 to 3")).toEqual(num(2, 3)));
  it("swaps reversed range", () => expect(parseQuantity("3-1")).toEqual(num(1, 3)));
  it("parses text", () => expect(parseQuantity("a pinch")).toEqual({ kind: "text", text: "a pinch" }));
  it("treats zero denominator as text", () => expect(parseQuantity("1/0")).toEqual({ kind: "text", text: "1/0" }));
  it("parses number input", () => expect(parseQuantity(3)).toEqual(num(3)));
});

describe("formatNumber / formatQuantity", () => {
  it("formats integer", () => expect(formatNumber(2)).toBe("2"));
  it("formats half", () => expect(formatNumber(0.5)).toBe("1/2"));
  it("formats mixed", () => expect(formatNumber(1.5)).toBe("1 1/2"));
  it("formats third", () => expect(formatNumber(0.333)).toBe("1/3"));
  it("formats 2.75", () => expect(formatNumber(2.75)).toBe("2 3/4"));
  // Plan listed 1.38 -> "1.38", but 0.38 is within 0.02 of 3/8, so the rule yields "1 3/8".
  it("formats 1.38 as 1 3/8 (within 0.02 of 3/8)", () => expect(formatNumber(1.38)).toBe("1 3/8"));
  it("formats decimal not near a fraction", () => expect(formatNumber(1.43)).toBe("1.43"));
  it("formats 0.1", () => expect(formatNumber(0.1)).toBe("0.1"));
  it("formats range", () => expect(formatQuantity(num(1, 2))).toBe("1-2"));
  it("formats text and blank", () => {
    expect(formatQuantity({ kind: "text", text: "a pinch" })).toBe("a pinch");
    expect(formatQuantity({ kind: "blank" })).toBe("");
  });
});

describe("scaleQuantity", () => {
  it("scales a range", () => expect(scaleQuantity(parseQuantity("1-2"), 2)).toEqual(num(2, 4)));
  it("leaves text unchanged", () => {
    const t = { kind: "text", text: "a pinch" };
    expect(scaleQuantity(t, 2)).toEqual(t);
  });
  it("leaves blank unchanged", () => expect(scaleQuantity({ kind: "blank" }, 2)).toEqual({ kind: "blank" }));
});

describe("addQuantities", () => {
  it("adds numbers", () => expect(addQuantities(num(1, 2), num(2))).toEqual(num(3, 4)));
  it("throws on text", () => {
    expect(() => addQuantities(num(1), { kind: "text", text: "x" })).toThrow();
  });
});

describe("hyphenated mixed numbers", () => {
  const { parseQuantity: pq, formatQuantity: fq } = require("../quantity");
  it("'1-1/2' is one and a half", () => expect(pq("1-1/2")).toEqual({ kind: "number", min: 1.5, max: 1.5 }));
  it("'2 - 3/4' is two and three quarters", () => expect(fq(pq("2 - 3/4"))).toBe("2 3/4"));
  it("'1-2' is still a range", () => expect(pq("1-2")).toEqual({ kind: "number", min: 1, max: 2 }));
  it("'1/2-1' is still a range", () => expect(pq("1/2-1")).toEqual({ kind: "number", min: 0.5, max: 1 }));
  it("'1-3/2' (improper fraction) is a range", () => expect(pq("1-3/2")).toEqual({ kind: "number", min: 1, max: 1.5 }));
});
