import { useState } from "react";
import { StyleSheet, View, Text, Image, FlatList, TouchableOpacity } from "react-native";
import { CheckBox, Separator } from "react-native-btr";

const ShoppingListScreen = ({ navigation }) => {
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
  const [data, setData] = useState(mockShoppingListData)
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
          console.log(item)
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