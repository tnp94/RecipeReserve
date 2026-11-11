// Rules for menu drag-and-drop, kept free of React so they can be tested.

export const DROP_SWAP = "swap";
export const DROP_INSERT = "insert";

const holds = (items, id) => (items ?? []).some((item) => item.id === id);

// What dropping `payload` ({ type: "entry"|"slot"|"day", id }) on `target` would do:
// DROP_SWAP (trades places with something of the same rank), DROP_INSERT (goes into or
// between), or null when the drop would change nothing.
// Targets: { kind: "entry", id }, { kind: "dayHeader", id },
// { kind: "slot", id, entries }, { kind: "day", entries, slots }, { kind: "unplanned", entries }.
export function menuDropAction(target, payload) {
  if (!target || !payload) return null;
  const { type, id } = payload;
  switch (target.kind) {
    case "entry":
      return type === "entry" && id !== target.id ? DROP_SWAP : null;
    case "dayHeader":
      return type === "day" && id !== target.id ? DROP_SWAP : null;
    case "slot":
      if (type === "slot") return id !== target.id ? DROP_INSERT : null;
      return type === "entry" && !holds(target.entries, id) ? DROP_INSERT : null;
    case "day":
      if (type === "slot") return !holds(target.slots, id) ? DROP_INSERT : null;
      return type === "entry" && !holds(target.entries, id) ? DROP_INSERT : null;
    case "unplanned":
      return type === "entry" && !holds(target.entries, id) ? DROP_INSERT : null;
    default:
      return null;
  }
}

export const SCROLL_EDGE = 56; // px from a scroller's edge where auto-scroll can start
const MIN_STEP = 4; // px per tick at the zone's inner edge
const MAX_STEP = 16; // px per tick at the scroller's edge and beyond

// Auto-scroll step for one scroller ({ rect, horizontal, offset, content }), or 0. Speed
// grows with depth into the edge zone. A pointer past the edge (over the tab bar or the
// toolbar) still scrolls at full speed, so the user doesn't have to stop inside the zone;
// it only has to be level with the scroller on the other axis (side-by-side columns).
export function autoScrollDelta({ rect, horizontal, offset, content }, x, y) {
  if (!rect) return 0;
  const cross = horizontal ? y - rect.y : x - rect.x;
  const crossSize = horizontal ? rect.h : rect.w;
  if (cross < 0 || cross > crossSize) return 0;
  const near = horizontal ? x - rect.x : y - rect.y;
  const size = horizontal ? rect.w : rect.h;
  const speed = (dist) => MIN_STEP + (MAX_STEP - MIN_STEP) * Math.min(1, Math.max(0, (SCROLL_EDGE - dist) / SCROLL_EDGE));
  let delta = 0;
  if (near < SCROLL_EDGE) delta = -speed(near);
  else if (near > size - SCROLL_EDGE) delta = speed(size - near);
  // Only report a delta the scroller can actually apply.
  const max = Math.max(0, content - size);
  return (delta < 0 && offset <= 0) || (delta > 0 && offset >= max) ? 0 : delta;
}

// Offset that turns gesture coordinates (absoluteX/Y) into measureInWindow coordinates.
// On Android with edge-to-edge drawing the two can disagree by the status-bar height, which
// made drops land below the finger. The handle under the finger gives the same point in both
// systems: its measured window rect plus the pointer's position inside it, and absoluteX/Y.
export function pointerOffset({ rect, localX, localY, absoluteX, absoluteY }) {
  if (!rect || ![localX, localY, absoluteX, absoluteY].every(Number.isFinite)) return { x: 0, y: 0 };
  return { x: rect.x + localX - absoluteX, y: rect.y + localY - absoluteY };
}

// How far the preview's centre sits above a fingertip, so the finger doesn't cover it.
export const TOUCH_LIFT = 64;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Top-left of the drag preview, relative to its container. The pointer is in window
// coordinates. The preview is kept inside the container: drag handles sit at the left edge
// of a row, so a preview centred on the finger would otherwise run off the screen.
export function dragPreviewPosition({ x, y, container, width, height, lift = 0 }) {
  const left = x - container.x - width / 2;
  const top = y - container.y - height / 2 - lift;
  return {
    // Before the container has been measured its size is 0, so there is nothing to clamp to.
    x: container.w > width ? clamp(left, 0, container.w - width) : left,
    y: container.h > height ? clamp(top, 0, container.h - height) : top,
  };
}
