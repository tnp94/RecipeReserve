import { useState } from "react";
import { StyleSheet, View, Text, Image, FlatList, TouchableOpacity, Button } from "react-native";
import { CheckBox, Separator } from "react-native-btr";
import { useDispatch, useSelector } from "react-redux";
import { checkOffShoppingItem, deleteItem } from "../store/shoppingListSlice";
import { INGREDIENTCATEGORIES } from "../Models/Ingredient";
import { Swipeable } from "react-native-gesture-handler";

const ShoppingListScreen = ({ navigation }) => {
  const shoppingList = useSelector((state) =>  state.shoppingList)
  const [data, setData] = useState(shoppingList)
  const dispatch = useDispatch()
  let mockShoppingListData = [
    {
      name: "Unsalted Butter (Softened)",
      unit: "Tbsp",
      quantityUnit: "4",
      checked: true
    },
    {
      name: "Carrots",
      unit: "Whole",
      quantityUnit: "4",
      checked: false
    },
  ]

  
  // const [data, setData] = useState(mockShoppingListData)
  const shoppingTableItem = ({ item, index }) => {
    const deleteShoppingItem = () => {
      dispatch(deleteItem(item))
    }
    const renderRightActions = () => {
      return (
            <Button
              title="Delete"
              color={"red"}
              onPress={() => deleteShoppingItem()}
            >
            </Button>
          )
        }
    return (
      <Swipeable
        renderRightActions={renderRightActions}
        overshootFriction={8}
      >
        <View style={{
          flexDirection: "row",
          padding: 5,
        }}>
          <View style={{flex: 4, alignItems: "center"}}>
            <Text>{item.name?.toString()} {item.note ? `(${item.note})` : ""}</Text>
          </View>
          <View style={{flex: 4, alignItems: "center"}}>
            <Text>{item.quantityUnit?.toString()} {item.unit}</Text>
          </View>
          <View 
          style={{
          }}>
            <CheckBox
            checked={item.checked} 
            onPress={(newValue) => {
              dispatch(checkOffShoppingItem(item.id))
            }}
            />
          </View>
        </View>
      </Swipeable>
    )
  }
  const shoppingTableCategory = ({ item: category, index }) => (
    <View style={{
      padding: 5,
      borderWidth: 1
    }}>
      <View>
        <Text style={{
        fontSize: 24,
        fontWeight: "bold"
      }}>
        {category.toString()}
      </Text>
      </View>
        <FlatList 
        data={shoppingList.filter((item) => {
          return item.category == category || ((category == INGREDIENTCATEGORIES.UNCATEGORIZED ) && (!Object.values(INGREDIENTCATEGORIES).includes(item.category) || item.category == ""))
        })} 
        renderItem={shoppingTableItem} 
        keyExtractor={(item, index) => item.name + index.toString()}
        ItemSeparatorComponent={<Separator color="black" size={1} />}
        />
    </View>
  )

  return (
    <View>
        <FlatList 
        data={Object.values(INGREDIENTCATEGORIES)} 
        renderItem={shoppingTableCategory} 
        keyExtractor={(item, index) => item.name + index.toString()}
        ItemSeparatorComponent={<Separator color="black" size={3} />}
        />
    </View>
  )
}

export default ShoppingListScreen;