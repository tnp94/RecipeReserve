import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { colors, radius, spacing } from "../../theme";

const MenuEntryRow = ({ entry, onPress, onRemove }) => {
  const renderRightActions = () => (
    <Pressable
      style={styles.removeAction}
      onPress={onRemove}
      accessibilityRole="button"
      accessibilityLabel={`Remove ${entry.recipe.name}`}
    >
      <Text style={styles.removeText}>Remove</Text>
    </Pressable>
  );
  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <Pressable
        style={styles.row}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Options for ${entry.recipe.name}`}
      >
        <Text style={styles.name} numberOfLines={2}>{entry.recipe.name}</Text>
        {entry.scale !== 1 ? (
          <View style={styles.badge}><Text style={styles.badgeText}>{`×${entry.scale}`}</Text></View>
        ) : null}
        {Platform.OS === "web" ? <Text style={styles.more}>{"⋯"}</Text> : null}
      </Pressable>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: { flex: 1, fontSize: 16, color: colors.text },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  badgeText: { fontSize: 13, fontWeight: "bold", color: colors.text },
  more: { fontSize: 22, color: colors.muted, paddingHorizontal: spacing.sm },
  removeAction: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.danger,
    justifyContent: "center",
  },
  removeText: { color: "#fff", fontWeight: "bold" },
});

export default MenuEntryRow;
