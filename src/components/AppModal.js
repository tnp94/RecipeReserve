import { useEffect, useState } from "react";
import { Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme";
import useLayout from "../hooks/useLayout";
import { useGatedModal } from "./modalGate";

// A Modal is its own native window, so the app's layout never moves out of the way of
// the keyboard. Track the keyboard height ourselves and lift the sheet above it.
function useKeyboardHeight(active) {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (!active || Platform.OS === "web") return undefined;
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (e) => setHeight(e?.endCoordinates?.height ?? 0));
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
      setHeight(0);
    };
  }, [active]);
  return height;
}

const TOP_GAP = 48; // keep a strip of backdrop visible above the sheet

const AppModal = ({ visible, onClose, title, footer, children }) => {
  const { isWide, width: windowWidth, height: windowHeight } = useLayout();
  const { shown, onDismiss } = useGatedModal(!!visible);
  const keyboardHeight = useKeyboardHeight(shown);
  // Some platforms (e.g. Android adjustResize) already shrink the modal window for the
  // keyboard. Measure the space we actually have and only pad the part still covered.
  // Baseline = tallest root ever measured (the keyboard can only make it shorter), so a
  // status bar or a resize that lands before the keyboard event isn't mistaken for it.
  const [layout, setLayout] = useState({ height: null, baseline: 0 });
  // A rotation (or window resize) changes the full height, so start a fresh baseline.
  useEffect(() => setLayout({ height: null, baseline: 0 }), [windowWidth, windowHeight]);
  const rootHeight = layout.height;
  const alreadyShrunk = rootHeight == null ? 0 : Math.max(0, layout.baseline - rootHeight);
  const keyboardPad = Math.max(0, keyboardHeight - alreadyShrunk);
  const available = (rootHeight ?? windowHeight) - keyboardPad;
  // Numeric max height so the whole sheet (header, fields, footer) fits above the keyboard.
  const maxHeight = Math.max(200, Math.min(windowHeight * 0.85, available - TOP_GAP));
  return (
    <Modal visible={shown} transparent animationType="fade" onRequestClose={onClose} onDismiss={onDismiss}>
      <View
        style={[styles.root, isWide ? styles.rootWide : styles.rootNarrow, { paddingBottom: keyboardPad }]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          setLayout((prev) => ({ height: h, baseline: Math.max(prev.baseline, h) }));
        }}
      >
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close dialog" />
        <View style={[styles.card, isWide ? styles.cardWide : styles.cardNarrow, { maxHeight }]}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8} style={styles.closeButton}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          >
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  rootNarrow: { justifyContent: "flex-end" },
  rootWide: { justifyContent: "center", alignItems: "center" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  card: { backgroundColor: colors.surface, overflow: "hidden" },
  cardNarrow: {
    width: "100%",
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  cardWide: { width: "100%", maxWidth: 560, borderRadius: radius.lg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { flex: 1, fontSize: 18, fontWeight: "bold", color: colors.text },
  closeButton: { paddingLeft: spacing.md, minHeight: 32, justifyContent: "center" },
  closeText: { color: colors.accentStrong, fontSize: 16 },
  body: { flexGrow: 0, flexShrink: 1 },
  bodyContent: { padding: spacing.lg },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default AppModal;
