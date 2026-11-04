import { useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Button } from "react-native";
import Separator from "../components/Separator";
import { useDispatch, useSelector } from "react-redux";
import { Swipeable } from "react-native-gesture-handler";
import { removeMenuEntry, selectMenuEntryCount, selectUnplannedEntries, selectMenuWeek } from "../store/menuSlice";
import { generateShoppingList } from "../store/thunks";
import { selectShoppingItemCount } from "../store/shoppingListSlice";
import { useDialog } from "../components/dialog/DialogProvider";

const MenuScreen = ({ navigation }) => {
  const unplanned = useSelector(selectUnplannedEntries)
  const week = useSelector(selectMenuWeek)
  const entryCount = useSelector(selectMenuEntryCount)
  const itemCount = useSelector(selectShoppingItemCount)
  const dispatch = useDispatch()
  const dialog = useDialog()

  // Minimal flat list: unplanned entries followed by every planned entry.
  const entries = [
    ...unplanned,
    ...week.flatMap((day) => day.slots.flatMap((slot) => slot.entries)),
  ]

  const generate = (mode) => {
    dispatch(generateShoppingList(mode))
    navigation.navigate("ShoppingList")
  }

  const onGenerateShoppingListPress = () => {
    if (entryCount === 0) {
      dialog.alert("Your menu is empty", "Add recipes from My Recipes first.")
    } else if (itemCount === 0) {
      generate("replace")
    } else {
      dialog.alert(
        "You already have a shopping list",
        "Replace it with a new list from this menu, or merge this menu's ingredients into it?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Merge", onPress: () => generate("merge") },
          { text: "Replace", style: "destructive", onPress: () => generate("replace") },
        ]
      )
    }
  }

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Button onPress={onGenerateShoppingListPress} title="Generate List" />
      ),
    })
  }, [entryCount, itemCount]);

  const menuTableItem = ({ item, index }) => {
    const renderRightActions = () => (
      <View>
        <TouchableOpacity
          style={{ padding: 5, borderRadius: 7, flex: 1, justifyContent: "center" }}
          onPress={() => dispatch(removeMenuEntry(item.id))}
        >
          <Text style={{ color: "red" }}>Delete</Text>
        </TouchableOpacity>
      </View>
    )
    return (
      <Swipeable renderRightActions={renderRightActions} overshootFriction={8}>
        <View style={{ flexDirection: "row", padding: 5, borderWidth: 1 }}>
          <View style={{ flex: 4, alignItems: "center" }}>
            <Text>{item.recipe.name.toString()}</Text>
          </View>
          <View style={{ flex: 4, alignItems: "center" }}>
            <Text>{index}</Text>
          </View>
        </View>
      </Swipeable>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={entries}
        renderItem={menuTableItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={Separator}
      />
    </View>
  )
}

export default MenuScreen;
