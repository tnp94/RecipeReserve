import { useCallback, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { generateShoppingList } from "../store/thunks";
import { selectMenuEntryCount } from "../store/menuSlice";
import { selectShoppingItemCount } from "../store/shoppingListSlice";
import { selectShowStapleReminder, setShowStapleReminder } from "../store/settingsSlice";
import { useDialog } from "../components/dialog/DialogProvider";
import StapleReminderModal from "../components/menu/StapleReminderModal";

// The "Generate list" flow (S-1, S-8, P-3), shared by the Menu and Home screens:
// empty menu -> explain; existing list -> ask Replace or Merge; then show the pantry
// staple reminder (unless turned off) and open the shopping list.
// Render `reminderModal` somewhere in the screen.
export default function useGenerateList(navigation) {
  const dispatch = useDispatch();
  const dialog = useDialog();
  const entryCount = useSelector(selectMenuEntryCount);
  const itemCount = useSelector(selectShoppingItemCount);
  const showReminder = useSelector(selectShowStapleReminder);
  // Items stay set while the reminder fades out, so its content doesn't collapse.
  const [reminder, setReminder] = useState({ visible: false, items: [] });

  const openList = () => navigation.navigate("ShoppingList");

  const generate = (mode) => {
    const result = dispatch(generateShoppingList(mode));
    if (result.prechecked.length > 0 && showReminder) setReminder({ visible: true, items: result.prechecked });
    else openList();
  };

  const onGenerate = () => {
    if (entryCount === 0) {
      dialog.alert("Your menu is empty", "Add recipes to your menu first, then generate the list.");
    } else if (itemCount === 0) {
      generate("replace");
    } else {
      dialog.alert(
        "You already have a shopping list",
        "Replace it with a new list from this menu, or merge this menu's ingredients into it?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Merge into current list", onPress: () => generate("merge") },
          { text: "Replace current list", style: "destructive", onPress: () => generate("replace") },
        ]
      );
    }
  };

  // Stable identity (always runs the latest flow), so screens can put it in a header
  // without re-setting navigation options on every render.
  const latest = useRef(onGenerate);
  latest.current = onGenerate;
  const stableOnGenerate = useCallback(() => latest.current(), []);

  const hide = () => setReminder((r) => ({ ...r, visible: false }));
  const reminderModal = (
    <StapleReminderModal
      visible={reminder.visible}
      items={reminder.items}
      onClose={() => {
        hide();
        openList();
      }}
      onDisable={() => {
        dispatch(setShowStapleReminder(false));
        hide();
        openList();
      }}
    />
  );

  return { onGenerate: stableOnGenerate, reminderModal, entryCount };
}
