import { StyleSheet, View, Text, Image, TouchableOpacity, Button } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native"
import { useEffect } from "react";

const RecipeDetailsScreen = ({ route }) => {
  const navigation = useNavigation()
  const { recipeName } = route.params;
  const recipe = useSelector((state) => state.recipes[recipeName])
  useEffect(() => {
    navigation.setOptions(
      {
        headerRight: () => (
          <Button
            onPress={() => {
              navigation.navigate("Recipe Form", { recipeName: recipeName })
            }}
            title="Edit/copy"
          />
        ),
      }
    )
  }, [ recipe.name ]);
  if (recipe)
  return (
    <ScrollView>
        <Text style={{
          fontSize: 36, 
          textAlign: "center",
          fontWeight: "bold"
          }}>
          {recipe.name}
        </Text>

          <Text 
            style={{
          textAlign: "center",
          fontSize: 12,
            }}>
            Prep Time: {(recipe.time.prep) !== 0 ? ( + (recipe.time.prep) + " minutes ") : "? "}
          </Text>
          <Text 
            style={{
          textAlign: "center",
          fontSize: 12,
            }}>
            Active Time: {(recipe.time.active) !== 0 ? ( + (recipe.time.active) + " minutes") : "?"}
          </Text>
        <Text style={{
          textAlign: "center",
          marginBottom: 12,
        }}>
          <Text 
            style={{
              fontSize: 12,
            }}>
            {recipe.difficulty !== "" && ("Difficulty: " + recipe.difficulty)}
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
            {recipe.ingredients.map(( ingredient, index ) => 
            <Text style={{
              paddingHorizontal: 10
            }}
            key={ingredient.name + index.toString()}>
              {ingredient.quantityUnit} {ingredient.unit} {ingredient.name} {ingredient.note ? `(${ingredient.note})` : ""}
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
            {recipe.directions.map(( step, index ) => 
              <Text style={{
                paddingHorizontal: 10,
                marginBottom: 5
              }}
              key={index}>
                <Text style={{fontWeight: "bold"}}>{index + 1}.</Text> {step}
              </Text>
            )}
        </View>
        <View>
          {/* {recipe.image && <Image src={require(recipe.image)}/>} */}
        </View>
    </ScrollView>
  )
}

export default RecipeDetailsScreen;