import { StyleSheet, View, Text, Image, TouchableOpacity, Button } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

const RecipeDetailsScreen = ({ route }) => {
  const { item } = route.params;
  return (
    <ScrollView>
        <Text style={{
          fontSize: 36, 
          textAlign: "center",
          fontWeight: "bold"
          }}>
          {item.name}
        </Text>

          <Text 
            style={{
          textAlign: "center",
          fontSize: 12,
            }}>
            Prep Time: {(item.time.prep) !== 0 ? ( + (item.time.prep) + " minutes ") : "? "}
          </Text>
          <Text 
            style={{
          textAlign: "center",
          fontSize: 12,
            }}>
            Active Time: {(item.time.active) !== 0 ? ( + (item.time.active) + " minutes") : "?"}
          </Text>
        <Text style={{
          textAlign: "center",
          marginBottom: 12,
        }}>
          <Text 
            style={{
              fontSize: 12,
            }}>
            {item.difficulty !== "" && ("Difficulty: " + item.difficulty)}
          </Text>
        </Text>
        <View style={{
          marginBottom: 12
        }}>
          <Text style={{
            fontSize: 20,
            // marginBottom: 12,
            fontWeight: "bold",
            paddingHorizontal: 5
            }}>
            Ingredients
          </Text>
            {item.ingredients.map(( ingredient ) => 
            <Text style={{
              paddingHorizontal: 10
            }}
            key={ingredient.name}>
              {ingredient.quantityUnit} {ingredient.unit} {ingredient.name}
            </Text>
            )}
        </View>
        <View style={{
          marginBottom: 12
        }}>
          <Text style={{
            fontSize: 20,
            // marginBottom: 12,
            fontWeight: "bold",
            paddingHorizontal: 5
            }}>
            Directions
          </Text>
            {item.directions.map(( step, index ) => 
            <Text style={{
              paddingHorizontal: 10
            }}
            key={index}>
              <Text style={{fontWeight: "bold"}}>{index + 1}.</Text> {step}
            </Text>
            )}
        </View>
    </ScrollView>
  )
}

export default RecipeDetailsScreen;