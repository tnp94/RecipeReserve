import { useEffect, useState } from "react";
import { StyleSheet, View, Text, Image, FlatList, TouchableOpacity, Button, Alert } from "react-native";
import { CheckBox, Separator } from "react-native-btr";
import { useDispatch, useSelector } from "react-redux";
import { clearShoppingList, generateShoppingList } from "../store/shoppingListSlice";

const MenuScreen = ({ navigation }) => {
  const menu = useSelector((state) =>  state.menu)
  const dispatch = useDispatch()
  useEffect(() => {
      navigation.setOptions(
        {
          headerRight: () => (
            <Button
              onPress={() => {
                console.log('This is a button!')
                onGenerateShoppingListPress(menu)
              }}
              title="Generate List"
            />
          ),
        }
      )
    }, [ menu ]);
    
  const onGenerateShoppingListPress = (menu) => {
    Alert.alert('Generate Shopping List?', 'This will clear the current shopping list', [
      {text: 'Generate', onPress: () => {
        dispatch(clearShoppingList());
        dispatch(generateShoppingList(menu))
      }},
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
    ]);
  }

  const menuTableItem = ({ item, index }) => (
    <View style={{
      flexDirection: "row",
      padding: 5,
      borderWidth: 1
    }}>
      <View style={{flex: 4, alignItems: "center"}}>
        <Text>{item.name.toString()}</Text>
      </View>
      <View style={{flex: 4, alignItems: "center"}}>
        <Text>{index}</Text>
      </View>
      <View 
      style={{
      }}>
      </View>
    </View>
  )

  return (
    <View>
        <FlatList 
        data={menu} 
        renderItem={menuTableItem} 
        keyExtractor={(item, index) => item.name + index.toString()}
        ItemSeparatorComponent={<Separator />}
        />
    </View>
  )
}

export default MenuScreen;