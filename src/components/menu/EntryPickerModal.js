import AppModal from "../AppModal";
import { AppText } from "../ui";
import { PickerGroup, PickerRow } from "./PickerRow";

// groups: Array<{ key, label, entries }>
const EntryPickerModal = ({ visible, groups, onSelect, onClose }) => {
  const total = groups.reduce((n, g) => n + g.entries.length, 0);
  return (
    <AppModal visible={visible} onClose={onClose} title={"Swap with…"}>
      {total === 0 ? <AppText tone="muted">No other recipes on the menu to swap with.</AppText> : null}
      {groups.map((group) =>
        group.entries.length === 0 ? null : (
          <PickerGroup key={group.key} title={group.label}>
            {group.entries.map((entry) => (
              <PickerRow key={entry.id} label={entry.recipe.name} onPress={() => onSelect(entry)} />
            ))}
          </PickerGroup>
        )
      )}
    </AppModal>
  );
};

export default EntryPickerModal;
