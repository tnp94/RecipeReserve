import { View } from "react-native";
const Separator = ({ color = "#e0e0e0", size = 1 }) => (
  <View style={{ height: 0, borderBottomWidth: size, borderBottomColor: color }} />
);
export default Separator;
