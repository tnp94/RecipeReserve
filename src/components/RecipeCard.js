import { StyleSheet, View, Text, Image, FlatList, Alert, TouchableOpacity } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { deleteRecipe } from "../store/recipesSlice";
import { addRecipeToMenu } from "../store/menuSlice";
import { useRef } from "react";

const RecipeCard = ({ recipeName, index }) => {
  const navigation = useNavigation()
  const recipe = useSelector((state) => state.recipes[recipeName])
  const dispatch = useDispatch()
  const ref = useRef(null)

  const closeRef = () => {
    ref.current.close()
  }
  
  function recipeLongPress(index) {
    Alert.alert('Recipe actions', 'My Alert Msg', [
    {
      text: 'Cancel',
      onPress: () => console.log('Cancel Pressed'),
      style: 'cancel',
    },
    {text: 'Add to menu', onPress: () => dispatch(addRecipeToMenu(recipe))},
    {text: 'Delete', onPress: () => dispatch(deleteRecipe(recipeName))},
    ]);
  }
  const renderRightActions = () => {
    return (
      <View
      style= {{
        flexDirection: "column",
        gap: 2
      }}
      >
        <TouchableOpacity
        style={{
          backgroundColor: "#ff4466",
          borderTopRightRadius: 16,
          borderBottomRightRadius: 16,
          // backgroundColor: "blue",
          justifyContent: "center",
          flex: 1
        }}
        onPress={() => {
          closeRef()
          dispatch(dispatch(deleteRecipe(recipeName)))
        }}
        >
          <Text
            style={{
              padding: 5,
              color: "black",
              fontWeight: "bold"
            }}
          >Delete</Text>
        </TouchableOpacity>
      </View>
    )
  }
  const renderLeftActions = () => {
    return (
      <View
      style= {{
        flexDirection: "column",
        gap: 2
      }}
      >
        <TouchableOpacity
        style={{
          backgroundColor: "#99ccff",
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
          // backgroundColor: "blue",
          justifyContent: "center",
          flex: 1
        }}
        onPress={() => {
          closeRef()
          dispatch(addRecipeToMenu(recipe))
        }}
        >
          <Text
            style={{
              padding: 5,
              color: "black",
            }}
          >Add to Menu</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (recipe) 
    return (
      <View
        style= {{
          margin: 5,
          shadowOffset: {
            width: 0,
            height: 4
          },
          shadowColor: "#000",
          shadowOpacity: 0.1,
        }}
      >
        <Swipeable
          ref={ref}
          renderRightActions={renderRightActions}
          renderLeftActions={renderLeftActions}
          overshootFriction={8}
          key={recipeName}
          onSwipeableWillOpen={(direction) => {
            // if (direction == "left")
            console.log(ref);
          }}
        >
          <TouchableOpacity 
          onPress={() => navigation.navigate("Recipe Details",  { recipeName } )}
          onLongPress={() => {recipeLongPress(index)}}
          key={index}
          style={{
            padding: 5,
            backgroundColor: '#fff',
            borderColor: "#333",
            borderRadius: 16,
            alignItems: "center",
            flex: 1
          }}
          >
            <Image
            style={{
              width: 70,
              height: 70,
              borderRadius: 20
            }}
            source={require("../../assets/images/ForkAndSpoon.png")} />
            <Text style={{
              flexWrap: "wrap",
              flex: 1,
              paddingHorizontal: 5,
            }}>{index} {recipe.name}</Text>
            <Text 
            style={{
              fontSize: 12,
            }}>
              Time: {(recipe.time.prep + recipe.time.active) !== 0 ? ( + (recipe.time.prep + recipe.time.active) + " minutes") : "?"}
              {recipe.difficulty !== "" && (" | Difficulty: " + recipe.difficulty)}
            </Text>
          </TouchableOpacity>
        </Swipeable>
      </View>
    )
}

export default RecipeCard;