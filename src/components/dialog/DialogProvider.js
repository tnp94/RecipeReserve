import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing } from "../../theme";

const DialogContext = createContext(null);

// After a dialog closes, its button's onPress (which may open another dialog or an
// AppModal) runs only once the Modal is really gone. iOS cannot present a Modal while
// another one is still dismissing (the fade takes ~300 ms), so there we wait for the
// Modal's onDismiss, with a fallback timer in case it never fires. Elsewhere a short
// tick is enough.
const NEXT_TICK_MS = 50;
const IOS_DISMISS_FALLBACK_MS = 600;
const WAIT_FOR_DISMISS = Platform.OS === "ios";

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used inside <DialogProvider>");
  return ctx;
}

const PromptBody = ({ dialog, onClose }) => {
  const [text, setText] = useState(dialog.defaultValue ?? "");
  const trimmed = text.trim();
  const canConfirm = trimmed.length > 0;
  const confirm = () => {
    if (canConfirm) onClose(() => dialog.onSubmit && dialog.onSubmit(trimmed));
  };
  return (
    <>
      <TextInput
        autoFocus
        value={text}
        onChangeText={setText}
        placeholder={dialog.placeholder}
        onSubmitEditing={confirm}
        returnKeyType="done"
        selectTextOnFocus
        style={styles.input}
      />
      <View style={styles.buttonsRow}>
        <DialogButton text="Cancel" style="cancel" onPress={() => onClose()} />
        <DialogButton text={dialog.confirmText ?? "OK"} disabled={!canConfirm} onPress={confirm} />
      </View>
    </>
  );
};

const DialogButton = ({ text, style, disabled, onPress, stacked }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    style={[styles.button, stacked && styles.buttonStacked, disabled && styles.buttonDisabled]}
  >
    <Text
      style={[
        styles.buttonText,
        style === "destructive" && styles.destructiveText,
        style === "cancel" && styles.cancelText,
      ]}
    >
      {text}
    </Text>
  </Pressable>
);

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

  const afterClose = useRef(null); // pending hand-off: runs `then`, then the queue
  const fallbackTimer = useRef(null);

  const runAfterClose = useCallback(() => {
    clearTimeout(fallbackTimer.current);
    const run = afterClose.current;
    afterClose.current = null;
    if (run) run();
  }, []);

  // Close the visible dialog; once it is gone run `then` (which may open another
  // dialog or a sheet) and finally show the next queued dialog, if any.
  const close = useCallback((then) => {
    setCurrent(null); // hides the Modal; currentRef stays set so new calls queue
    afterClose.current = () => {
      currentRef.current = null;
      try {
        if (then) then();
      } finally {
        if (!currentRef.current && queueRef.current.length) setActive(queueRef.current.shift());
      }
    };
    fallbackTimer.current = setTimeout(runAfterClose, WAIT_FOR_DISMISS ? IOS_DISMISS_FALLBACK_MS : NEXT_TICK_MS);
  }, [runAfterClose]);

  useEffect(() => () => clearTimeout(fallbackTimer.current), []);

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

  return (
    <DialogContext.Provider value={api}>
      {children}
      <Modal
        visible={!!current}
        transparent
        animationType="fade"
        onRequestClose={dismiss}
        onDismiss={WAIT_FOR_DISMISS ? runAfterClose : undefined}
      >
        <View style={styles.root}>
          <Pressable style={styles.backdrop} onPress={dismiss} accessibilityLabel="Dismiss dialog" />
          {current ? (
            <View style={styles.card} accessibilityViewIsModal>
              <Text style={styles.title}>{current.title}</Text>
              {current.message ? <Text style={styles.message}>{current.message}</Text> : null}
              {current.kind === "prompt" ? (
                <PromptBody key={current.id} dialog={current} onClose={close} />
              ) : (
                <View style={stacked ? styles.buttonsStacked : styles.buttonsRow}>
                  {current.buttons.map((b, i) => (
                    <DialogButton
                      key={i}
                      text={b.text}
                      style={b.style}
                      stacked={stacked}
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

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  title: { fontSize: 18, fontWeight: "bold", color: colors.text },
  message: { marginTop: spacing.sm, fontSize: 15, color: colors.text },
  input: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  buttonsStacked: { marginTop: spacing.lg, alignSelf: "stretch" },
  button: { minHeight: 44, paddingHorizontal: spacing.md, justifyContent: "center", alignItems: "center" },
  buttonStacked: { width: "100%", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { fontSize: 16, color: colors.accentStrong },
  cancelText: { fontWeight: "bold" },
  destructiveText: { color: colors.danger },
});

export default DialogProvider;
