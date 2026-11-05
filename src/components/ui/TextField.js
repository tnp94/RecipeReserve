import { forwardRef, useState } from "react";
import { Platform, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { makeStyles, radius, spacing, typography, useTheme } from "../../theme";
import AppText from "./AppText";

// Labelled text input. Every TextInput prop passes through.
const TextField = forwardRef(function TextField(
  { label, helper, error, icon, style, inputStyle, multiline, onFocus, onBlur, right, ...props },
  ref
) {
  const theme = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  return (
    <View style={style}>
      {label ? (
        <AppText variant="smallStrong" tone="muted" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.box,
          multiline && styles.boxMultiline,
          focused && { borderColor: theme.colors.primary },
          error && { borderColor: theme.colors.danger },
        ]}
      >
        {icon ? <Ionicons name={icon} size={18} color={theme.colors.textSubtle} style={styles.icon} /> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.textSubtle}
          selectionColor={theme.colors.primary}
          multiline={multiline}
          accessibilityLabel={props.accessibilityLabel ?? label}
          {...props}
          onFocus={(e) => {
            setFocused(true);
            onFocus && onFocus(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur && onBlur(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline, inputStyle]}
        />
        {right}
      </View>
      {error ? (
        <AppText variant="caption" tone="danger" style={styles.helper}>
          {error}
        </AppText>
      ) : helper ? (
        <AppText variant="caption" tone="muted" style={styles.helper}>
          {helper}
        </AppText>
      ) : null}
    </View>
  );
});

const useStyles = makeStyles((t) => ({
  label: { marginBottom: spacing.xs },
  box: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: t.colors.border,
    backgroundColor: t.colors.surface,
  },
  boxMultiline: { alignItems: "flex-start" },
  icon: { marginLeft: spacing.md },
  input: {
    flex: 1,
    minWidth: 0,
    ...typography.body,
    lineHeight: undefined, // a fixed lineHeight clips the caret on Android
    color: t.colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : null),
  },
  inputMultiline: { minHeight: 72, textAlignVertical: "top" },
  helper: { marginTop: spacing.xs },
}));

export default TextField;
