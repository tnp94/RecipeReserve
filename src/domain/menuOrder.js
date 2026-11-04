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

// Where to dispatch reorderSlot to nudge a slot one step up/down in the displayed
// order. `daySlotsInIdOrder` are the day's slots in slots.ids order. Returns
// { targetSlotId, position } or null when the displayed order cannot change.
// The neighbour is tried first; other insertion points cover ids that are not yet
// in displayed order (e.g. slots added Dinner, Lunch).
export function moveSlotTarget(daySlotsInIdOrder, slotId, direction) {
  const displayed = orderDaySlots(daySlotsInIdOrder);
  const idx = displayed.findIndex((s) => s.id === slotId);
  const other = direction === "up" ? idx - 1 : direction === "down" ? idx + 1 : -1;
  if (idx < 0 || other < 0 || other >= displayed.length) return null;
  const wanted = displayed.slice();
  [wanted[idx], wanted[other]] = [wanted[other], wanted[idx]];
  const moving = daySlotsInIdOrder.find((s) => s.id === slotId);
  const rest = daySlotsInIdOrder.filter((s) => s.id !== slotId);
  const neighbor = displayed[other];
  const first = { targetSlotId: neighbor.id, position: direction === "up" ? "before" : "after" };
  const candidates = [first];
  rest.forEach((s) => ["before", "after"].forEach((position) => candidates.push({ targetSlotId: s.id, position })));
  for (const c of candidates) {
    const trial = rest.slice();
    const at = trial.findIndex((s) => s.id === c.targetSlotId);
    trial.splice(c.position === "before" ? at : at + 1, 0, moving);
    if (orderDaySlots(trial).every((s, i) => s.id === wanted[i].id)) return c;
  }
  return null;
}

export function canMoveSlot(daySlotsInIdOrder, slotId, direction) {
  return moveSlotTarget(daySlotsInIdOrder, slotId, direction) !== null;
}
