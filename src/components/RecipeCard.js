import { StyleSheet, View, Text, Image, FlatList, Alert, TouchableOpacity } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { deleteRecipe } from "../store/recipesSlice";
import { addRecipeToMenu } from "../store/menuSlice";
import { useRef, useState } from "react";

const RecipeCard = ({ recipeName, index }) => {
  const navigation = useNavigation()
  const recipe = useSelector((state) => state.recipes[recipeName])
  const dispatch = useDispatch()
  const ref = useRef(null)
  const [swipedLeft, setSwipedLeft] = useState(false)
  const [swipedRight, setSwipedRight] = useState(false)

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
      style={styles.swipeableButtoncontainer}
      >
        <TouchableOpacity
        style={styles.swipableRightButton}
        onPress={() => {
          closeRef()
          dispatch(dispatch(deleteRecipe(recipeName)))
        }}
        >
          <Text
            style={styles.swipeableButtonText}
          >Delete</Text>
        </TouchableOpacity>
      </View>
    )
  }
  const renderLeftActions = () => {
    return (
      <View
      style={styles.swipeableButtoncontainer}
      >
        <TouchableOpacity
        style={styles.swipableLeftButton}
        onPress={() => {
          closeRef()
          dispatch(addRecipeToMenu(recipe))
        }}
        >
          <Text
            style={styles.swipeableButtonText}
          >Add to Menu</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (recipe) 
    return (
      <View
        style={styles.cardContainer}
      >
        <Swipeable
          ref={ref}
          renderRightActions={renderRightActions}
          renderLeftActions={renderLeftActions}
          overshootFriction={8}
          key={recipeName}
          onSwipeableWillOpen={(direction) => {
            setSwipedLeft(direction == "left")
            setSwipedRight(direction == "right")
          }}
          onSwipeableWillClose={(direction) => {
            setSwipedLeft(false)
            setSwipedRight(false)
          }}
        >
          <TouchableOpacity 
          onPress={() => navigation.navigate("Recipe Details",  { recipeName } )}
          onLongPress={() => {recipeLongPress(index)}}
          key={index}
          style={[styles.cardButton, (swipedLeft && styles.flattenLeft), (swipedRight && styles.flattenRight)]}
          >
            <Image
            style={styles.recipeImage}
            source={require("../../assets/images/ForkAndSpoon.png")} />
            <View style={styles.recipeDetailsContainer}>
              <Text style={styles.recipeTitle}>{recipe.name}</Text>
              <Text 
              style={styles.recipeSubtitle}>
                Time: {(recipe.time.prep + recipe.time.active) !== 0 ? ( + (recipe.time.prep + recipe.time.active) + " minutes") : "?"}
                {recipe.difficulty !== "" && (" | Difficulty: " + recipe.difficulty)}
              </Text>
            </View>
          </TouchableOpacity>
        </Swipeable>
      </View>
    )
}

const styles = StyleSheet.create({
  swipableLeftButton: {
    backgroundColor: "#99ccff",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    // backgroundColor: "blue",
    justifyContent: "center",
    flex: 1
  },
  swipableRightButton: {
    backgroundColor: "#ff4466",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    // backgroundColor: "blue",
    justifyContent: "center",
    flex: 1,
  },
  cardContainer: {
    margin: 5,
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowColor: "#000",
    shadowOpacity: 0.1,
  },
  cardButton: {
    backgroundColor: '#fff',
    borderColor: "#333",
    borderRadius: 16,
    alignItems: "center",
    flex: 1,
    height: 150,
    overflow: "hidden"
  },
  recipeImage: {
    width: "100%",
    flex: 2,
    overflow: "hidden"
    // borderTopLeftRadius: 16,
    // borderTopRightRadius: 16,
  },
  recipeTitle: {
    flexWrap: "wrap",
    paddingHorizontal: 5,
    fontWeight: "bold"
  },
  recipeSubtitle: {
    textAlign: "center",
    fontSize: 12,
  },
  swipeableButtonText: {
    padding: 5,
    color: "black",
    fontWeight: "bold",
    textAlign: "center",
  },
  recipeDetailsContainer: {
    padding: 5
  },
  swipeableButtoncontainer: {
    flexDirection: "column",
    gap: 2,
    maxWidth: "40%",
  },
  flattenRight: {
    borderBottomRightRadius: 0,
    borderTopRightRadius: 0,
  },
  flattenLeft: {
    borderBottomLeftRadius: 0,
    borderTopLeftRadius: 0,
  }
})

export default RecipeCard;