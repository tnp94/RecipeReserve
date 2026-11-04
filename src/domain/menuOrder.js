// Display order for a day's meal slots. Slots named Breakfast / Lunch / Dinner are
// sorted among the positions they already occupy; every other slot keeps its position.
const RANK = { breakfast: 0, lunch: 1, dinner: 2 };

const rankOf = (slot) => RANK[String(slot.name ?? "").trim().toLowerCase()];

export function orderDaySlots(slots) {
  const positions = [];
  const ranked = [];
  slots.forEach((slot, i) => {
    if (rankOf(slot) !== undefined) {
      positions.push(i);
      ranked.push(slot);
    }
  });
  // Array.prototype.sort is stable, so ties keep their existing relative order.
  ranked.sort((a, b) => rankOf(a) - rankOf(b));
  const out = slots.slice();
  positions.forEach((pos, i) => (out[pos] = ranked[i]));
  return out;
}
