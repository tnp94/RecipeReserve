import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

// iOS cannot present a Modal while another Modal is still dismissing (the fade takes
// ~300 ms); the second one silently fails to appear or leaves touches blocked. Every
// Modal in the app (AppModal, DialogProvider) goes through this gate: a Modal that is
// asked to show waits until no other Modal is mid-dismiss. Other platforms don't need
// it, so there the gate is a pass-through.
const GATED = Platform.OS === "ios";
const FALLBACK_MS = 600; // in case onDismiss never fires (e.g. the Modal unmounted)

let dismissing = 0;
const waiters = new Set();

function startDismiss() {
  dismissing += 1;
  let done = false;
  const timer = setTimeout(() => end(), FALLBACK_MS);
  function end() {
    if (done) return;
    done = true;
    clearTimeout(timer);
    dismissing -= 1;
    if (dismissing === 0) [...waiters].forEach((w) => w());
  }
  return end;
}

// Returns { shown, onDismiss }: render <Modal visible={shown} onDismiss={onDismiss}>.
export function useGatedModal(visible) {
  const [shown, setShown] = useState(false);
  const shownRef = useRef(false);
  shownRef.current = shown;
  const endDismiss = useRef(null);

  useEffect(() => {
    if (!GATED) return undefined;
    if (!visible) {
      if (shownRef.current) {
        setShown(false);
        endDismiss.current = startDismiss();
      }
      return undefined;
    }
    if (dismissing === 0) {
      setShown(true);
      return undefined;
    }
    const waiter = () => {
      waiters.delete(waiter);
      setShown(true);
    };
    waiters.add(waiter);
    return () => waiters.delete(waiter);
  }, [visible]);

  // Unmounting while shown dismisses the Modal without an onDismiss callback.
  useEffect(
    () => () => {
      // shown === true means it isn't already mid-dismiss.
      if (GATED && shownRef.current) startDismiss();
    },
    []
  );

  const onDismiss = () => {
    if (endDismiss.current) {
      endDismiss.current();
      endDismiss.current = null;
    }
  };

  return GATED ? { shown, onDismiss } : { shown: !!visible, onDismiss: undefined };
}
