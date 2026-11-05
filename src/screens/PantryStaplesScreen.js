import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import useLayout from "../hooks/useLayout";
import { colors, radius, spacing } from "../theme";
import { addStaple, removeStaple, selectStaplesList } from "../store/pantrySlice";

const PantryStaplesScreen = () => {
  const dispatch = useDispatch();
  const { isWide } = useLayout();
  const staples = useSelector(selectStaplesList);
  const [text, setText] = useState("");

  const add = () => {
    if (!text.trim()) return;
    dispatch(addStaple(text));
    setText("");
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.content, isWide && styles.contentWide]}>
        <Text style={styles.intro}>
          Pantry staples are things you usually have. When you generate a shopping list they're added already checked off.
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Add a staple, e.g. salt"
            onSubmitEditing={add}
            blurOnSubmit={false}
            accessibilityLabel="Staple name"
          />
          <Pressable onPress={add} accessibilityRole="button" style={styles.addButton}>
            <Text style={styles.addText}>Add</Text>
          </Pressable>
        </View>
        <FlatList
          data={staples}
          keyExtractor={(s) => s.nameKey}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<Text style={styles.empty}>No pantry staples yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.name}>{item.name}</Text>
              <Pressable
                onPress={() => dispatch(removeStaple(item.nameKey))}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.name}`}
                style={styles.removeButton}
              >
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, width: "100%", padding: spacing.lg },
  contentWide: { maxWidth: 720, alignSelf: "center" },
  intro: { color: colors.muted, fontSize: 14, marginBottom: spacing.md },
  inputRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  input: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface,
    paddingHorizontal: spacing.md, minHeight: 44, fontSize: 16, color: colors.text,
  },
  addButton: { minHeight: 44, paddingHorizontal: spacing.lg, justifyContent: "center", borderRadius: radius.sm, backgroundColor: colors.accentStrong },
  addText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 48, backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  name: { flex: 1, fontSize: 16, color: colors.text },
  removeButton: { minHeight: 44, justifyContent: "center", paddingLeft: spacing.md },
  removeText: { color: colors.danger, fontSize: 15 },
  separator: { height: 1, backgroundColor: colors.border },
  empty: { textAlign: "center", color: colors.muted, padding: spacing.xl },
});

export default PantryStaplesScreen;
