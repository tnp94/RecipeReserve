// Quantity = { kind: "blank" } | { kind: "number", min, max } | { kind: "text", text }

const VULGAR = {
  "½": 1 / 2, "¼": 1 / 4, "¾": 3 / 4, "⅓": 1 / 3, "⅔": 2 / 3,
  "⅛": 1 / 8, "⅜": 3 / 8, "⅝": 5 / 8, "⅞": 7 / 8,
};
const VULGAR_CLASS = "[½¼¾⅓⅔⅛⅜⅝⅞]";

// Parses a single value; returns a number or null.
function parseSingle(s) {
  s = s.trim();
  let m;
  if ((m = s.match(/^(\d+)?\s*(½|¼|¾|⅓|⅔|⅛|⅜|⅝|⅞)$/))) {
    return (m[1] ? Number(m[1]) : 0) + VULGAR[m[2]];
  }
  if ((m = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/))) {
    const d = Number(m[3]);
    return d === 0 ? null : Number(m[1]) + Number(m[2]) / d;
  }
  if ((m = s.match(/^(\d+)\s*\/\s*(\d+)$/))) {
    const d = Number(m[2]);
    return d === 0 ? null : Number(m[1]) / d;
  }
  if (/^(\d+\.?\d*|\.\d+)$/.test(s)) return Number(s);
  return null;
}

export function parseQuantity(input) {
  if (input === null || input === undefined) return { kind: "blank" };
  if (typeof input === "number") {
    return Number.isFinite(input)
      ? { kind: "number", min: input, max: input }
      : { kind: "text", text: String(input) };
  }
  const s = String(input).trim();
  if (s === "") return { kind: "blank" };

  const single = parseSingle(s);
  if (single !== null) return { kind: "number", min: single, max: single };

  // "1-1/2" is the common hyphenated spelling of one and a half, not a range 1/2..1:
  // a whole number joined by a hyphen to a proper fraction.
  const mixed = s.match(/^(\d+)\s*-\s*(\d+)\s*\/\s*(\d+)$/);
  if (mixed && Number(mixed[3]) > 0 && Number(mixed[2]) < Number(mixed[3])) {
    const v = Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
    return { kind: "number", min: v, max: v };
  }

  const parts = s.split(/\s*[-–—]\s*|\s+to\s+/i);
  if (parts.length === 2) {
    const a = parseSingle(parts[0]);
    const b = parseSingle(parts[1]);
    if (a !== null && b !== null) {
      return { kind: "number", min: Math.min(a, b), max: Math.max(a, b) };
    }
  }
  return { kind: "text", text: s };
}

export function scaleQuantity(q, factor) {
  if (q.kind !== "number") return q;
  return { kind: "number", min: q.min * factor, max: q.max * factor };
}

export function addQuantities(a, b) {
  if (a.kind !== "number" || b.kind !== "number") {
    throw new Error("addQuantities requires two numeric quantities");
  }
  return { kind: "number", min: a.min + b.min, max: a.max + b.max };
}

const FRACTIONS = [
  [1 / 8, "1/8"], [1 / 4, "1/4"], [1 / 3, "1/3"], [3 / 8, "3/8"], [1 / 2, "1/2"],
  [5 / 8, "5/8"], [2 / 3, "2/3"], [3 / 4, "3/4"], [7 / 8, "7/8"],
];

export function formatNumber(n) {
  const r = Math.round(n * 100) / 100;
  if (Number.isInteger(r)) return String(r);
  const whole = Math.floor(r);
  const frac = r - whole;
  for (const [value, text] of FRACTIONS) {
    if (Math.abs(frac - value) <= 0.02) {
      return whole === 0 ? text : `${whole} ${text}`;
    }
  }
  return String(parseFloat(r.toFixed(2)));
}

export function formatQuantity(q) {
  if (q.kind === "number") {
    return q.min === q.max
      ? formatNumber(q.min)
      : `${formatNumber(q.min)}-${formatNumber(q.max)}`;
  }
  if (q.kind === "text") return q.text;
  return "";
}
