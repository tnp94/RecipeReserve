import { StyleSheet, View, Text, Image, Button } from "react-native";

const WelcomeScreen = ({ navigation }) => {
    return (
        <View style={{ flex: 1, alignItems: "center" }}>
            <Image style={{
                width: "100%"
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

        </View>
    )
}

export default WelcomeScreen;