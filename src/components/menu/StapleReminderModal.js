import { View } from "react-native";
import AppModal from "../AppModal";
import { AppText, Button } from "../ui";
import { formatAmount } from "../../domain/quantity";
import { makeStyles, spacing } from "../../theme";

const StapleReminderModal = ({ visible, items, onClose, onDisable }) => {
  const styles = useStyles();
  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Check your pantry staples"
      footer={
        <>
          <Button label="Don't remind me again" variant="ghost" onPress={onDisable} />
          <Button label="Got it" onPress={onClose} />
        </>
      }
    >
      <AppText tone="muted" style={styles.intro}>
        These were added already checked off because they're pantry staples. Make sure you have enough:
      </AppText>
      {items.map((item, i) => {
        const qty = formatAmount(item.quantityText, item.unit);
        return (
          <View key={`${item.name}-${i}`} style={styles.row}>
            <AppText variant="bodyStrong" style={styles.name}>{item.name}</AppText>
            {qty ? <AppText tone="muted">{qty}</AppText> : null}
          </View>
        );
      })}
    </AppModal>
  );
};

const useStyles = makeStyles((t) => ({
  intro: { marginBottom: spacing.md },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 40,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: t.colors.border,
  },
  name: { flex: 1 },
}));

export default StapleReminderModal;
