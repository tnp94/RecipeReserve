import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useDispatch, useStore } from "react-redux";
import AppModal from "../AppModal";
import CategoryPicker from "../CategoryPicker";
import { colors, radius, spacing } from "../../theme";
import { addManualItem } from "../../store/shoppingListSlice";
import { selectStapleKeys } from "../../store/pantrySlice";
import { normalizeName } from "../../domain/ingredientKey";

const AddItemModal = ({ visible, onClose }) => {
  const dispatch = useDispatch();
  const store = useStore();
  const [name, setName] = useState("");
  const [quantityText, setQuantityText] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");

  const canAdd = name.trim().length > 0;

  const close = () => {
    setName("");
    setQuantityText("");
    setUnit("");
    setCategory("");
    onClose();
  };

  const add = () => {
    if (!canAdd) return;
    const isStaple = selectStapleKeys(store.getState()).has(normalizeName(name));
    dispatch(addManualItem({ name: name.trim(), quantityText: quantityText.trim(), unit: unit.trim(), category, isStaple }));
    close();
  };

  const footer = (
    <>
      <Pressable onPress={close} style={styles.button} accessibilityRole="button">
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
      <Pressable
        onPress={add}
        disabled={!canAdd}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canAdd }}
        style={[styles.button, styles.addButton, !canAdd && styles.disabled]}
      >
        <Text style={styles.addText}>Add</Text>
      </Pressable>
    </>
  );

  return (
    <AppModal visible={visible} onClose={close} title="Add item" footer={footer}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Paper towels"
        autoFocus
        onSubmitEditing={add}
        accessibilityLabel="Item name"
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput style={styles.input} value={quantityText} onChangeText={setQuantityText} placeholder="e.g. 2" accessibilityLabel="Item quantity" />
        </View>
        <View style={styles.flex}>
          <Text style={styles.label}>Unit</Text>
          <TextInput style={styles.input} value={unit} onChangeText={setUnit} placeholder="e.g. lb" accessibilityLabel="Item unit" />
        </View>
      </View>
      <Text style={styles.label}>Category</Text>
      <CategoryPicker value={category} onChange={setCategory} />
    </AppModal>
  );
};

const styles = StyleSheet.create({
  label: { color: colors.muted, fontSize: 13, marginTop: spacing.md, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
    minHeight: 40,
  },
  row: { flexDirection: "row", gap: spacing.md },
  flex: { flex: 1 },
  button: { minHeight: 40, paddingHorizontal: spacing.lg, justifyContent: "center", borderRadius: radius.sm },
  cancelText: { color: colors.text, fontSize: 16, fontWeight: "bold" },
  addButton: { backgroundColor: colors.accentStrong },
  addText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  disabled: { opacity: 0.4 },
});

export default AddItemModal;
