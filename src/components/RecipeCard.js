import { StyleSheet, View, Text, Image, TouchableOpacity, Platform } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { deleteRecipe, selectRecipeById, toggleFavorite } from "../store/recipesSlice";
import { addRecipeToMenu } from "../store/menuSlice";
import { useRef, useState } from "react";
import { useDialog } from "./dialog/DialogProvider";
import { colors } from "../theme";

const RecipeCard = ({ recipeId }) => {
  const navigation = useNavigation()
  const recipe = useSelector((state) => selectRecipeById(state, recipeId))
  const dispatch = useDispatch()
  const dialog = useDialog()
  const ref = useRef(null)
  const [swipedLeft, setSwipedLeft] = useState(false)
  const [swipedRight, setSwipedRight] = useState(false)

  const closeRef = () => {
    ref.current?.close()
  }

  const confirmDelete = () => {
    dialog.alert(`Delete "${recipe.name}"?`, "It will also be removed from your menu.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => dispatch(deleteRecipe(recipeId)) },
    ])
  }

  const showActions = () => {
    dialog.alert(recipe.name, undefined, [
      { text: "Add to menu", onPress: () => dispatch(addRecipeToMenu({ recipeId })) },
      { text: "Delete", style: "destructive", onPress: confirmDelete },
      { text: "Cancel", style: "cancel" },
    ])
  }

  const renderRightActions = () => {
    return (
      <View style={styles.swipeableButtoncontainer}>
        <TouchableOpacity
          style={styles.swipableRightButton}
          onPress={() => {
            closeRef()
            confirmDelete()
          }}
        >
          <Text style={styles.swipeableButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    )
  }
  const renderLeftActions = () => {
    return (
      <View style={styles.swipeableButtoncontainer}>
        <TouchableOpacity
          style={styles.swipableLeftButton}
          onPress={() => {
            closeRef()
            dispatch(addRecipeToMenu({ recipeId }))
          }}
        >
          <Text style={styles.swipeableButtonText}>Add to Menu</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!recipe) return null
  const totalTime = (Number(recipe.time?.prep) || 0) + (Number(recipe.time?.active) || 0)
  return (
    <View style={styles.cardContainer}>
      <Swipeable
        ref={ref}
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        overshootFriction={8}
        onSwipeableWillOpen={(direction) => {
          setSwipedLeft(direction == "left")
          setSwipedRight(direction == "right")
        }}
        onSwipeableWillClose={() => {
          setSwipedLeft(false)
          setSwipedRight(false)
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("Recipe Details", { recipeId })}
          onLongPress={showActions}
          style={[styles.cardButton, (swipedLeft && styles.flattenLeft), (swipedRight && styles.flattenRight)]}
        >
          <Image
            style={styles.recipeImage}
            source={require("../../assets/images/ForkAndSpoon.png")} />
          <View style={styles.recipeDetailsContainer}>
            <Text style={styles.recipeTitle}>{recipe.name}</Text>
            <Text style={styles.recipeSubtitle}>
              Time: {totalTime !== 0 ? totalTime + " minutes" : "?"}
              {recipe.difficulty !== "" && (" | Difficulty: " + recipe.difficulty)}
            </Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
      <TouchableOpacity
        style={styles.star}
        accessibilityRole="button"
        accessibilityLabel={recipe.favorite ? "Remove from favorites" : "Add to favorites"}
        onPress={() => dispatch(toggleFavorite(recipeId))}
      >
        <Text style={{ fontSize: 24, color: recipe.favorite ? colors.favorite : colors.muted }}>
          {recipe.favorite ? "★" : "☆"}
        </Text>
      </TouchableOpacity>
      {Platform.OS === "web" && (
        <TouchableOpacity
          style={styles.more}
          accessibilityRole="button"
          accessibilityLabel="Recipe actions"
          onPress={showActions}
        >
          <Text style={{ fontSize: 20, color: colors.muted }}>⋯</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  star: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  more: {
    position: "absolute",
    bottom: 2,
    right: 6,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
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
    elevation: 3,
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
    height: 90,
    resizeMode: "contain",
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