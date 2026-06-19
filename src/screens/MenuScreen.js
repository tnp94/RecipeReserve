import { useEffect, useState } from "react";
import { StyleSheet, View, Text, Image, FlatList, TouchableOpacity, Button, Alert } from "react-native";
import Separator from "../components/Separator";
import { useDispatch, useSelector } from "react-redux";
import { clearShoppingList, generateShoppingList } from "../store/shoppingListSlice";
import { Swipeable } from "react-native-gesture-handler";
import { deleteRecipeFromMenu } from "../store/menuSlice";

const MenuScreen = ({ navigation }) => {
  const menu = useSelector((state) =>  state.menu.menu)
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

  const menuTableItem = ({ item, index }) => {
    const recipeID = item[0]
    const recipe = item[1]

    const deleteMenuItem = () => {
      dispatch(deleteRecipeFromMenu(recipeID))
    }
    const renderRightActions = () => {
      return (
        <View
        style= {{
        }}
        >
          <TouchableOpacity
          style={{
            padding: 5,
            borderRadius: 7,
            flex: 1,
            justifyContent: "center",
          }}
          onPress={() => deleteMenuItem(recipeID)}
          >
            <Text
              style={{
                color: "red"
              }}
            >Delete</Text>
          </TouchableOpacity>
          {/* <Button
            title="Delete"
            color={"red"}
            style= {{
              flex: 1,
              margin: 0,
              padding: 0,
            }}
            onPress={() => deleteMenuItem(index)}
          >
          </Button> */}
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
          borderWidth: 1
        }}>
          <View style={{flex: 4, alignItems: "center"}}>
            <Text>{recipe.name.toString()}</Text>
          </View>
          <View style={{flex: 4, alignItems: "center"}}>
            <Text>{index}</Text>
          </View>
          <View 
          style={{
          }}>
          </View>
        </View>
      </Swipeable>
    )
  }

  return (
    <View
    style={{
      flex: 1
    }}
    >
        <FlatList 
        data={Object.entries(menu)} 
        renderItem={menuTableItem} 
        keyExtractor={(item, index) => 
        {
          return item[0]
        }}
        ItemSeparatorComponent={Separator}
        />
    </View>
  )
}

export default MenuScreen;