import { useCallback, useRef, useSyncExternalStore } from "react";
import { useDragApi } from "./DragProvider";

// Registers a View as a drop target. `ref` is a callback ref so a re-mounted View
// re-registers itself. Keys: unplanned, slot:<id>, entry:<id>, day:<n> (card: slot|entry), dayheader:<n>.
//
// Subscribes to the drag store with a per-zone snapshot that only changes when this zone
// becomes / stops being the hover target (or its half changes), so other zones don't
// re-render while the pointer moves.
//
// `actionFor(payload)` says what a drop would do (DROP_SWAP, DROP_INSERT, or null for
// nothing). It sets the icon on the drag preview, and onDrop only runs when it isn't null,
// so the icon and the result can't disagree.
export default function useDropZone({ key, accepts, actionFor, onDrop }) {
  const api = useDragApi();
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  const actionForRef = useRef(actionFor);
  actionForRef.current = actionFor;
  const acceptsKey = accepts.join("|");
  const current = useRef(null);

  const ref = useCallback(
    (node) => {
      if (current.current) {
        api.unregisterZone(current.current.key, current.current);
        current.current = null;
      }
      if (node) {
        const zone = {
          key,
          accepts: acceptsKey.split("|"),
          node,
          actionFor: (p) => actionForRef.current(p),
          onDrop: (p, info) => onDropRef.current(p, info),
        };
        current.current = zone;
        api.registerZone(key, zone);
      }
    },
    [api, key, acceptsKey]
  );

  // Primitive snapshot: null unless hovered, else "half|type|id".
  const snapshot = useSyncExternalStore(api.subscribe, () => {
    const s = api.getState();
    return s.hoverKey === key && s.active ? `${s.hoverHalf ?? ""}|${s.active.type}|${s.active.id}` : null;
  });
  if (snapshot === null) return { ref, isOver: false, hoverHalf: null, activeType: null, activeId: null };
  const [half, type, id] = snapshot.split("|");
  return { ref, isOver: true, hoverHalf: half || null, activeType: type, activeId: id };
}
