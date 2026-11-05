import { Text } from "react-native";
import { typography, useTheme } from "../../theme";

// Text with a type-scale variant and a semantic colour:
//   <AppText variant="heading">Ingredients</AppText>
//   <AppText variant="small" tone="muted">Serves 4</AppText>
const TONES = {
  default: "text",
  muted: "textMuted",
  subtle: "textSubtle",
  primary: "primary",
  accent: "accent",
  danger: "danger",
  inverse: "onPrimary",
};

const AppText = ({ variant = "body", tone = "default", align, style, ...props }) => {
  const theme = useTheme();
  const color = theme.colors[TONES[tone] ?? tone] ?? theme.colors.text;
  return (
    <Text
      {...props}
      style={[typography[variant] ?? typography.body, { color }, align ? { textAlign: align } : null, style]}
    />
  );
};

export default AppText;
