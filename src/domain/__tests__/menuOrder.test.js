import { orderDaySlots } from "../menuOrder";

const mk = (...names) => names.map((name, i) => ({ id: `s${i}`, name }));
const names = (slots) => slots.map((s) => s.name);

describe("orderDaySlots", () => {
  it("sorts breakfast, lunch, dinner into their positions", () => {
    expect(names(orderDaySlots(mk("Dinner", "Snack", "Breakfast")))).toEqual(["Breakfast", "Snack", "Dinner"]);
    expect(names(orderDaySlots(mk("Brunch", "Dinner", "Lunch")))).toEqual(["Brunch", "Lunch", "Dinner"]);
    expect(names(orderDaySlots(mk("Dinner", "Lunch", "Breakfast")))).toEqual(["Breakfast", "Lunch", "Dinner"]);
  });
  it("is case/space-insensitive, stable on ties, and does not mutate", () => {
    const input = mk(" dinner ", "LUNCH", "Dinner");
    const out = orderDaySlots(input);
    expect(names(out)).toEqual(["LUNCH", " dinner ", "Dinner"]);
    expect(out[1]).toBe(input[0]);
    expect(names(input)).toEqual([" dinner ", "LUNCH", "Dinner"]);
  });
  it("leaves other slots and empty input alone", () => {
    expect(orderDaySlots([])).toEqual([]);
    expect(names(orderDaySlots(mk("Snack", "Brunch")))).toEqual(["Snack", "Brunch"]);
  });
});

describe("moveSlotTarget / canMoveSlot", () => {
  const { moveSlotTarget, canMoveSlot } = require("../menuOrder");
  // Applies a result the way reorderSlot does, then returns the displayed names.
  const apply = (slots, id, dir) => {
    const t = moveSlotTarget(slots, id, dir);
    if (!t) return null;
    const moving = slots.find((s) => s.id === id);
    const rest = slots.filter((s) => s.id !== id);
    const at = rest.findIndex((s) => s.id === t.targetSlotId);
    rest.splice(t.position === "before" ? at : at + 1, 0, moving);
    return names(orderDaySlots(rest));
  };
  it("moves a custom slot up and down", () => {
    const s = mk("Breakfast", "Snack", "Dinner");
    expect(apply(s, "s1", "up")).toEqual(["Snack", "Breakfast", "Dinner"]);
    expect(apply(s, "s1", "down")).toEqual(["Breakfast", "Dinner", "Snack"]);
    expect(moveSlotTarget(s, "s1", "up")).toEqual({ targetSlotId: "s0", position: "before" });
    expect(moveSlotTarget(s, "s1", "down")).toEqual({ targetSlotId: "s2", position: "after" });
  });
  it("returns null when the display would not change", () => {
    const s = mk("Breakfast", "Lunch");
    expect(moveSlotTarget(s, "s1", "up")).toBeNull();
    expect(canMoveSlot(s, "s1", "up")).toBe(false);
    expect(canMoveSlot(s, "s0", "down")).toBe(false);
    expect(moveSlotTarget(s, "s0", "up")).toBeNull();
    expect(moveSlotTarget(s, "nope", "up")).toBeNull();
  });
  it("lets a custom slot pass a ranked one", () => {
    const s = mk("Brunch", "Breakfast");
    expect(apply(s, "s0", "down")).toEqual(["Breakfast", "Brunch"]);
    expect(canMoveSlot(s, "s0", "down")).toBe(true);
  });
});

describe("moveSlotTarget with ids not in displayed order", () => {
  const { moveSlotTarget } = require("../menuOrder");
  it("still moves one step in the displayed order", () => {
    const s = [{ id: "d", name: "Dinner" }, { id: "l", name: "Lunch" }, { id: "x", name: "Snack" }]; // shows Lunch, Dinner, Snack
    const t = moveSlotTarget(s, "x", "up");
    expect(t).not.toBeNull();
    const rest = s.filter((q) => q.id !== "x");
    const at = rest.findIndex((q) => q.id === t.targetSlotId);
    rest.splice(t.position === "before" ? at : at + 1, 0, s[2]);
    expect(orderDaySlots(rest).map((q) => q.name)).toEqual(["Lunch", "Snack", "Dinner"]);
  });
});
