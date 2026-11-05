import { Pressable, StyleSheet, Text, View } from "react-native";
import AppModal from "../AppModal";
import { colors, spacing } from "../../theme";

// groups: Array<{ label, entries }>
const EntryPickerModal = ({ visible, groups, onSelect, onClose }) => {
  const total = groups.reduce((n, g) => n + g.entries.length, 0);
  return (
    <AppModal visible={visible} onClose={onClose} title={"Swap with…"}>
      {total === 0 ? <Text style={styles.empty}>No other recipes on the menu to swap with.</Text> : null}
      {groups.map((group) =>
        group.entries.length === 0 ? null : (
          <View key={group.key}>
            <Text style={styles.group}>{group.label}</Text>
            {group.entries.map((entry) => (
              <Pressable key={entry.id} style={styles.row} onPress={() => onSelect(entry)} accessibilityRole="button">
                <Text style={styles.text}>{entry.recipe.name}</Text>
              </Pressable>
            ))}
          </View>
        )
      )}
    </AppModal>
  );
};

const styles = StyleSheet.create({
  empty: { color: colors.muted },
  group: { fontSize: 13, fontWeight: "bold", color: colors.muted, textTransform: "uppercase", marginTop: spacing.md },
  row: { minHeight: 44, justifyContent: "center", borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.sm },
  text: { fontSize: 16, color: colors.text },
});

export default EntryPickerModal;
