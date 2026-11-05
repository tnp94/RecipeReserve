import { memo, useEffect, useRef } from "react";
import { Platform, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText, IconButton, TextField } from "../ui";
import { CATEGORY_ICONS } from "../CategoryPicker";
import { makeStyles, radius, spacing, useTheme } from "../../theme";

// One ingredient in the recipe form: name, amount, unit, note and store category.
// Return moves through the fields; on the last one it goes to (or adds) the next
// ingredient, so a list can be typed without touching the screen.
//
// compact (phones): name on its own line so long names stay readable.
//   [ name                    ][trash]
//   [qty][unit][   category   ]
//   [ note                       ]
// wide:
//   [qty][unit][ name            ][trash]
//   [ note               ][category]
const IngredientEditor = ({ item, index, compact, autoFocus, focusNonce, onChange, onRemove, onPickCategory, onSubmitLast }) => {
  const theme = useTheme();
  const styles = useStyles();
  const refs = { name: useRef(null), quantityUnit: useRef(null), unit: useRef(null), note: useRef(null) };
  const order = compact ? ["name", "quantityUnit", "unit", "note"] : ["quantityUnit", "unit", "name", "note"];

  // Focus requests for a row that is already on screen (autoFocus only works on mount).
  useEffect(() => {
    if (focusNonce) refs[order[0]].current?.focus();
  }, [focusNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const field = (name, props) => {
    const at = order.indexOf(name);
    const isLast = at === order.length - 1;
    return (
      <TextField
        ref={refs[name]}
        value={String(item[name] ?? "")}
        onChangeText={(t) => onChange(item._key, name, t)}
        autoFocus={autoFocus && at === 0}
        returnKeyType="next"
        blurOnSubmit={false}
        onSubmitEditing={() => (isLast ? onSubmitLast(item._key) : refs[order[at + 1]].current?.focus())}
        {...props}
      />
    );
  };

  const nameField = field("name", { style: styles.grow, placeholder: "Ingredient", accessibilityLabel: `Ingredient ${index + 1} name` });
  const qtyField = field("quantityUnit", { style: styles.qty, placeholder: "Qty", accessibilityLabel: `Ingredient ${index + 1} amount` });
  const unitField = field("unit", { style: styles.unit, placeholder: "Unit", autoCapitalize: "none", accessibilityLabel: `Ingredient ${index + 1} unit` });
  const noteField = field("note", { style: styles.grow, placeholder: "Note (e.g. chopped)", accessibilityLabel: `Ingredient ${index + 1} note` });
  const removeButton = (
    <IconButton icon="trash-outline" size={20} accessibilityLabel={`Remove ingredient ${index + 1}`} onPress={() => onRemove(item._key)} />
  );

  const category = item.category;
  const guessed = item._autoCategory && !!category;
  const categoryButton = (
    <Pressable
      onPress={() => onPickCategory(item._key)}
      accessibilityRole="button"
      accessibilityLabel={`Category: ${category || "none"}${guessed ? " (guessed)" : ""}. Change`}
      style={({ pressed, hovered }) => [
        styles.category,
        compact && styles.grow,
        !category && styles.categoryEmpty,
        (pressed || hovered) && styles.categoryPressed,
      ]}
    >
      <Ionicons
        name={category ? CATEGORY_ICONS[category] ?? "pricetag-outline" : "pricetag-outline"}
        size={16}
        color={category ? theme.colors.onPrimarySoft : theme.colors.textSubtle}
      />
      <AppText
        variant="smallStrong"
        style={[styles.categoryText, { color: category ? theme.colors.onPrimarySoft : theme.colors.textSubtle }]}
        numberOfLines={1}
      >
        {category || "Category"}
      </AppText>
      {guessed ? (
        <Ionicons name="sparkles" size={12} color={theme.colors.onPrimarySoft} />
      ) : (
        <Ionicons name="chevron-down" size={14} color={theme.colors.textSubtle} />
      )}
    </Pressable>
  );

  if (compact) {
    return (
      <View style={styles.box}>
        <View style={styles.line}>
          {nameField}
          {removeButton}
        </View>
        <View style={styles.line}>
          {qtyField}
          {unitField}
          {categoryButton}
        </View>
        {noteField}
      </View>
    );
  }
  return (
    <View style={styles.box}>
      <View style={styles.line}>
        {qtyField}
        {unitField}
        {nameField}
        {removeButton}
      </View>
      <View style={[styles.line, styles.wideSecond]}>
        {noteField}
        {categoryButton}
      </View>
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  box: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  line: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  wideSecond: { marginRight: 44 + spacing.sm },
  grow: { flex: 1, minWidth: 0 },
  qty: { width: 72 },
  unit: { width: 84 },
  category: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    minWidth: 130,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: t.colors.primarySoft,
    ...(Platform.OS === "web" ? { cursor: "pointer" } : null),
  },
  categoryText: { flexShrink: 1 },
  categoryEmpty: { backgroundColor: t.colors.surfaceAlt },
  categoryPressed: { opacity: 0.8 },
}));

export default memo(IngredientEditor);
