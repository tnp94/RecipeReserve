import { useMemo, useState } from "react";
import { View } from "react-native";
import AppModal from "../AppModal";
import { AppText, Button, TextField } from "../ui";
import { parseDirections, parseIngredientList } from "../../domain/ingredientParse";
import { formatAmount } from "../../domain/quantity";
import { makeStyles, radius, spacing } from "../../theme";

const PREVIEW = 6;

// Paste a whole ingredient list (or method) copied from a website, note or message.
// Shows what will be added before adding it.
const PasteModal = ({ visible, kind, onClose, onAdd }) => {
  const styles = useStyles();
  const [text, setText] = useState("");
  const isIngredients = kind === "ingredients";
  const parsed = useMemo(
    () => (isIngredients ? parseIngredientList(text) : parseDirections(text)),
    [text, isIngredients]
  );
  const noun = isIngredients ? "ingredient" : "step";
  const close = () => {
    setText("");
    onClose();
  };
  const add = () => {
    if (parsed.length === 0) return;
    onAdd(parsed);
    setText("");
  };
  return (
    <AppModal
      visible={visible}
      onClose={close}
      title={isIngredients ? "Paste ingredients" : "Paste directions"}
      subtitle={isIngredients ? "One ingredient per line, e.g. “2 cups flour, sifted”" : "One step per line. Numbering is removed."}
      footer={
        <>
          <Button label="Cancel" variant="secondary" onPress={close} />
          <Button
            label={parsed.length > 0 ? `Add ${parsed.length} ${noun}${parsed.length === 1 ? "" : "s"}` : "Add"}
            disabled={parsed.length === 0}
            onPress={add}
          />
        </>
      }
    >
      <TextField
        value={text}
        onChangeText={setText}
        multiline
        autoFocus
        placeholder={isIngredients ? "2 cups flour\n1 onion, chopped\n3 cloves garlic, minced" : "1. Preheat the oven to 400°F.\n2. Chop the vegetables."}
        accessibilityLabel={isIngredients ? "Ingredient list" : "Directions"}
        inputStyle={styles.input}
        autoCorrect={false}
      />
      {parsed.length > 0 ? (
        <View style={styles.preview}>
          <AppText variant="overline" tone="muted">Preview</AppText>
          {parsed.slice(0, PREVIEW).map((item, i) =>
            isIngredients ? (
              <AppText key={i} variant="small" numberOfLines={1}>
                {formatAmount(item.quantityUnit, item.unit) ? (
                  <AppText variant="smallStrong">{`${formatAmount(item.quantityUnit, item.unit)} `}</AppText>
                ) : null}
                {item.name}
                {item.note ? <AppText variant="small" tone="muted">{` · ${item.note}`}</AppText> : null}
              </AppText>
            ) : (
              <AppText key={i} variant="small" numberOfLines={2}>{`${i + 1}. ${item}`}</AppText>
            )
          )}
          {parsed.length > PREVIEW ? (
            <AppText variant="small" tone="muted">{`and ${parsed.length - PREVIEW} more`}</AppText>
          ) : null}
          {isIngredients ? (
            <AppText variant="caption" tone="muted">You can fix anything after adding.</AppText>
          ) : null}
        </View>
      ) : null}
    </AppModal>
  );
};

const useStyles = makeStyles((t) => ({
  input: { minHeight: 160 },
  preview: {
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: t.colors.background,
  },
}));

export default PasteModal;
