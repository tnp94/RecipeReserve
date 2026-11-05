import { Pressable, StyleSheet, Text } from "react-native";
import AppModal from "../AppModal";
import { colors, spacing } from "../../theme";
import { WEEK_DAYS } from "../../store/menuSlice";

const DayPickerModal = ({ visible, title, excludeDay, onSelect, onClose }) => (
  <AppModal visible={visible} onClose={onClose} title={title}>
    {WEEK_DAYS.map((label, day) =>
      day === excludeDay ? null : (
        <Pressable key={day} style={styles.row} onPress={() => onSelect(day)} accessibilityRole="button">
          <Text style={styles.text}>{label}</Text>
        </Pressable>
      )
    )}
  </AppModal>
);

const styles = StyleSheet.create({
  row: { minHeight: 44, justifyContent: "center", borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.sm },
  text: { fontSize: 16, color: colors.text },
});

export default DayPickerModal;
