import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../theme";
import MenuEntryRow from "./MenuEntryRow";

const MenuSlot = ({ slot, onRename, onMenu, onEntryPress, onEntryRemove }) => (
  <View style={styles.slot}>
    <View style={styles.header}>
      <Pressable style={styles.nameButton} onPress={onRename} accessibilityRole="button" accessibilityLabel={`Rename ${slot.name}`}>
        <Text style={styles.name} numberOfLines={1}>{slot.name}</Text>
      </Pressable>
      <Pressable style={styles.more} onPress={onMenu} accessibilityRole="button" accessibilityLabel={`${slot.name} options`}>
        <Text style={styles.moreText}>{"⋯"}</Text>
      </Pressable>
    </View>
    {slot.entries.length === 0 ? (
      <Text style={styles.empty}>Nothing planned</Text>
    ) : (
      slot.entries.map((entry) => (
        <MenuEntryRow
          key={entry.id}
          entry={entry}
          onPress={() => onEntryPress(entry)}
          onRemove={() => onEntryRemove(entry)}
        />
      ))
    )}
  </View>
);

const styles = StyleSheet.create({
  slot: { marginTop: spacing.sm },
  header: { flexDirection: "row", alignItems: "center", minHeight: 44 },
  nameButton: { flex: 1, minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.md },
  name: { fontSize: 15, fontWeight: "bold", color: colors.muted, textTransform: "uppercase" },
  more: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" },
  moreText: { fontSize: 22, color: colors.muted },
  empty: { color: colors.muted, fontStyle: "italic", paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
});

export default MenuSlot;
