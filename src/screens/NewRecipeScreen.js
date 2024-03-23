import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet, View, Text, TouchableOpacity, FlatList, TextInput } from "react-native";
import storage from "../Storage";
import { recipeList } from "../Recipes";
import { useState } from "react";
import Ingredient from "../Models/Ingredient";

const NewRecipeScreen = () => {
  // console.log(JSON.stringify(recipeList));
  storage.save({
    key: "recipeList",
    data: recipeList,
    expires: null
  })
  function SaveNewRecipe( newRecipe ){
    
  }
  var newRecipeDirections = []
  var newRecipeIngredients = [
    {
      name: "Ingredient 1",
      unit: "Cup",
      quantityUnit: "1",
    },
    {
      name: "Ingredient 2",
      unit: "Tbsp",
      quantityUnit: "1",
    },
  ]

  const [ingredients, setIngredients] = useState(newRecipeIngredients)
  console.log(ingredients)
  
  return (
    <View
    style={{
      padding: 5
    }}
    >
        <Text
        style={{
          fontSize: 32,
          alignSelf: "center",
          marginBottom: 10
        }}
        >
          Let's add a new Recipe!
        </Text>
      <View
      style={{
        marginBottom: 10
      }}
      >
        <Text
        style={{
          fontSize: 24
        }}
        >
          Recipe Name
        </Text>
        <TextInput 
        style={{
          backgroundColor: "#fff",
          padding: 5
        }}
        placeholder="Recipe Name">

        </TextInput>
      </View>
      <View
      style={{
        marginBottom: 10
      }}
      >
        <Text
        style={{
          fontSize: 24
        }}
        >
          Recipe difficulty
        </Text>
        <TextInput 
        style={{
          backgroundColor: "#fff",
          padding: 5
        }}
        placeholder="Easy/Medium/Hard">

        </TextInput>
      </View>

      <View>
        <View>
          <View style={{flexDirection: "row"}}>
            <Text>Ingredients</Text>
            <TouchableOpacity
            style={{
              backgroundColor: "skyblue",
              padding: 5,
              borderRadius: 7,
              flex: 1,
              justifyContent: "center"
            }}
            onPress={() => (setIngredients([...ingredients, new Ingredient()]))}>
              <Text>New Ingredient</Text>
            </TouchableOpacity>
          </View>
        </View>
        <FlatList
        data={ingredients}
        renderItem={ ( { item, index } ) => (
          <View
          style={{
            flexDirection: "row"
          }}
          >
            <TextInput style={{
              paddingHorizontal: 10,
              backgroundColor: "#fff"
            }}
            placeholder = {item.quantityUnit || "?"}
            value={item.quantityUnit}
            />

            <TextInput style={{
              paddingHorizontal: 10,
              backgroundColor: "#fff"
            }}
            placeholder = {item.unit || "Unit"}
            value={item.unit}
            />

            <TextInput style={{
              paddingHorizontal: 10,
              backgroundColor: "#fff"
            }}
            placeholder = {item.name || "Ingredient Name"}
            value={item.name}
            />
            <TouchableOpacity
            style={{
              backgroundColor: "#fff",
              padding: 5,
              borderRadius: 7,
              flex: 1,
              justifyContent: "center"
            }}
            onPress={() => {
              var newIngredientsList = ingredients.splice(index, 1);
              console.log(index)
              setIngredients([...ingredients])
            }}>
              <Text
              style={{
                color: "red"
              }}
              >Delete</Text>
            </TouchableOpacity>
          </View>
        )}/>
      </View>

    </View>
  )
}

export default NewRecipeScreen;