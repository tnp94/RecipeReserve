import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { StackActions } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useDispatch, useSelector, useStore } from "react-redux";
import { ingredientTemplate } from "../Models/Ingredient";
import {
  addRecipe,
  deleteRecipe,
  editRecipe,
  isRecipeNameTaken,
  selectAllRecipes,
  selectRecipeById,
} from "../store/recipesSlice";
import { useDialog } from "../components/dialog/DialogProvider";
import AppModal from "../components/AppModal";
import CategoryPicker from "../components/CategoryPicker";
import IngredientEditor from "../components/recipeForm/IngredientEditor";
import ImportRecipeModal from "../components/recipeForm/ImportRecipeModal";
import PasteModal from "../components/recipeForm/PasteModal";
import { AppText, Button, Card, HeaderButton, IconButton, SegmentedControl, TextField } from "../components/ui";
import { buildCategoryMemory, guessCategory } from "../domain/categoryGuess";
import { missingParts } from "../domain/recipeImport";
import { isScanAvailable } from "../services/recipeScan";
import useLayout from "../hooks/useLayout";
import { makeStyles, radius, spacing } from "../theme";

export const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const emptyRecipe = {
  id: 0,
  name: "",
  image: "",
  count: 0,
  ingredients: [],
  time: { prep: 0, active: 0 },
  difficulty: "",
  calories: 0,
  favorite: false,
  dishesAmount: "",
  yield: 0,
  directions: [],
};

// Form-only fields on ingredients and steps (stripped before saving):
//   _key           stable React key / identity while editing
//   _autoCategory  true while the category is ours to guess (the user hasn't picked one)
let keySeq = 0;
const nextKey = () => `k${++keySeq}`;

const isBlankIngredient = (i) => !["name", "quantityUnit", "unit", "note"].some((f) => String(i[f] ?? "").trim());

function toSaved(data) {
  const num = (v) => (v === "" || v == null || !Number.isFinite(Number(v)) ? 0 : Number(v));
  return {
    ...data,
    name: String(data.name ?? "").trim(),
    time: { ...data.time, prep: num(data.time?.prep), active: num(data.time?.active) },
    yield: num(data.yield),
    calories: num(data.calories),
    ingredients: data.ingredients
      .filter((i) => !isBlankIngredient(i))
      .map(({ _key, _autoCategory, ...rest }) => ({
        ...rest,
        name: String(rest.name ?? "").trim(),
        quantityUnit: String(rest.quantityUnit ?? "").trim(),
        unit: String(rest.unit ?? "").trim(),
        note: String(rest.note ?? "").trim(),
      })),
    directions: data.directions.map((d) => String(d.text ?? "").trim()).filter(Boolean),
  };
}

// Numeric field that keeps "" while typing (so the field can be cleared) and digits only.
const NumberField = ({ label, value, onChange, placeholder, suffix, style }) => (
  <TextField
    style={style}
    label={label}
    value={value === 0 || value == null ? "" : String(value)}
    onChangeText={(t) => {
      const digits = t.replace(/[^0-9]/g, "");
      onChange(digits === "" ? "" : Number(digits));
    }}
    inputMode="numeric"
    keyboardType="number-pad"
    placeholder={placeholder}
    right={suffix ? <AppText variant="small" tone="subtle" style={{ paddingRight: spacing.md }}>{suffix}</AppText> : null}
  />
);

