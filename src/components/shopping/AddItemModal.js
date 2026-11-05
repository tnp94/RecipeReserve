import { useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { useDispatch, useSelector, useStore } from "react-redux";
import AppModal from "../AppModal";
import CategoryPicker from "../CategoryPicker";
import { AppText, Button, TextField } from "../ui";
import { makeStyles, spacing } from "../../theme";
import { addManualItem } from "../../store/shoppingListSlice";
import { selectIsStaple } from "../../store/pantrySlice";
import { selectAllRecipes } from "../../store/recipesSlice";
import { buildCategoryMemory, guessCategory } from "../../domain/categoryGuess";

// Add something that isn't in a recipe (S-5). The category is guessed from the name until
// the user picks one. Return on the name adds the item and keeps the sheet open for the
// next one; "Add" adds and closes.
const AddItemModal = ({ visible, onClose }) => {
  const dispatch = useDispatch();
  const store = useStore();
  const styles = useStyles();
  const recipes = useSelector(selectAllRecipes);
  const memory = useMemo(() => buildCategoryMemory(recipes), [recipes]);
  const [name, setName] = useState("");
  const [quantityText, setQuantityText] = useState("");
  const [unit, setUnit] = useState("");
  const [pickedCategory, setPickedCategory] = useState(null); // null = guess
  const [lastAdded, setLastAdded] = useState("");
  const nameRef = useRef(null);
  const quantityRef = useRef(null);
  const unitRef = useRef(null);

  const category = pickedCategory ?? guessCategory(name, memory);
  const canAdd = name.trim().length > 0;

  const reset = () => {
    setName("");
    setQuantityText("");
    setUnit("");
    setPickedCategory(null);
  };
  const close = () => {
    reset();
    setLastAdded("");
    onClose();
  };

  const add = ({ keepOpen }) => {
    if (!canAdd) return;
    const trimmed = name.trim();
    const isStaple = selectIsStaple(store.getState(), trimmed);
    dispatch(addManualItem({ name: trimmed, quantityText: quantityText.trim(), unit: unit.trim(), category, isStaple }));
    if (keepOpen) {
      reset();
      setLastAdded(trimmed);
      nameRef.current?.focus();
    } else {
      close();
    }
  };

  const footer = (
    <>
      <Button label="Done" variant="secondary" onPress={close} />
      <Button label="Add" icon="add" onPress={() => add({ keepOpen: false })} disabled={!canAdd} />
    </>
  );

  return (
    <AppModal visible={visible} onClose={close} title="Add item" footer={footer}>
      <TextField
        ref={nameRef}
        label="Item"
        value={name}
        onChangeText={(t) => {
          setName(t);
          setLastAdded("");
        }}
        placeholder="e.g. Paper towels"
        autoFocus
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => (canAdd ? add({ keepOpen: true }) : null)}
        helper={lastAdded ? `Added ${lastAdded}. Type the next item, or tap Done.` : "Press return to add it and keep going."}
      />
      <View style={styles.row}>
        <TextField
          ref={quantityRef}
          style={styles.flex}
          label="Quantity"
          value={quantityText}
          onChangeText={setQuantityText}
          placeholder="e.g. 2"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => unitRef.current?.focus()}
        />
        <TextField
          ref={unitRef}
          style={styles.flex}
          label="Unit"
          value={unit}
          onChangeText={setUnit}
          placeholder="e.g. rolls"
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={() => add({ keepOpen: false })}
        />
      </View>
      <View style={styles.categoryLabel}>
        <AppText variant="smallStrong" tone="muted">Aisle</AppText>
        {pickedCategory === null && category ? <AppText variant="caption" tone="subtle">guessed from the name</AppText> : null}
      </View>
      <CategoryPicker value={category} onChange={(c) => setPickedCategory(c)} />
    </AppModal>
  );
};

const useStyles = makeStyles(() => ({
  flex: { flex: 1 },
  row: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  categoryLabel: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.xs },
}));

export default AddItemModal;
