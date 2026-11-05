import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { elevation, makeStyles, radius, spacing, typography } from "../../theme";

const ToastContext = createContext(null);
const FADE_MS = 180;

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);
  const seq = useRef(0);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const hide = useCallback(() => {
    clearTimer();
    const id = seq.current;
    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_MS,
      useNativeDriver: Platform.OS !== "web",
    }).start(({ finished }) => {
      if (finished && seq.current === id) setToast(null);
    });
  }, [opacity]);

  const show = useCallback(
    (message, { actionLabel, onAction, duration = 2500 } = {}) => {
      clearTimer();
      seq.current += 1;
      setToast({ message, actionLabel, onAction });
      opacity.stopAnimation();
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_MS,
        useNativeDriver: Platform.OS !== "web",
      }).start();
      timer.current = setTimeout(hide, duration);
    },
    [hide, opacity]
  );

  useEffect(() => clearTimer, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        // Sits just above the tab bar (49pt + the home-indicator inset).
        <View style={[styles.container, { bottom: insets.bottom + 49 + spacing.lg }]} pointerEvents="box-none">
          <Animated.View
            style={[styles.toast, { opacity }]}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
            {toast.actionLabel ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  hide();
                  toast.onAction && toast.onAction();
                }}
                hitSlop={8}
              >
                <Text style={styles.action}>{toast.actionLabel}</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

const useStyles = makeStyles((t) => ({
  container: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    maxWidth: 480,
    backgroundColor: t.colors.toast,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...elevation(t, 2),
  },
  message: { ...typography.small, color: t.colors.onToast, flexShrink: 1 },
  action: { ...typography.smallStrong, color: t.colors.toastAction },
}));
