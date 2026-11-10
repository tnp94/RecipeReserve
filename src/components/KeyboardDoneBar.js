import { InputAccessoryView, Keyboard, Platform, StyleSheet, View } from "react-native";
import { Button } from "./ui";
import { makeStyles, spacing } from "../theme";

// A "Done" bar above the iOS keyboard, for keyboards with no key to close them (number-pad).
// Give the TextInput `inputAccessoryViewID={id}` and render <KeyboardDoneBar id={id} /> right
// after it. Use one bar per input: with the new architecture an InputAccessoryView attaches
// only to the first input with its nativeID that's on screen when the bar mounts, so a shared
// bar silently skips the others. Renders nothing off iOS.
export default function KeyboardDoneBar({ id }) {
  const styles = useStyles();
  if (Platform.OS !== "ios") return null;
  return (
    <InputAccessoryView nativeID={id}>
      <View style={styles.bar}>
        <Button label="Done" variant="ghost" size="sm" onPress={() => Keyboard.dismiss()} accessibilityLabel="Close keyboard" />
      </View>
    </InputAccessoryView>
  );
}

const useStyles = makeStyles((t) => ({
  bar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: t.colors.surfaceAlt,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.colors.border,
  },
}));
