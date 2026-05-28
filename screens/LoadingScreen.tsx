import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
} from "react-native";

import {
  useEffect,
  useRef,
} from "react";

export default function LoadingScreen() {

  const fadeAnim =
    useRef(
      new Animated.Value(0.3)
    ).current;

  useEffect(() => {

    Animated.loop(

      Animated.sequence([

        Animated.timing(
          fadeAnim,
          {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }
        ),

        Animated.timing(
          fadeAnim,
          {
            toValue: 0.3,
            duration: 900,
            useNativeDriver: true,
          }
        ),

      ])

    ).start();

  }, []);

  return (

    <View style={styles.container}>

      <Image
        source={require("../assets/images/procode.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Animated.Text
        style={[
          styles.loading,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        Loading...
      </Animated.Text>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    width: 360,
    height: 180,
    marginBottom: 30,
    marginTop: -70,
  },

  loading: {
  position: "absolute",
  bottom: 110,
  color: "#888",
  fontSize: 16,
  letterSpacing: 1,
},

});