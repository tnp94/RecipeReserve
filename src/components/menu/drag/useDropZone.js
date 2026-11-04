import { useCallback, useRef } from "react";
import { useDragApi, useDragState } from "./DragProvider";

// Registers a View as a drop target. `ref` is a callback ref so a re-mounted View
// re-registers itself. Keys: unplanned, slot:<id>, entry:<id>, day:<n>, dayheader:<n>.
export default function useDropZone({ key, accepts, onDrop }) {
  const api = useDragApi();
  const { hoverKey } = useDragState();
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
        const zone = { key, accepts: acceptsKey.split("|"), node, onDrop: (p) => onDropRef.current(p) };
        current.current = zone;
        api.registerZone(key, zone);
      }
    },
    [api, key, acceptsKey]
  );

  return { ref, isOver: hoverKey === key };
}
