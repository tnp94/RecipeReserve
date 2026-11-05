import AppModal from "../AppModal";
import { WEEK_DAYS } from "../../store/menuSlice";
import { PickerRow } from "./PickerRow";

const DayPickerModal = ({ visible, title, excludeDay, onSelect, onClose }) => (
  <AppModal visible={visible} onClose={onClose} title={title}>
    {WEEK_DAYS.map((label, day) => (
      <PickerRow key={day} label={label} current={day === excludeDay} onPress={() => onSelect(day)} />
    ))}
  </AppModal>
);

export default DayPickerModal;
