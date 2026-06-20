import { useMemo } from "react";
import { View, Text, SectionList, TouchableOpacity, Pressable } from "react-native";
import Separator from "../components/Separator";
import { useDispatch, useSelector } from "react-redux";
import { checkOffShoppingItem, deleteItem } from "../store/shoppingListSlice";
import { INGREDIENTCATEGORIES } from "../Models/Ingredient";
import { Swipeable } from "react-native-gesture-handler";

const CATEGORIES = Object.values(INGREDIENTCATEGORIES);

const ShoppingListScreen = ({ navigation }) => {
  const shoppingList = useSelector((state) => state.shoppingList.shoppingList);
  const dispatch = useDispatch();

  const sections = useMemo(() => {
    const items = Object.values(shoppingList);
    return CATEGORIES
      .map((category) => {
        const data = items
          .filter((item) =>
            category === INGREDIENTCATEGORIES.UNCATEGORIZED
              ? !CATEGORIES.includes(item.category) || item.category === ""
              : item.category === category
          )
          .sort((a, b) => a.name.localeCompare(b.name));
        return { title: category, data };
      })
      .filter((section) => section.data.length > 0);
  }, [shoppingList]);

  const renderItem = ({ item }) => {
    const renderRightActions = () => (
      <View>
        <TouchableOpacity
          style={{ padding: 5, borderRadius: 7, justifyContent: "center", flex: 1 }}
          onPress={() => dispatch(deleteItem(item.id))}
        >
          <Text style={{ color: "red" }}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
    return (
      <Swipeable renderRightActions={renderRightActions} overshootFriction={8}>
        <View style={{ flexDirection: "row", padding: 5 }}>
          <View style={{ flex: 4, alignItems: "center" }}>
            <Text>{item.name?.toString()} {item.note ? `(${item.note})` : ""}</Text>
          </View>
          <View style={{ flex: 4, alignItems: "center" }}>
            <Text>{item.quantityUnit?.toString()} {item.unit}</Text>
          </View>
          <Pressable
            onPress={() => dispatch(checkOffShoppingItem(item.id))}
            style={{
              width: 22, height: 22, borderWidth: 2, borderColor: "#555",
              borderRadius: 3, alignItems: "center", justifyContent: "center"
            }}
          >
            {item.checked && (
              <View style={{ width: 12, height: 12, backgroundColor: "#555", borderRadius: 2 }} />
            )}
          </Pressable>
        </View>
      </Swipeable>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={{ padding: 5, borderWidth: 1, borderBottomWidth: 0 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>{title}</Text>
    </View>
  );

  const renderSectionFooter = () => (
    <View style={{ borderWidth: 1, borderTopWidth: 0, height: 4 }} />
  );

  return (
    <View style={{ flex: 1 }}>
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        keyExtractor={(item) => item.id?.toString()}
        ItemSeparatorComponent={() => <Separator color="black" size={1} />}
        SectionSeparatorComponent={() => <Separator color="black" size={3} />}
      />
    </View>
  );
};

export default ShoppingListScreen;
