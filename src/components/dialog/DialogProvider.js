import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { elevation, makeStyles, radius, spacing } from "../../theme";
import { useGatedModal } from "../modalGate";
import AppText from "../ui/AppText";
import Button from "../ui/Button";
import TextField from "../ui/TextField";

const DialogContext = createContext(null);

// Short pause between closing one dialog and running its button's onPress (which may
// open another dialog or a sheet). iOS's "can't present while dismissing" rule is
// handled for every Modal by the shared gate in ../modalGate.
const NEXT_TICK_MS = 50;

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used inside <DialogProvider>");
  return ctx;
}

const PromptBody = ({ dialog, onClose }) => {
  const styles = useStyles();
  const [text, setText] = useState(dialog.defaultValue ?? "");
  const trimmed = text.trim();
  const canConfirm = trimmed.length > 0;
  const confirm = () => {
    if (canConfirm) onClose(() => dialog.onSubmit && dialog.onSubmit(trimmed));
  };
  return (
    <>
      <TextField
        autoFocus
        value={text}
        onChangeText={setText}
        placeholder={dialog.placeholder}
        accessibilityLabel={dialog.title}
        onSubmitEditing={confirm}
        returnKeyType="done"
        selectTextOnFocus
        style={styles.input}
      />
      <View style={styles.buttonsRow}>
        <DialogButton text="Cancel" style="cancel" onPress={() => onClose()} />
        <DialogButton text={dialog.confirmText ?? "OK"} primary disabled={!canConfirm} onPress={confirm} />
      </View>
    </>
  );
};

// Buttons follow the platform-alert `style`: "cancel" is quiet, "destructive" is red.
// In a row, the last non-cancel button is the filled (primary) one; stacked lists of
// choices use soft buttons so no single choice looks pre-selected.
const DialogButton = ({ text, style, disabled, onPress, stacked, primary }) => {
  let variant = "ghost";
  if (style === "cancel") variant = stacked ? "ghost" : "secondary";
  else if (style === "destructive") variant = primary && !stacked ? "danger" : "dangerGhost";
  else variant = primary && !stacked ? "primary" : stacked ? "tonal" : "ghost";
  return (
    <Button
      label={text}
      onPress={onPress}
      disabled={disabled}
      variant={variant}
      fullWidth={stacked}
      style={stacked ? { borderRadius: radius.md } : null}
    />
  );
};

export function DialogProvider({ children }) {
  const [current, setCurrent] = useState(null);
  const currentRef = useRef(null); // non-null from open until the next-tick hand-off
  const queueRef = useRef([]);
  const idRef = useRef(0);

  const setActive = (d) => {
    currentRef.current = d;
    setCurrent(d);
  };

  const enqueue = useCallback((dialog) => {
    const d = { ...dialog, id: ++idRef.current };
    if (currentRef.current) queueRef.current.push(d);
    else setActive(d);
  }, []);

  // Close the visible dialog, then run `then` (which may open another dialog or a sheet)
  // and finally show the next queued dialog, if any.
  const close = useCallback((then) => {
    setCurrent(null); // hides the Modal; currentRef stays set so new calls queue
    setTimeout(() => {
      currentRef.current = null;
      try {
        if (then) then();
      } finally {
        if (!currentRef.current && queueRef.current.length) setActive(queueRef.current.shift());
      }
    }, NEXT_TICK_MS);
  }, []);
  const gate = useGatedModal(!!current);
  const styles = useStyles();

  const api = useMemo(
    () => ({
      alert: (title, message, buttons) =>
        enqueue({
          kind: "alert",
          title,
          message,
          buttons: buttons && buttons.length ? buttons : [{ text: "OK" }],
        }),
      prompt: ({ title, message, defaultValue = "", placeholder = "", confirmText = "OK", onSubmit }) =>
        enqueue({ kind: "prompt", title, message, defaultValue, placeholder, confirmText, onSubmit }),
    }),
    [enqueue]
  );

  const dismiss = () => {
    if (!current) return;
    if (current.kind === "alert") {
      const cancel = current.buttons.find((b) => b.style === "cancel");
      close(cancel && cancel.onPress ? cancel.onPress : undefined);
    } else {
      close();
    }
  };

  const stacked = current && current.kind === "alert" && current.buttons.length >= 3;
  // Index of the button drawn filled in a row: the last one that isn't "cancel".
  const primaryIndex = current && current.kind === "alert"
    ? current.buttons.reduce((found, b, i) => (b.style === "cancel" ? found : i), -1)
    : -1;
  // Stacked: choices first, Cancel last.
  const ordered = current && current.kind === "alert"
    ? (stacked
        ? [...current.buttons.filter((b) => b.style !== "cancel"), ...current.buttons.filter((b) => b.style === "cancel")]
        : current.buttons)
    : [];

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal
        visible={gate.shown}
        transparent
        animationType="fade"
        onRequestClose={dismiss}
        onDismiss={gate.onDismiss}
      >
        <View style={styles.root}>
          <Pressable style={styles.backdrop} onPress={dismiss} accessibilityLabel="Dismiss dialog" />
          {current ? (
            <View style={styles.card} accessibilityViewIsModal>
              <AppText variant="heading" accessibilityRole="header">{current.title}</AppText>
              {current.message ? <AppText variant="body" tone="muted" style={styles.message}>{current.message}</AppText> : null}
              {current.kind === "prompt" ? (
                <PromptBody key={current.id} dialog={current} onClose={close} />
              ) : (
                <View style={stacked ? styles.buttonsStacked : styles.buttonsRow}>
                  {ordered.map((b, i) => (
                    <DialogButton
                      key={i}
                      text={b.text}
                      style={b.style}
                      stacked={stacked}
                      primary={current.buttons.indexOf(b) === primaryIndex}
                      onPress={() => close(b.onPress)}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : null}
        </View>
      </Modal>
    </DialogContext.Provider>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: t.colors.overlay },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: spacing.xl,
    backgroundColor: t.colors.surface,
    borderRadius: radius.xl,
    ...elevation(t, 2),
  },
  message: { marginTop: spacing.sm },
  input: { marginTop: spacing.lg },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  buttonsStacked: { marginTop: spacing.lg, alignSelf: "stretch", gap: spacing.xs },
}));

export default DialogProvider;