const RecipeFormScreen = ({ navigation, route }) => {
  const recipeId = route.params?.recipeId;
  const isEditing = !!recipeId;
  const existingRecipe = useSelector((state) => (isEditing ? selectRecipeById(state, recipeId) : null));
  const allRecipes = useSelector(selectAllRecipes);
  const dispatch = useDispatch();
  const dialog = useDialog();
  const store = useStore();
  const styles = useStyles();
  const { isWide, width } = useLayout();
  const compact = width < 600;
  const headerHeight = useHeaderHeight();

  // Learned once per form: what category the user gave each ingredient before.
  const memory = useMemo(() => buildCategoryMemory(allRecipes), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [data, setData] = useState(() => {
    const base = isEditing ? { ...emptyRecipe, ...existingRecipe } : emptyRecipe;
    return {
      ...base,
      ingredients: (base.ingredients ?? []).map((i) => {
        const blank = !i.category;
        return { ...ingredientTemplate(), ...i, _key: nextKey(), _autoCategory: blank, category: blank ? guessCategory(i.name, memory) : i.category };
      }),
      directions: (base.directions ?? []).map((text) => ({ _key: nextKey(), text: String(text ?? "") })),
    };
  });
  const [nameError, setNameError] = useState("");
  // Which row's first field to focus; the nonce re-triggers focus on an existing row.
  const [focus, setFocus] = useState({ key: null, nonce: 0 });
  const setFocusKey = useCallback((key) => setFocus((f) => ({ key, nonce: f.nonce + 1 })), []);
  const focusKey = focus.key;
  const [categoryFor, setCategoryFor] = useState(null);
  const [pasting, setPasting] = useState(null); // "ingredients" | "directions" | null
  const [importing, setImporting] = useState(false);
  const [importedMissing, setImportedMissing] = useState(null); // null until a recipe is imported
  const [importedScan, setImportedScan] = useState(false);

  // Unsaved-changes guard: compare against the form as first shown.
  const initial = useRef(JSON.stringify(toSaved(data)));
  const dirty = JSON.stringify(toSaved(data)) !== initial.current;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const allowLeave = useRef(false);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (e) => {
        if (allowLeave.current || !dirtyRef.current) return;
        e.preventDefault();
        dialog.alert("Discard changes?", "Your changes to this recipe haven't been saved.", [
          { text: "Keep editing", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              allowLeave.current = true;
              navigation.dispatch(e.data.action);
            },
          },
        ]);
      }),
    [navigation, dialog]
  );

  const leave = (action) => {
    allowLeave.current = true;
    if (action) navigation.dispatch(action);
    else navigation.goBack();
  };

  const validName = () => {
    const name = String(data.name ?? "").trim();
    if (!name) {
      setNameError("Give the recipe a name.");
      dialog.alert("Recipe needs a name");
      return null;
    }
    return name;
  };

  const saveAsNew = () => {
    if (!validName()) return;
    const newId = store.getState().recipes.nextId;
    dispatch(addRecipe(toSaved(data)));
    leave(StackActions.replace("Recipe Details", { recipeId: newId }));
  };

  const save = () => {
    const name = validName();
    if (!name) return;
    if (!isEditing) {
      saveAsNew();
      return;
    }
    if (isRecipeNameTaken(store.getState(), name, recipeId)) {
      setNameError(`Another recipe is already named "${name}".`);
      dialog.alert("Name already used", `Another recipe is already named "${name}". Pick a different name, or save this as a new recipe.`);
      return;
    }
    dispatch(editRecipe({ id: recipeId, changes: toSaved(data) }));
    leave();
  };

  const confirmDelete = () =>
    dialog.alert(`Delete "${existingRecipe?.name}"?`, "It will also be removed from your menu. This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          allowLeave.current = true;
          navigation.popToTop();
          dispatch(deleteRecipe(recipeId));
        },
      },
    ]);

  const saveRef = useRef(save);
  saveRef.current = save;
  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? "Edit recipe" : "New recipe",
      headerRight: () => (
        <View style={{ marginRight: spacing.md }}>
          <HeaderButton label="Save" icon="checkmark" filled onPress={() => saveRef.current()} />
        </View>
      ),
    });
  }, [navigation, isEditing]);

  // ----- ingredients -----
  const updateIngredient = useCallback(
    (key, field, value) =>
      setData((d) => ({
        ...d,
        ingredients: d.ingredients.map((i) => {
          if (i._key !== key) return i;
          const next = { ...i, [field]: value };
          if (field === "name" && i._autoCategory) next.category = guessCategory(value, memory);
          return next;
        }),
      })),
    [memory]
  );
  const removeIngredient = useCallback(
    (key) => setData((d) => ({ ...d, ingredients: d.ingredients.filter((i) => i._key !== key) })),
    []
  );
  const addIngredient = useCallback(() => {
    const key = nextKey();
    setData((d) => ({ ...d, ingredients: [...d.ingredients, { ...ingredientTemplate(), _key: key, _autoCategory: true }] }));
    setFocusKey(key);
  }, [setFocusKey]);
  const ingredientsRef = useRef(data.ingredients);
  ingredientsRef.current = data.ingredients;
  // Return on an ingredient's last field: go to the next one, adding it if this was the last.
  const onSubmitLast = useCallback(
    (key) => {
      const list = ingredientsRef.current;
      const at = list.findIndex((i) => i._key === key);
      if (at === list.length - 1) addIngredient();
      else if (at >= 0) setFocusKey(list[at + 1]._key);
    },
    [addIngredient, setFocusKey]
  );
  const setCategory = (category) => {
    const key = categoryFor;
    setData((d) => ({
      ...d,
      ingredients: d.ingredients.map((i) => (i._key === key ? { ...i, category, _autoCategory: false } : i)),
    }));
    setCategoryFor(null);
  };
  const addPastedIngredients = (rows) => {
    setData((d) => ({
      ...d,
      // Pasting into a list of only blank rows replaces them.
      ingredients: [
        ...d.ingredients.filter((i) => !isBlankIngredient(i)),
        ...rows.map((r) => ({ ...ingredientTemplate(), ...r, category: guessCategory(r.name, memory), _key: nextKey(), _autoCategory: true })),
      ],
    }));
    setPasting(null);
  };

  // ----- directions -----
  const updateStep = (key, text) =>
    setData((d) => ({ ...d, directions: d.directions.map((s) => (s._key === key ? { ...s, text } : s)) }));
  const removeStep = (key) => setData((d) => ({ ...d, directions: d.directions.filter((s) => s._key !== key) }));
  const addStep = () => {
    const key = nextKey();
    setData((d) => ({ ...d, directions: [...d.directions, { _key: key, text: "" }] }));
    setFocusKey(key);
  };
  const addPastedSteps = (steps) => {
    setData((d) => ({
      ...d,
      directions: [...d.directions.filter((s) => s.text.trim()), ...steps.map((text) => ({ _key: nextKey(), text }))],
    }));
    setPasting(null);
  };

  // ----- import -----
  const applyDraft = (draft, scanned) => {
    // A name the user typed survives a draft with no name; one from an earlier import doesn't.
    const name = draft.name || (importedMissing ? "" : data.name);
    setNameError("");
    setImportedMissing(missingParts({ ...draft, name }));
    setImportedScan(!!scanned);
    setData((d) => ({
      ...d,
      name,
      time: { ...d.time, prep: draft.time.prep, active: draft.time.active },
      yield: draft.yield,
      calories: draft.calories,
      ingredients: draft.ingredients.map((r) => ({ ...ingredientTemplate(), ...r, category: guessCategory(r.name, memory), _key: nextKey(), _autoCategory: true })),
      directions: draft.directions.map((text) => ({ _key: nextKey(), text })),
    }));
  };
  const onImported = (draft, { scanned = false } = {}) => {
    setImporting(false);
    if (!dirty) {
      applyDraft(draft, scanned);
      return;
    }
    dialog.alert("Replace what you've entered?", "The imported recipe will replace the details, ingredients and directions in this form.", [
      { text: "Keep mine", style: "cancel" },
      { text: "Replace", style: "destructive", onPress: () => applyDraft(draft, scanned) },
    ]);
  };

  const difficultyOptions = DIFFICULTIES.map((v) => ({ value: v, label: v }));
  const difficultyValue = DIFFICULTIES.find((v) => v.toLowerCase() === String(data.difficulty ?? "").trim().toLowerCase()) ?? data.difficulty;
  // Keep an older free-text difficulty selectable instead of silently dropping it.
  if (difficultyValue && !DIFFICULTIES.includes(difficultyValue)) difficultyOptions.push({ value: difficultyValue, label: difficultyValue });

  const categoryItem = data.ingredients.find((i) => i._key === categoryFor);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}>
      <ScrollView
        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      >
        {!isEditing ? (
          <Card style={styles.section}>
            {importedMissing ? (
              <>
                <AppText variant="bodyStrong" accessibilityLiveRegion="polite">Recipe imported. Check it over, then save.</AppText>
                {importedMissing.length > 0 ? (
                  <AppText variant="small" tone="muted">{`We couldn't find: ${importedMissing.join(", ")}.`}</AppText>
                ) : null}
                {importedScan ? (
                  <AppText variant="small" tone="muted">Scans can misread amounts, so compare them with the page.</AppText>
                ) : null}
              </>
            ) : (
              <>
                <AppText variant="bodyStrong">Already have this recipe somewhere?</AppText>
                <AppText variant="small" tone="muted">Bring it in from a web link or pasted text {`instead of typing it${isScanAvailable() ? ", or scan a printed page" : ""}.`}</AppText>
              </>
            )}
            <Button
              label={importedMissing ? "Import a different recipe" : "Import a recipe"}
              icon="download-outline"
              variant={importedMissing ? "ghost" : "tonal"}
              onPress={() => setImporting(true)}
              style={styles.addButton}
            />
          </Card>
        ) : null}
        <Card style={styles.section}>
          <AppText variant="heading" style={styles.sectionTitle} accessibilityRole="header">Basics</AppText>
          <TextField
            label="Name"
            value={data.name}
            onChangeText={(text) => {
              setNameError("");
              setData((d) => ({ ...d, name: text }));
            }}
            placeholder="e.g. Weeknight chili"
            error={nameError}
            autoFocus={!isEditing}
            returnKeyType="done"
          />
          <View style={styles.field}>
            <AppText variant="smallStrong" tone="muted" style={styles.fieldLabel}>Difficulty</AppText>
            <SegmentedControl
              options={difficultyOptions}
              value={difficultyValue || null}
              allowDeselect
              accessibilityLabel="Difficulty"
              onChange={(v) => setData((d) => ({ ...d, difficulty: v ?? "" }))}
            />
          </View>
          <View style={[styles.field, styles.grid]}>
            <NumberField
              style={styles.gridItem}
              label="Prep time"
              suffix="min"
              placeholder="0"
              value={data.time?.prep}
              onChange={(v) => setData((d) => ({ ...d, time: { ...d.time, prep: v } }))}
            />
            <NumberField
              style={styles.gridItem}
              label="Cook time"
              suffix="min"
              placeholder="0"
              value={data.time?.active}
              onChange={(v) => setData((d) => ({ ...d, time: { ...d.time, active: v } }))}
            />
            <NumberField
              style={styles.gridItem}
              label="Serves"
              placeholder="—"
              value={data.yield}
              onChange={(v) => setData((d) => ({ ...d, yield: v }))}
            />
            <NumberField
              style={styles.gridItem}
              label="Calories"
              placeholder="—"
              value={data.calories}
              onChange={(v) => setData((d) => ({ ...d, calories: v }))}
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="heading" accessibilityRole="header" style={styles.flex}>Ingredients</AppText>
            <Button label="Paste list" icon="clipboard-outline" variant="ghost" size="sm" onPress={() => setPasting("ingredients")} />
          </View>
          {data.ingredients.length === 0 ? (
            <AppText variant="small" tone="muted">
              Add ingredients one by one, or paste a whole list. Categories are filled in for you.
            </AppText>
          ) : null}
          {data.ingredients.map((item, index) => (
            <IngredientEditor
              key={item._key}
              item={item}
              index={index}
              autoFocus={item._key === focusKey}
              focusNonce={item._key === focusKey ? focus.nonce : 0}
              compact={compact}
              onChange={updateIngredient}
              onRemove={removeIngredient}
              onPickCategory={setCategoryFor}
              onSubmitLast={onSubmitLast}
            />
          ))}
          <Button label="Add ingredient" icon="add" variant="tonal" onPress={addIngredient} style={styles.addButton} />
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="heading" accessibilityRole="header" style={styles.flex}>Directions</AppText>
            <Button label="Paste steps" icon="clipboard-outline" variant="ghost" size="sm" onPress={() => setPasting("directions")} />
          </View>
          {data.directions.map((step, index) => (
            <View key={step._key} style={styles.step}>
              <View style={styles.stepNumber}>
                <AppText variant="smallStrong" style={styles.stepNumberText}>{index + 1}</AppText>
              </View>
              <TextField
                style={styles.flex}
                value={step.text}
                onChangeText={(t) => updateStep(step._key, t)}
                placeholder="Describe this step"
                accessibilityLabel={`Step ${index + 1}`}
                autoFocus={step._key === focusKey}
                multiline
              />
              <IconButton icon="trash-outline" size={20} accessibilityLabel={`Remove step ${index + 1}`} onPress={() => removeStep(step._key)} />
            </View>
          ))}
          <Button label="Add step" icon="add" variant="tonal" onPress={addStep} style={styles.addButton} />
        </Card>

        {isEditing ? (
          <View style={styles.footer}>
            <Button label="Save as a new recipe" icon="copy-outline" variant="secondary" onPress={saveAsNew} />
            <Button label="Delete recipe" icon="trash-outline" variant="dangerGhost" onPress={confirmDelete} />
          </View>
        ) : (
          <View style={styles.footer}>
            <Button label="Save recipe" icon="checkmark" onPress={save} />
          </View>
        )}
      </ScrollView>

      <AppModal
        visible={!!categoryFor}
        onClose={() => setCategoryFor(null)}
        title="Store category"
        subtitle={categoryItem?.name ? `Where you find ${categoryItem.name} in the store` : "Groups the shopping list by aisle"}
      >
        <CategoryPicker value={categoryItem?.category ?? ""} onChange={setCategory} />
      </AppModal>
      <PasteModal
        visible={!!pasting}
        kind={pasting ?? "ingredients"}
        onClose={() => setPasting(null)}
        onAdd={pasting === "directions" ? addPastedSteps : addPastedIngredients}
      />
      <ImportRecipeModal visible={importing} onClose={() => setImporting(false)} onImport={onImported} />
    </KeyboardAvoidingView>
  );
};

const useStyles = makeStyles((t) => ({
  screen: { flex: 1, backgroundColor: t.colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  contentWide: { maxWidth: 800, width: "100%", alignSelf: "center" },
  section: { marginBottom: spacing.lg },
  sectionTitle: { marginBottom: spacing.md },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: spacing.xs },
  field: { marginTop: spacing.lg },
  fieldLabel: { marginBottom: spacing.xs },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  gridItem: { flexGrow: 1, flexBasis: 120 },
  addButton: { alignSelf: "flex-start", marginTop: spacing.md },
  step: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginTop: spacing.md },
  stepNumber: {
    width: 28,
    height: 28,
    marginTop: 8,
    borderRadius: radius.pill,
    backgroundColor: t.colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { color: t.colors.onPrimarySoft },
  footer: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "space-between" },
}));

export default RecipeFormScreen;
