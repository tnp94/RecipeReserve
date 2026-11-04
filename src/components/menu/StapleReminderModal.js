import { StyleSheet, Text, View } from "react-native";
import AppModal from "../AppModal";
import { colors, spacing } from "../../theme";
import { Pressable } from "react-native";

const FooterButton = ({ label, onPress, bold }) => (
  <Pressable onPress={onPress} accessibilityRole="button" style={styles.button}>
    <Text style={[styles.buttonText, bold && styles.bold]}>{label}</Text>
  </Pressable>
);

const StapleReminderModal = ({ visible, items, onClose, onDisable }) => (
  <AppModal
    visible={visible}
    onClose={onClose}
    title="Check your pantry staples"
    footer={
      <>
        <FooterButton label="Don't remind me again" onPress={onDisable} />
        <FooterButton label="Got it" onPress={onClose} bold />
      </>
    }
  >
    <Text style={styles.intro}>
      These were added already checked off because they're pantry staples. Make sure you have enough:
    </Text>
    {items.map((item, i) => {
      const qty = `${item.quantityText ?? ""} ${item.unit ?? ""}`.trim();
      return (
        <View key={`${item.name}-${i}`} style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          {qty ? <Text style={styles.qty}>{qty}</Text> : null}
        </View>
      );
    })}
  </AppModal>
);

const styles = StyleSheet.create({
  intro: { color: colors.text, marginBottom: spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between", minHeight: 36, alignItems: "center" },
  name: { fontWeight: "bold", color: colors.text, flex: 1 },
  qty: { color: colors.muted, marginLeft: spacing.md },
  button: { minHeight: 44, paddingHorizontal: spacing.md, justifyContent: "center" },
  buttonText: { color: colors.accentStrong, fontSize: 16 },
  bold: { fontWeight: "bold" },
});

export default StapleReminderModal;
