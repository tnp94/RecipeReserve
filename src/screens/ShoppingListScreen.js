import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { StyleSheet, View, Text, Image, FlatList, TouchableOpacity } from "react-native";
import { CheckBox, Separator } from "react-native-btr";
import { useDispatch, useSelector } from "react-redux";
import { checkOffShoppingItem } from "../store/shoppingListSlice";
import { INGREDIENTCATEGORIES } from "../Models/Ingredient";

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
  const shoppingTableItem = ({ item, index }) => (
    <View style={{
      flexDirection: "row",
      padding: 5,
    }}>
      <View style={{flex: 4, alignItems: "center"}}>
        <Text>{item.name?.toString()}</Text>
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
        {/* <TouchableOpacity
        style={{
          flex: 1,
          borderRadius: 7,
          backgroundColor: "#bbb",
          borderWidth: 1,
        }}
        ></TouchableOpacity> */}
      </View>
    </View>
  )
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
          return item.category == category
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