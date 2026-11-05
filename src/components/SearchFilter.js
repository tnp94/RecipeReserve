import TextField from "./ui/TextField";
import IconButton from "./ui/IconButton";

const SearchFilter = ({ placeholder, value, onChangeText, style }) => (
  <TextField
    style={style}
    icon="search"
    placeholder={placeholder}
    value={value}
    onChangeText={onChangeText}
    autoCorrect={false}
    autoCapitalize="none"
    returnKeyType="search"
    accessibilityLabel={placeholder}
    right={
      value ? (
        <IconButton icon="close-circle" size={18} accessibilityLabel="Clear search" onPress={() => onChangeText && onChangeText("")} />
      ) : null
    }
  />
);

export default SearchFilter;
