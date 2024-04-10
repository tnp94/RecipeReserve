import { StyleSheet, View, Text, Image, Button } from "react-native";
import { useDispatch } from "react-redux";
import { loadRecipeList } from "../store/recipeSlice";
import { clearMenu } from "../store/menuSlice";
import { clearShoppingList } from "../store/shoppingListSlice";

const WelcomeScreen = ({ navigation }) => {
    const dispatch = useDispatch()
    return (
        <View style={{ flex: 1, alignItems: "center" }}>
            <Image style={{
                width: "100%",
                height: "60%"
            }}
                source={require("../../assets/images/ForkAndSpoon.png")}
            />
            <Text style={{ color: "#f96163", fontSize: 22, fontWeight: "bold" }}>
                Your recipe management application
            </Text>
            
            <Text style={{ color: "#333", fontSize: 40, fontWeight: "bold" }}>
                Make meal planning easy
            </Text>

            <Button
                title="letsgo"
                onPress={() => navigation.navigate("RecipeList") }
            >
                Let's go!
            </Button>
            <Button
                title="Reset RecipeList data"
                onPress={() => dispatch(loadRecipeList()) }
            >
            </Button>
            <Button
                title="Reset menu data"
                onPress={() => dispatch(clearMenu()) }
            >
            </Button>
            <Button
                title="Reset shopping list"
                onPress={() => dispatch(clearShoppingList()) }
            >
            </Button>

        </View>
    )
}

export default WelcomeScreen;