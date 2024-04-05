import { StyleSheet, View, Text, TouchableOpacity, FlatList, TextInput, Button, TouchableWithoutFeedback, Keyboard } from "react-native";
import storage from "../Storage";
// import { recipeList } from "../Recipes";
import { useEffect, useState } from "react";
import { ingredientTemplate } from "../Models/Ingredient";
import { useDispatch } from "react-redux";
import { addRecipe } from "../store/recipeListSlice";

const NewRecipeScreen = ( { navigation } ) => {
  const dispatch = useDispatch()

  const state = {
    id: 0,
    name: "",
    image: "",
    count: 0,
    ingredients: [
    ],
    time: {
    },
    difficulty: "",
    calories: 0,
    favorite: false,
    dishesAmount: "",
    yield: 0,
    directions: [
    ]
  }
  const [data, setData] = useState(state)
  
  useEffect(() => {
      navigation.setOptions(
        {
          headerRight: () => (
            <Button
              onPress={() => {
                console.log('This is a button!')
                onSaveButtonPress(data)
              }}
              title="Save"
            />
          ),
        }
      )
    }, [ data ]);

  const onSaveButtonPress = (newRecipe) => {
    console.log(newRecipe)
    SaveNewRecipe(data)
  }

  const SaveNewRecipe = ( newRecipe ) => {
    storage.load({key: "recipeList"}).then((recipeList) => {
      recipeList.push(newRecipe)
      // storage.save({
      //   key: "recipeList",
      //   data: recipeList,
      //   expires: null
      // })
      dispatch(addRecipe(newRecipe))
      alert("Saved");
      // navigation.navigate("My Recipes")
    })
  }



  const updateIngredientName = (text, index) => {
    var ingredients = [...data.ingredients]
    ingredients[index].name = text
    setData({...data, ingredients: ingredients})
    // console.log(data.ingredients);
  }

  const updateIngredientNote = (text, index) => {
    var ingredients = [...data.ingredients]
    ingredients[index].note = text
    setData({...data, ingredients: ingredients})
    // console.log(data.ingredients);
  }

  const updateIngredientCategory = (text, index) => {
    var ingredients = [...data.ingredients]
    ingredients[index].category = text
    setData({...data, ingredients: ingredients})
    // console.log(data.ingredients);
  }

  const updateIngredientUnit = (text, index) => {
    var ingredients = [...data.ingredients]
    ingredients[index].unit = text
    setData({...data, ingredients: ingredients})
    // console.log(data.ingredients);
  }

  const updateIngredientQuantityUnit = (text, index) => {
    var ingredients = [...data.ingredients]
    ingredients[index].quantityUnit = text
    setData({...data, ingredients: ingredients})
    console.log(data);
    // console.log(data.ingredients);
  }

  const deleteIngredient = (index) => {
    var ingredients = [...data.ingredients]
    ingredients.splice(index, 1)
    setData({...data, ingredients: ingredients})
  }

  const updateDirection = (text, index) => {
    var directions = [...data.directions]
    directions[index] = text
    setData({...data, directions: directions})
    // console.log(data.ingredients);
  }
  
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
        placeholder = {data.name || "Recipe Name"}
        onChangeText={(text) => {
          setData({...data, name: text})
        }}
        >

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
        placeholder = {data.difficulty || "Easy/Medium/Hard"}
        onChangeText={(text) => {
          setData({...data, difficulty: text})
        }}>

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
          Recipe Time
        </Text>
        <Text
        style={{
          fontSize: 18
        }}
        >
          Prep time (minutes)
        </Text>
        <TextInput 
        inputMode="numeric"
        style={{
          backgroundColor: "#fff",
          padding: 5
        }}
        placeholder = {data.time.prep?.toString() || "20"}
        onChangeText={(text) => {
          if (/^\d+$/.test(text) || text === "") 
          {
            var time = {...data}.time
            setData({...data, time: {active: data.time.active, prep: Number.parseFloat(text)}})

          }
        }}>

        </TextInput>
        <Text
        style={{
          fontSize: 18 
        }}
        >
          Active time (minutes)
        </Text>
        <TextInput 
        inputMode="numeric"
        style={{
          backgroundColor: "#fff",
          padding: 5
        }}
        placeholder = {data.time.active?.toString() || "90"}
        onChangeText={(text) => {
          if (/^\d+$/.test(text) || text === "") 
          {
            var time = {...data}.time
            setData({...data, time: {prep: data.time.prep, active: Number.parseFloat(text)}})

          }
        }}>

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
            onPress={() => {
              if (Keyboard.isVisible()) {
                Keyboard.dismiss()
              } else {
                setData({...data, ingredients: [...data.ingredients, ingredientTemplate()]})
              }
            }}>
              <Text>New Ingredient</Text>
            </TouchableOpacity>
          </View>
        </View>
        <FlatList
        data={data.ingredients}
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
            onChangeText={(text) => {
              updateIngredientQuantityUnit(text, index)
            }
            }/>

            <TextInput style={{
              paddingHorizontal: 10,
              backgroundColor: "#fff"
            }}
            placeholder = {item.unit || "Unit"}
            onChangeText={(text) => {
              updateIngredientUnit(text, index)
            }
            }/>

            <TextInput style={{
              paddingHorizontal: 10,
              backgroundColor: "#fff"
            }}
            placeholder = {item.name || "Ingredient Name"}
            onChangeText={(text) => {
              updateIngredientName(text, index)
            }
            }/>

            <TextInput style={{
              paddingHorizontal: 10,
              backgroundColor: "#fff"
            }}
            placeholder = {item.note || "Note:Minced?/Softened?/Trimmed?"}
            onChangeText={(text) => {
              updateIngredientNote(text, index)
            }
            }/>

            <TextInput style={{
              paddingHorizontal: 10,
              backgroundColor: "#fff"
            }}
            placeholder = {item.category || "Category"}
            onChangeText={(text) => {
              updateIngredientCategory(text, index)
            }
            }/>


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
              // console.log(index)
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

      <View>
        <View>
          <View style={{flexDirection: "row"}}>
            <Text>Directions</Text>
            <TouchableOpacity
            style={{
              backgroundColor: "skyblue",
              padding: 5,
              borderRadius: 7,
              flex: 1,
              justifyContent: "center"
            }}
            onPress={() => {
              if (Keyboard.isVisible()) {
                Keyboard.dismiss()
              } else {
                setData({...data, directions: [...data.directions, ""]})
              }
            }}>
              <Text>New Direction</Text>
            </TouchableOpacity>
          </View>
        </View>
        <FlatList
        data={data.directions}
        
        renderItem={ ( { item, index } ) => (
          <View
          style={{
            flexDirection: "row"
          }}
          >
            <Text>{index + 1}</Text>
            <TextInput style={{
              paddingHorizontal: 10,
              backgroundColor: "#fff",
              flex: 7
            }}
            placeholder = {item.quantityUnit || "?"}
            onChangeText={(text) => {
              updateDirection(text, index)
            }
            }/>

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
              // console.log(index)
              setIngredients([...ingredients])
            }}>
              <Text
              style={{
                color: "red",
              }}
              >Delete</Text>
            </TouchableOpacity>
          </View>
        )}/>
      </View>

    </View>
    </TouchableWithoutFeedback>
  )
}

export default NewRecipeScreen;