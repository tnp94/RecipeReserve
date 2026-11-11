import { DROP_INSERT, DROP_SWAP, SCROLL_EDGE, TOUCH_LIFT, autoScrollDelta, dragPreviewPosition, menuDropAction, pointerOffset } from "../menuDrag";

const entry = (id) => ({ type: "entry", id });
const slot = (id) => ({ type: "slot", id });
const day = (id) => ({ type: "day", id });

describe("menuDropAction", () => {
  it("swaps an entry with another entry", () => {
    expect(menuDropAction({ kind: "entry", id: "entry-2" }, entry("entry-1"))).toBe(DROP_SWAP);
  });

  it("swaps a day with another day, including Monday (day 0)", () => {
    expect(menuDropAction({ kind: "dayHeader", id: 3 }, day(1))).toBe(DROP_SWAP);
    expect(menuDropAction({ kind: "dayHeader", id: 0 }, day(1))).toBe(DROP_SWAP);
  });

  it("does nothing when something is dropped on itself", () => {
    expect(menuDropAction({ kind: "entry", id: "entry-1" }, entry("entry-1"))).toBeNull();
    expect(menuDropAction({ kind: "dayHeader", id: 0 }, day(0))).toBeNull();
    expect(menuDropAction({ kind: "slot", id: "slot-1", entries: [] }, slot("slot-1"))).toBeNull();
  });

  it("inserts an entry into a slot, a day or Unplanned", () => {
    expect(menuDropAction({ kind: "slot", id: "slot-1", entries: [] }, entry("entry-1"))).toBe(DROP_INSERT);
    expect(menuDropAction({ kind: "day", entries: [], slots: [] }, entry("entry-1"))).toBe(DROP_INSERT);
    expect(menuDropAction({ kind: "unplanned", entries: [] }, entry("entry-1"))).toBe(DROP_INSERT);
  });

  it("does nothing when an entry is already directly in the target", () => {
    const entries = [{ id: "entry-1" }];
    expect(menuDropAction({ kind: "slot", id: "slot-1", entries }, entry("entry-1"))).toBeNull();
    expect(menuDropAction({ kind: "day", entries, slots: [] }, entry("entry-1"))).toBeNull();
    expect(menuDropAction({ kind: "unplanned", entries }, entry("entry-1"))).toBeNull();
  });

  it("inserts a slot next to another slot or into another day", () => {
    expect(menuDropAction({ kind: "slot", id: "slot-2", entries: [] }, slot("slot-1"))).toBe(DROP_INSERT);
    expect(menuDropAction({ kind: "day", entries: [], slots: [] }, slot("slot-1"))).toBe(DROP_INSERT);
  });

  it("does nothing when a slot is dropped on the day it is already in", () => {
    expect(menuDropAction({ kind: "day", entries: [], slots: [{ id: "slot-1" }] }, slot("slot-1"))).toBeNull();
  });

  it("rejects types a target doesn't take, and missing arguments", () => {
    expect(menuDropAction({ kind: "entry", id: "entry-1" }, slot("slot-1"))).toBeNull();
    expect(menuDropAction({ kind: "dayHeader", id: 1 }, entry("entry-1"))).toBeNull();
    expect(menuDropAction({ kind: "unplanned", entries: [] }, day(1))).toBeNull();
    expect(menuDropAction({ kind: "nope" }, entry("entry-1"))).toBeNull();
    expect(menuDropAction(null, entry("entry-1"))).toBeNull();
    expect(menuDropAction({ kind: "entry", id: "entry-1" }, null)).toBeNull();
  });
});

