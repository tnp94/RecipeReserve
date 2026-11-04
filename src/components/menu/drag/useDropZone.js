import { useCallback, useRef } from "react";
import { useDragApi, useDragState } from "./DragProvider";

// Registers a View as a drop target. `ref` is a callback ref so a re-mounted View
// re-registers itself. Keys: unplanned, slot:<id>, entry:<id>, day:<n> (card: slot|entry), dayheader:<n>.
export default function useDropZone({ key, accepts, onDrop }) {
  const api = useDragApi();
  const { hoverKey, hoverHalf, active } = useDragState();
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  const acceptsKey = accepts.join("|");
  const current = useRef(null);

  const ref = useCallback(
    (node) => {
      if (current.current) {
        api.unregisterZone(current.current.key, current.current);
        current.current = null;
      }
      if (node) {
        const zone = { key, accepts: acceptsKey.split("|"), node, onDrop: (p, info) => onDropRef.current(p, info) };
        current.current = zone;
        api.registerZone(key, zone);
      }
    },
    [api, key, acceptsKey]
  );

  const isOver = hoverKey === key;
  return { ref, isOver, hoverHalf: isOver ? hoverHalf : null, activeType: active ? active.type : null, activeId: active ? active.id : null };
}
