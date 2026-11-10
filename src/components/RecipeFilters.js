import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, Platform, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Chip from "./Chip";
import { AppText, Button, Card, TextField } from "./ui";
import { DIFFICULTY_LEVELS, activeFilterCount, effectiveTotalLimit, filterSummary } from "../domain/recipeSearch";
import { formatMinutes } from "../domain/format";
import { makeStyles, spacing, useTheme } from "../theme";

// Minutes limit: digits only, "" (no limit) -> null.
// The typed value is applied when editing ends (Done/return, leaving the field, or the panel
// closing), not on every keystroke: the field lives in the recipe list's header, and changing
// the list under a focused field can drop the keyboard on phones.
const LimitField = ({ label, value, onChange, style, inputStyle, accessibilityHint, clearCount }) => {
  const shown = value == null ? "" : String(value);
  const [draft, setDraft] = useState(shown);
  const draftRef = useRef(shown);
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };

  // Follow changes made elsewhere (Clear, or this field's own value once applied).
  useEffect(() => {
    draftRef.current = shown;
    setDraft(shown);
  }, [shown, clearCount]);

  const commit = useCallback(() => {
    const next = draftRef.current === "" ? null : Number(draftRef.current);
    if (next !== latest.current.value) latest.current.onChange(next);
  }, []);
  useEffect(() => commit, [commit]); // panel closed while typing

  return (
    <TextField
      style={style}
      inputStyle={inputStyle}
      accessibilityHint={accessibilityHint}
      label={label}
      value={draft}
      onChangeText={(t) => {
        const digits = t.replace(/[^0-9]/g, "");
        draftRef.current = digits;
        setDraft(digits);
      }}
      onBlur={commit}
      onSubmitEditing={commit}
      returnKeyType="done"
      inputMode="numeric"
      keyboardType="number-pad"
      placeholder="Any"
      right={<AppText variant="small" tone="subtle" style={{ paddingRight: spacing.md }}>min</AppText>}
    />
  );
};

