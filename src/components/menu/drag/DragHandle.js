import { useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector, PointerType } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme";
import { useDragApi } from "./DragProvider";

// Grip handle (≡). Dragging starts here so tap-to-open and swipe-to-remove keep working.
const DragHandle = ({ payload, label }) => {
  const api = useDragApi();
  const theme = useTheme();
  const { type, id } = payload;
  // Built once per handle (not per render) so a re-render mid-drag never hands
  // GestureDetector a new gesture while the pan is active.
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(4)
        .runOnJS(true)
        // A mouse pointer doesn't hide the preview; a finger or stylus does.
        .onStart((e) => api.begin({ type, id, label }, e.absoluteX, e.absoluteY, e.pointerType !== PointerType.MOUSE))
        .onUpdate((e) => api.move(e.absoluteX, e.absoluteY))
        .onEnd(() => api.end())
        .onFinalize(() => api.cancel()), // no-op when end() already ran
    [api, type, id, label]
  );

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={[styles.handle, Platform.OS === "web" ? styles.web : null]}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Drag ${label}`}
        accessibilityHint="Drag to move"
        collapsable={false}
      >
        <Ionicons name="reorder-three" size={22} color={theme.colors.textSubtle} />
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  handle: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  web: { cursor: "grab", touchAction: "none", userSelect: "none" },
});

export default DragHandle;
