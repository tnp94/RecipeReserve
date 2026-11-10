import { Platform } from "react-native";

// keyboardDismissMode for scroll views that contain text fields.
// On web, react-native-web's "on-drag" blurs the focused field on *every* scroll event,
// including the one the browser fires when content gets shorter while scrolled down (e.g.
// a filtered list shrinking as you type), so typing loses focus. Phone browsers manage
// their own keyboard, so web uses "none". Native "on-drag"/"interactive" only react to a
// real finger drag.
export const KEYBOARD_DISMISS_MODE = Platform.select({ ios: "interactive", android: "on-drag", default: "none" });