// The recipe list's filter bar: Favorites, a "Filters" dropdown (total time limit and
// difficulty, plus an Advanced section with separate prep and cook limits), and the
// result count. `filters` is NO_FILTERS-shaped; `onChange(patch)` merges into it.
const RecipeFilters = ({ filters, onChange, onClear, shown, unknown = 0, total }) => {
  const theme = useTheme();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const hasAdvanced = filters.maxPrep != null || filters.maxActive != null;
  const [advancedOpen, setAdvancedOpen] = useState(hasAdvanced);
  const count = activeFilterCount(filters);
  const summary = filterSummary(filters);
  const anyOn = count > 0 || filters.favoritesOnly;
  // While prep + cook (Advanced) adds up to more than the typed total, that sum is used instead.
  const totalLimit = effectiveTotalLimit(filters);
  const overrideText = totalLimit.overridden
    ? `Prep + cook add up to ${formatMinutes(totalLimit.limit)}, so that's used for now. Lower them to ${formatMinutes(totalLimit.typed) || "0 min"} or less to use this total.`
    : "";

  // Closing ends any typing first, so a limit being typed is applied (see LimitField).
  const close = () => {
    Keyboard.dismiss();
    setOpen(false);
  };
  // Bumped by Clear so fields drop a typed value that hasn't been applied yet.
  const [clearCount, setClearCount] = useState(0);
  const clear = () => {
    setClearCount((c) => c + 1);
    onClear();
  };

  const toggleDifficulty = (level) => {
    const list = filters.difficulties;
    onChange({ difficulties: list.includes(level) ? list.filter((l) => l !== level) : [...list, level] });
  };

  return (
    <View>
      <View style={styles.bar}>
        <Chip
          label="Favorites"
          icon={filters.favoritesOnly ? "star" : "star-outline"}
          selected={filters.favoritesOnly}
          onPress={() => onChange({ favoritesOnly: !filters.favoritesOnly })}
        />
        <Chip
          label={count > 0 ? `Filters · ${count}` : "Filters"}
          icon="options-outline"
          iconRight={open ? "chevron-up" : "chevron-down"}
          selected={count > 0}
          accessibilityLabel={count > 0 ? `Filters, ${count} on` : "Filters"}
          accessibilityState={{ expanded: open }}
          onPress={() => (open ? close() : setOpen(true))}
        />
      </View>

      {open ? (
        <Card style={styles.panel} padded={spacing.md}>
          <LimitField
            label="Total time up to"
            value={filters.maxMinutes}
            onChange={(v) => onChange({ maxMinutes: v })}
            clearCount={clearCount}
            inputStyle={totalLimit.overridden ? styles.overriddenInput : null}
            accessibilityHint={totalLimit.overridden ? overrideText : undefined}
          />
          {totalLimit.overridden ? (
            <View style={styles.override} accessibilityLiveRegion="polite">
              <Ionicons name="alert-circle-outline" size={16} color={theme.colors.warning} />
              <AppText variant="caption" style={styles.flex}>{overrideText}</AppText>
            </View>
          ) : (
            <AppText variant="caption" tone="muted" style={styles.hint}>
              Prep + cook. Applies when you finish typing. Leave blank for any.
            </AppText>
          )}

          <AppText variant="smallStrong" tone="muted" style={styles.sectionLabel}>Difficulty</AppText>
          <View style={styles.levels}>
            {DIFFICULTY_LEVELS.map((level) => (
              <Chip
                key={level}
                label={level}
                selected={filters.difficulties.includes(level)}
                onPress={() => toggleDifficulty(level)}
              />
            ))}
          </View>

          <Pressable
            onPress={() => setAdvancedOpen((o) => !o)}
            accessibilityRole="button"
            accessibilityState={{ expanded: advancedOpen }}
            style={({ hovered, pressed }) => [styles.advancedToggle, (hovered || pressed) && styles.advancedHover]}
          >
            <AppText variant="smallStrong">Advanced</AppText>
            {!advancedOpen && hasAdvanced ? <AppText variant="caption" tone="primary">On</AppText> : null}
            <Ionicons
              name={advancedOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={theme.colors.textMuted}
              style={styles.advancedChevron}
            />
          </Pressable>
          {advancedOpen ? (
            <View style={styles.advancedRow}>
              <LimitField
                style={styles.flex}
                label="Prep time up to"
                value={filters.maxPrep}
                onChange={(v) => onChange({ maxPrep: v })}
                clearCount={clearCount}
              />
              <LimitField
                style={styles.flex}
                label="Cook time up to"
                value={filters.maxActive}
                onChange={(v) => onChange({ maxActive: v })}
                clearCount={clearCount}
              />
            </View>
          ) : null}

          <View style={styles.footer}>
            <Button label="Clear" variant="ghost" size="sm" onPress={clear} disabled={!anyOn} />
            <Button label="Done" variant="tonal" size="sm" onPress={close} />
          </View>
        </Card>
      ) : null}

      <View style={styles.countRow}>
        <AppText variant="small" tone="muted" style={styles.flex} numberOfLines={2}>
          {[
            unknown > 0 ? `${shown} of ${total} recipes + ${unknown} might fit` : `${shown} of ${total} recipes`,
            ...(open ? [] : summary),
          ].join(" · ")}
        </AppText>
        {anyOn && !open ? (
          <Pressable onPress={onClear} accessibilityRole="button" hitSlop={8}>
            <AppText variant="smallStrong" tone="primary">Clear filters</AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  bar: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  panel: { marginTop: spacing.sm, maxWidth: 520 },
  hint: { marginTop: spacing.xs },
  overriddenInput: { textDecorationLine: "line-through", color: t.colors.textSubtle },
  override: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: t.colors.warningSoft,
  },
  sectionLabel: { marginTop: spacing.md, marginBottom: spacing.xs },
  levels: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  advancedToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 44,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginHorizontal: -spacing.xs,
    borderRadius: 8,
    ...(Platform.OS === "web" ? { cursor: "pointer", userSelect: "none" } : null),
  },
  advancedHover: { backgroundColor: t.colors.surfaceAlt },
  advancedChevron: { marginLeft: "auto" },
  advancedRow: { flexDirection: "row", gap: spacing.md },
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm, marginTop: spacing.md },
  countRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.sm },
}));

export default RecipeFilters;
