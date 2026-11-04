import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../theme";
import useLayout from "../hooks/useLayout";

const AppModal = ({ visible, onClose, title, footer, children }) => {
  const { isWide } = useLayout();
  return (
    <Modal visible={!!visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.root, isWide ? styles.rootWide : styles.rootNarrow]}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close dialog" />
        <View style={[styles.card, isWide ? styles.cardWide : styles.cardNarrow]}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>{title}</Text>
            <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8} style={styles.closeButton}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
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
    maxHeight: "85%",
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  cardWide: { width: "100%", maxWidth: 560, maxHeight: "85%", borderRadius: radius.lg },
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
  body: { flexGrow: 0 },
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
