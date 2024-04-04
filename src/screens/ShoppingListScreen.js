import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { StyleSheet, View, Text, Image, FlatList, TouchableOpacity } from "react-native";
import { CheckBox, Separator } from "react-native-btr";
import { useSelector } from "react-redux";

const ShoppingListScreen = ({ navigation }) => {
  const shoppingList = useSelector((state) =>  state.shoppingList)
  const [data, setData] = useState(shoppingList)
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
      borderWidth: 1
    }}>
      <View style={{flex: 4, alignItems: "center"}}>
        <Text>{item.name.toString()}</Text>
      </View>
      <View style={{flex: 4, alignItems: "center"}}>
        <Text>{item.quantityUnit.toString()} {item.unit}</Text>
      </View>
      <View 
      style={{
      }}>
        <CheckBox
        checked={item.checked} 
        onPress={(newValue) => {
          let item = data[index]
          AsyncStorage.getAllKeys((err, keys) => {
            console.log('All Keys:');
            AsyncStorage.multiGet(keys, (error, stores) => {
              stores.map((result, i, store) => {
                console.log({ [store[i][0]]: store[i][1] });
                return true;
              });
            });
          });
          item.checked = !item.checked; 
          setData([...data]);
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

  return (
    <View>
        <FlatList 
        data={data} 
        renderItem={shoppingTableItem} 
        keyExtractor={item => item.name}
        ItemSeparatorComponent={<Separator />}
        />
    </View>
  )
}

export default ShoppingListScreen;