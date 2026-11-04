import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { colors } from "../../theme";

// Web-only HTML5 drag-and-drop helpers. `ref` must point at a host View (a DOM element
// under react-native-web). Every hook is a no-op on native or when `enabled` is false.
export const DRAG_MIME = "application/x-recipereserve";
export const IS_WEB = Platform.OS === "web";

// dataTransfer payloads are unreadable during dragover, so remember the dragged type here.
let draggedType = null;

// Style for a target under the pointer (outline does not shift layout).
export const dropOverStyle = (isOver) =>
  isOver
    ? {
        backgroundColor: "rgba(47,128,237,0.12)",
        outlineWidth: 2,
        outlineStyle: "solid",
        outlineColor: colors.accentStrong,
        outlineOffset: -2,
      }
    : null;

export function useDraggable(ref, payload, enabled = true) {
  const type = payload?.type;
  const id = payload?.id;
  useEffect(() => {
    const el = ref.current;
    if (!IS_WEB || !enabled || !el || !el.addEventListener) return undefined;
    el.setAttribute("draggable", "true");
    el.style.cursor = "grab";
    el.style.userSelect = "none";
    const onStart = (e) => {
      e.stopPropagation();
      draggedType = type;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(DRAG_MIME, JSON.stringify({ type, id }));
      e.dataTransfer.setData("text/plain", `${type}:${id}`);
      el.style.opacity = "0.5";
    };
    const onEnd = () => {
      draggedType = null;
      el.style.opacity = "";
    };
    el.addEventListener("dragstart", onStart);
    el.addEventListener("dragend", onEnd);
    return () => {
      el.removeEventListener("dragstart", onStart);
      el.removeEventListener("dragend", onEnd);
      el.removeAttribute("draggable");
      el.style.cursor = "";
      el.style.userSelect = "";
      el.style.opacity = "";
    };
  }, [ref, type, id, enabled]);
}

// Returns `isOver`. Hover state is local to the calling component.
export function useDropTarget(ref, { accepts, onDrop }, enabled = true) {
  const [isOver, setIsOver] = useState(false);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  const acceptsKey = accepts.join("|");
  useEffect(() => {
    const el = ref.current;
    if (!IS_WEB || !enabled || !el || !el.addEventListener) return undefined;
    const list = acceptsKey.split("|");
    const accepted = (e) =>
      !!e.dataTransfer &&
      Array.from(e.dataTransfer.types || []).includes(DRAG_MIME) &&
      list.includes(draggedType);
    const onOver = (e) => {
      if (!accepted(e)) return;
      e.preventDefault();
      e.stopPropagation(); // innermost accepting target wins
      e.dataTransfer.dropEffect = "move";
      setIsOver(true);
    };
    const onLeave = (e) => {
      if (e.relatedTarget && el.contains(e.relatedTarget)) return;
      setIsOver(false);
    };
    const onDropEvt = (e) => {
      if (!accepted(e)) return;
      e.preventDefault();
      e.stopPropagation();
      setIsOver(false);
      let payload = null;
      try {
        payload = JSON.parse(e.dataTransfer.getData(DRAG_MIME));
      } catch (err) {
        return;
      }
      if (payload && list.includes(payload.type)) onDropRef.current(payload);
    };
    const onEnd = () => setIsOver(false);
    el.addEventListener("dragover", onOver);
    el.addEventListener("dragenter", onOver);
    el.addEventListener("dragleave", onLeave);
    el.addEventListener("drop", onDropEvt);
    document.addEventListener("dragend", onEnd);
    return () => {
      el.removeEventListener("dragover", onOver);
      el.removeEventListener("dragenter", onOver);
      el.removeEventListener("dragleave", onLeave);
      el.removeEventListener("drop", onDropEvt);
      document.removeEventListener("dragend", onEnd);
      setIsOver(false);
    };
  }, [ref, acceptsKey, enabled]);
  return isOver;
}
