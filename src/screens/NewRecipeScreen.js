import { StyleSheet, View, Text, TouchableOpacity, FlatList, TextInput, Button, TouchableWithoutFeedback, Keyboard, ScrollView, KeyboardAvoidingView, Alert } from "react-native";
// import { recipeList } from "../Recipes";
import { useEffect, useState } from "react";
import { ingredientTemplate } from "../Models/Ingredient";
import { useDispatch, useSelector } from "react-redux";
import { addRecipe, deleteRecipe, editRecipe } from "../store/recipesSlice";
import { Separator } from "react-native-btr";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native"

const NewRecipeScreen = ({ navigation, route }) => {
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
              onSaveButtonPress(data)
            }}
            title="Save"
          />
        ),
      }
    )
  }, [data]);

  const onSaveButtonPress = (newRecipe) => {
    SaveNewRecipe(data)
    navigation.popToTop();
  }

  const SaveNewRecipe = (newRecipe) => {
    dispatch(addRecipe(newRecipe))
  }

  const updateIngredientName = (text, index) => {
    var ingredients = [...data.ingredients]
    ingredients[index].name = text
    setData({ ...data, ingredients: ingredients })
    // console.log(data.ingredients);
  }

  const updateIngredientNote = (text, index) => {
    var ingredients = [...data.ingredients]
    ingredients[index].note = text
    setData({ ...data, ingredients: ingredients })
    // console.log(data.ingredients);
  }

  const updateIngredientCategory = (text, index) => {
    var ingredients = [...data.ingredients]
    ingredients[index].category = text
    setData({ ...data, ingredients: ingredients })
    // console.log(data.ingredients);
  }

  const updateIngredientUnit = (text, index) => {
    var ingredients = [...data.ingredients]
    ingredients[index].unit = text
    setData({ ...data, ingredients: ingredients })
    // console.log(data.ingredients);
  }

  const updateIngredientQuantityUnit = (text, index) => {
    var ingredients = [...data.ingredients]
    ingredients[index].quantityUnit = text.toString()
    setData({ ...data, ingredients: ingredients })
    // console.log(data.ingredients);
  }

  const deleteIngredient = (index) => {
    var ingredients = [...data.ingredients]
    ingredients.splice(index, 1)
    setData({ ...data, ingredients: ingredients })
  }

  const updateDirection = (text, index) => {
    var directions = [...data.directions]
    directions[index] = text
    setData({ ...data, directions: directions })
    // console.log(data.ingredients);
  }

  return (
    <KeyboardAwareScrollView>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          nestedScrollEnabled={true}
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
              placeholder={"Recipe Name"}
              value={data.name}
              onChangeText={(text) => {
                setData({ ...data, name: text })
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
              placeholder={"Easy/Medium/Hard"}
              value={data.difficulty}
              onChangeText={(text) => {
                setData({ ...data, difficulty: text })
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
              placeholder={"20"}
              value={data.time?.prep?.toString()}
              onChangeText={(text) => {
                if (/^\d+$/.test(text)) {
                  setData({ ...data, time: { active: data.time.active, prep: Number.parseFloat(text) } })
                } else if (text === "") {
                  setData({ ...data, time: { active: data.time.active, prep: "" } })
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
              placeholder={"90"}
              value={data.time?.active?.toString()}
              onChangeText={(text) => {
                if (/^\d+$/.test(text)) {
                  setData({ ...data, time: { prep: data.time.prep, active: Number.parseFloat(text) } })
                } else if (text === "") {
                  setData({ ...data, time: { prep: data.time.prep, active: "" } })
                }
              }}>

            </TextInput>
          </View>

          <View style={{
          }}>
            <View style={{
            }}>
              <View style={{
                flexDirection: "row",
              }}>
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
                      setData({ ...data, ingredients: [...data.ingredients, ingredientTemplate()] })
                    }
                  }}>
                  <Text>New Ingredient</Text>
                </TouchableOpacity>
              </View>
            </View>
            <FlatList
              scrollEnabled={false}
              data={data.ingredients}
              ItemSeparatorComponent={<Separator />}
              renderItem={({ item, index }) => (
                <View style={{
                  flexDirection: "column",
                  borderWidth: 1,
                }}>
                  <View
                    style={{
                      flexDirection: "row"
                    }}
                  >
                    <TextInput style={{
                      paddingHorizontal: 5,
                      backgroundColor: "#fff",
                      borderWidth: 1,
                      borderColor: "#eee",
                    }}
                      placeholder={"#"}
                      value={item.quantityUnit.toString()}
                      onChangeText={(text) => {
                        updateIngredientQuantityUnit(text, index)
                      }
                      }/>

                    <TextInput style={{
                      paddingHorizontal: 5,
                      backgroundColor: "#fff",
                    }}
                      placeholder={"Unit"}
                      value={item.unit.toString()}
                      onChangeText={(text) => {
                        updateIngredientUnit(text, index)
                      }
                      }/>

                    <TextInput style={{
                      paddingHorizontal: 10,
                      backgroundColor: "#fff",
                      flex: 1
                    }}
                      placeholder={"Ingredient Name"}
                      value={item.name.toString()}
                      onChangeText={(text) => {
                        updateIngredientName(text, index)
                      }
                      }/>
                  </View>
                  <View
                    style={{
                      flexDirection: "row"
                    }}
                  >
                    <TextInput style={{
                      paddingHorizontal: 10,
                      backgroundColor: "#fff",
                      flex: 1
                    }}
                      placeholder={"Note:Minced?/Softened?/Trimmed?"}
                      value={item.note}
                      onChangeText={(text) => {
                        updateIngredientNote(text, index)
                      }
                      } />

                    <TextInput style={{
                      paddingHorizontal: 10,
                      backgroundColor: "#fff",
                      flex: 1
                    }}
                      placeholder={"Category"}
                      value={item.category}
                      onChangeText={(text) => {
                        updateIngredientCategory(text, index)
                      }
                      } />


                    <TouchableOpacity
                      style={{
                        backgroundColor: "#fff",
                        padding: 5,
                        borderRadius: 7,
                        flex: 1,
                        justifyContent: "center"
                      }}
                      onPress={() => {
                        var newIngredientsList = [...data.ingredients]
                        newIngredientsList.splice(index, 1);
                        // console.log(index)
                        setData({ ...data, ingredients: [...newIngredientsList] })
                      }}>
                      <Text
                        style={{
                          color: "red"
                        }}
                      >Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}/>
          </View>

          <View>
            <View>
              <View style={{ flexDirection: "row"}}>
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
              scrollEnabled={false}
              data={data.directions}
              ItemSeparatorComponent={<Separator />}
              renderItem={({ item, index }) => (
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
                    placeholder={"?"}
                    value={item}
                    multiline={true}
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
                      var newDirectionsList = [...data.directions]
                      newDirectionsList.splice(index, 1);
                      // console.log(index)
                      setData({...data, directions: [...newDirectionsList]})
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

        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  )
}

export default NewRecipeScreen;