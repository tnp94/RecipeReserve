import { useState } from "react";
import { StyleSheet, View, Text, Image, FlatList, TouchableOpacity, Button, Pressable } from "react-native";
import Separator from "../components/Separator";
import { useDispatch, useSelector } from "react-redux";
import { checkOffShoppingItem, deleteItem } from "../store/shoppingListSlice";
import { INGREDIENTCATEGORIES } from "../Models/Ingredient";
import { Swipeable } from "react-native-gesture-handler";

const ShoppingListScreen = ({ navigation }) => {
  const shoppingList = useSelector((state) =>  state.shoppingList.shoppingList)
  const dispatch = useDispatch()
  
  // const [data, setData] = useState(mockShoppingListData)
  const shoppingTableItem = ({ item, index }) => {
    const deleteShoppingItem = () => {
      dispatch(deleteItem(item.id))
    }
    const renderRightActions = () => {
      return (
        <View>
          <TouchableOpacity
          style={{
            padding: 5,
            borderRadius: 7,
            justifyContent: "center",
            flex: 1
          }}
          onPress={() => deleteShoppingItem()}
          >
            <Text
              style={{
                color: "red"
              }}
            >Delete</Text>
          </TouchableOpacity>
          </View>
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
        data={Object.values(shoppingList).filter(( value, key ) => {
          return value.category == category || ((category == INGREDIENTCATEGORIES.UNCATEGORIZED ) && (!Object.values(INGREDIENTCATEGORIES).includes(value.category) || value.category == ""))
        }).sort((a, b) => a.name.localeCompare(b.name))}
        renderItem={shoppingTableItem} 
        keyExtractor={(item, index) => {
          // console.log(item);
          return item.id
        }}
        ItemSeparatorComponent={() => <Separator color="black" size={1} />}
        />
    </View>
  )

  return (
    <View>
        <FlatList
        data={Object.values(INGREDIENTCATEGORIES)}
        renderItem={shoppingTableCategory}
        keyExtractor={(item, index) => item.name + index.toString()}
        ItemSeparatorComponent={() => <Separator color="black" size={3} />}
        />
    </View>
  )
}

export default ShoppingListScreen;