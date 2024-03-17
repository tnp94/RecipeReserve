import { StyleSheet, View, Text, Image } from "react-native";

const Header = ({ headerText, headerIcon }) => {
    return (
        <View>
          <Image style={{width: 24, height: 24}} source={require("../../assets/icon.png")} />
          <Text>
            {headerText}
          </Text>
        </View>
    )
}

export default Header;