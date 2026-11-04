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
