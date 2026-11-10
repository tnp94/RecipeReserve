import { Platform } from "react-native";

// keyboardDismissMode for scroll views that contain text fields.
// On web, react-native-web's "on-drag" blurs the focused field on *every* scroll event,
// including the one the browser fires when content gets shorter while scrolled down (e.g.
// a filtered list shrinking as you type), so typing loses focus. Phone browsers manage
// their own keyboard, so web uses "none". Native modes only react to a real finger drag.

// Forms and sheets: on iOS the keyboard follows the finger and closes if dragged down.
export const KEYBOARD_DISMISS_MODE = Platform.select({ ios: "interactive", android: "on-drag", default: "none" });

// Lists you type above and then scroll (the recipe list): any scroll closes the keyboard,
// which matters on iOS, where the number pad has no key to close it.
export const LIST_KEYBOARD_DISMISS_MODE = Platform.select({ web: "none", default: "on-drag" });
