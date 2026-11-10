import { KEYBOARD_DISMISS_MODE } from "./keyboard";
import { useEffect, useState } from "react";
import { Keyboard, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { elevation, makeStyles, radius, spacing } from "../theme";
import useLayout from "../hooks/useLayout";
import { useGatedModal } from "./modalGate";
import AppText from "./ui/AppText";
import IconButton from "./ui/IconButton";

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

// Bottom sheet on phones, centred dialog on wide screens.
const AppModal = ({ visible, onClose, title, subtitle, footer, children }) => {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
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
  // A sheet that sits on the bottom edge keeps its content above the home indicator.
  const bottomInset = !isWide && keyboardPad === 0 ? insets.bottom : 0;
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
        <View
          style={[styles.card, isWide ? styles.cardWide : styles.cardNarrow, { maxHeight, paddingBottom: bottomInset }]}
          accessibilityViewIsModal
        >
          {!isWide ? <View style={styles.grabber} /> : null}
          <View style={styles.header}>
            <View style={styles.titleBox}>
              <AppText variant="heading" numberOfLines={2} accessibilityRole="header">{title}</AppText>
              {subtitle ? <AppText variant="small" tone="muted" numberOfLines={2}>{subtitle}</AppText> : null}
            </View>
            <IconButton icon="close" onPress={onClose} accessibilityLabel="Close" tone="muted" />
          </View>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={KEYBOARD_DISMISS_MODE}
          >
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
};

const useStyles = makeStyles((t) => ({
  root: { flex: 1 },
  rootNarrow: { justifyContent: "flex-end" },
  rootWide: { justifyContent: "center", alignItems: "center", padding: spacing.xl },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: t.colors.overlay },
  card: { backgroundColor: t.colors.surface, overflow: "hidden", ...elevation(t, 2) },
  cardNarrow: {
    width: "100%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  cardWide: { width: "100%", maxWidth: 560, borderRadius: radius.xl },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: t.colors.borderStrong,
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  titleBox: { flex: 1, paddingVertical: spacing.xs },
  body: { flexGrow: 0, flexShrink: 1 },
  bodyContent: { padding: spacing.lg },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
}));

export default AppModal;