describe("autoScrollDelta", () => {
  const rect = { x: 0, y: 100, w: 400, h: 600 }; // bottom edge at 700
  const vertical = { rect, horizontal: false, offset: 200, content: 2000 };

  it("doesn't scroll in the middle of the scroller", () => {
    expect(autoScrollDelta(vertical, 200, 400)).toBe(0);
  });

  it("speeds up with depth into the edge zone", () => {
    expect(autoScrollDelta(vertical, 200, 700 - SCROLL_EDGE + 1)).toBeCloseTo(4, 0);
    expect(autoScrollDelta(vertical, 200, 699)).toBeCloseTo(16, 0);
    expect(autoScrollDelta(vertical, 200, 101)).toBeCloseTo(-16, 0);
  });

  it("keeps scrolling at full speed past the edge (over the tab bar or toolbar)", () => {
    expect(autoScrollDelta(vertical, 200, 760)).toBe(16);
    expect(autoScrollDelta(vertical, 200, 40)).toBe(-16);
  });

  it("ignores a pointer beside the scroller, so only the column above the pointer scrolls", () => {
    expect(autoScrollDelta(vertical, 500, 760)).toBe(0);
    expect(autoScrollDelta({ ...vertical, rect: { ...rect, x: 100 } }, 50, 760)).toBe(0);
  });

  it("stops at the ends of the content", () => {
    expect(autoScrollDelta({ ...vertical, offset: 0 }, 200, 40)).toBe(0);
    expect(autoScrollDelta({ ...vertical, offset: 1400 }, 200, 760)).toBe(0);
    expect(autoScrollDelta({ ...vertical, offset: 0, content: 300 }, 200, 760)).toBe(0);
  });

  it("works along the x axis for a horizontal scroller, and not below it", () => {
    const horizontal = { rect, horizontal: true, offset: 200, content: 2000 };
    expect(autoScrollDelta(horizontal, 450, 400)).toBe(16);
    expect(autoScrollDelta(horizontal, 390, 760)).toBe(0);
  });

  it("returns 0 before the scroller has been measured", () => {
    expect(autoScrollDelta({ ...vertical, rect: null }, 200, 760)).toBe(0);
  });
});

describe("dragPreviewPosition", () => {
  const container = { x: 0, y: 100, w: 400, h: 600 };
  const base = { container, width: 200, height: 40 };

  it("centres on the pointer with no lift (mouse)", () => {
    expect(dragPreviewPosition({ ...base, x: 200, y: 400 })).toEqual({ x: 100, y: 280 });
  });

  it("lifts the preview clear of a fingertip", () => {
    const { y } = dragPreviewPosition({ ...base, x: 200, y: 400, lift: TOUCH_LIFT });
    expect(y).toBe(280 - TOUCH_LIFT);
    // The preview's bottom edge ends above the touch point (window y 400 = container y 300).
    expect(y + base.height).toBeLessThan(300);
  });

  it("keeps the preview inside the container", () => {
    expect(dragPreviewPosition({ ...base, x: 20, y: 400 }).x).toBe(0);
    expect(dragPreviewPosition({ ...base, x: 390, y: 400 }).x).toBe(200);
    expect(dragPreviewPosition({ ...base, x: 200, y: 110, lift: TOUCH_LIFT }).y).toBe(0);
    expect(dragPreviewPosition({ ...base, x: 200, y: 699 }).y).toBe(560);
  });

  it("doesn't clamp before the container is measured", () => {
    const unmeasured = { x: 0, y: 0, w: 0, h: 0 };
    expect(dragPreviewPosition({ ...base, container: unmeasured, x: 20, y: 30 })).toEqual({ x: -80, y: 10 });
  });
});

describe("pointerOffset", () => {
  it("is zero when both coordinate systems agree", () => {
    expect(pointerOffset({ rect: { x: 10, y: 200, w: 44, h: 44 }, localX: 20, localY: 22, absoluteX: 30, absoluteY: 222 })).toEqual({ x: 0, y: 0 });
  });

  it("corrects gesture coordinates that are a status bar below the measured ones", () => {
    const off = pointerOffset({ rect: { x: 10, y: 200, w: 44, h: 44 }, localX: 20, localY: 22, absoluteX: 30, absoluteY: 246 });
    expect(off).toEqual({ x: 0, y: -24 });
    expect(246 + off.y).toBe(222); // the finger's point inside the measured handle
  });

  it("falls back to zero without a measurement", () => {
    expect(pointerOffset({ rect: null, localX: 1, localY: 1, absoluteX: 1, absoluteY: 1 })).toEqual({ x: 0, y: 0 });
    expect(pointerOffset({ rect: { x: 0, y: 0 }, localX: undefined, localY: 1, absoluteX: 1, absoluteY: 1 })).toEqual({ x: 0, y: 0 });
  });
});
