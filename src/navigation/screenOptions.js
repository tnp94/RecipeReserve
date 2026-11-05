import { useMemo } from "react";
import { Platform } from "react-native";
import { typography, useTheme } from "../theme";

// Header styling shared by every stack and tab header.
export function useHeaderOptions() {
  const theme = useTheme();
  return useMemo(
    () => ({
      headerStyle: {
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerShadowVisible: false,
      headerTitleStyle: { ...typography.heading, color: theme.colors.text },
      headerTitleAlign: "left",
      headerTintColor: theme.colors.primary,
      headerBackTitleVisible: false,
      cardStyle: { backgroundColor: theme.colors.background },
      ...(Platform.OS === "web" ? { headerTitleContainerStyle: { paddingLeft: 4 } } : null),
    }),
    [theme]
  );
}
