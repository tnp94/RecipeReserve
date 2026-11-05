import { useRef } from "react";
import { View } from "react-native";
import AppModal from "../AppModal";
import Chip from "../Chip";
import { AppText, IconButton } from "../ui";
import { makeStyles, radius, spacing } from "../../theme";
import { PickerRow } from "./PickerRow";

const PRESETS = [[0.5, "½×"], [1, "1×"], [2, "2×"], [3, "3×"]];

const round1 = (n) => Math.round(n * 10) / 10;

const EntryOptionsModal = ({ visible, entry: entryProp, location, onClose, onSetScale, onMove, onSwap, onView, onRemove }) => {
  const styles = useStyles();
  // Keep rendering the last entry while the sheet fades out, instead of unmounting the
  // Modal mid-dismiss (which breaks iOS's dismiss sequencing).
  const last = useRef(entryProp);
  if (entryProp) last.current = entryProp;
  const entry = last.current;
  if (!entry) return null;
  const { recipe, scale } = entry;
  const label = recipe.yield > 0 ? `Serves ${round1(recipe.yield * scale)}` : `${scale}× the recipe`;
  const step = (delta) => onSetScale(Math.min(20, Math.max(0.5, scale + delta)));
  return (
    <AppModal visible={visible && !!entryProp} onClose={onClose} title={recipe.name} subtitle={location}>
      <View style={styles.scaleBox}>
        <View style={styles.scaleHeader}>
          <AppText variant="overline" tone="muted">Amount</AppText>
          <AppText variant="smallStrong">{label}</AppText>
        </View>
        <View style={styles.scaleRow}>
          <IconButton icon="remove" variant="tonal" size={18} accessibilityLabel="Less" onPress={() => step(-0.5)} disabled={scale <= 0.5} />
          {PRESETS.map(([value, text]) => (
            <Chip key={value} label={text} selected={scale === value} onPress={() => onSetScale(value)} accessibilityLabel={`${value} times`} />
          ))}
          <IconButton icon="add" variant="tonal" size={18} accessibilityLabel="More" onPress={() => step(0.5)} disabled={scale >= 20} />
        </View>
        <AppText variant="caption" tone="muted">Shopping list amounts scale with this.</AppText>
      </View>
      <PickerRow icon="arrow-forward" label={"Move to…"} onPress={onMove} />
      <PickerRow icon="swap-horizontal" label={"Swap with…"} onPress={onSwap} />
      <PickerRow icon="book-outline" label="View recipe" onPress={onView} />
      <PickerRow icon="trash-outline" label="Remove from menu" onPress={onRemove} danger />
    </AppModal>
  );
};

const useStyles = makeStyles((t) => ({
  scaleBox: {
    backgroundColor: t.colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  scaleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scaleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm },
}));

export default EntryOptionsModal;
