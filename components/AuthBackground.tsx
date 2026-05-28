import {
  View,
  StyleSheet,
} from "react-native";

import {
  LinearGradient,
} from "expo-linear-gradient";

export default function AuthBackground({
  children,
}: any) {

  return (

    <LinearGradient
      colors={[
        "#020617",
        "#050A30",
        "#12002F",
      ]}
      style={styles.container}
    >

      <View style={styles.line1} />
      <View style={styles.line2} />
      <View style={styles.line3} />

      <View style={styles.codeLeft}>
      </View>

      <View style={styles.codeRight}>
      </View>

      {children}

    </LinearGradient>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  line1: {
    position: "absolute",
    width: 2,
    height: 900,
    backgroundColor: "rgba(168,85,247,0.18)",
    transform: [{ rotate: "40deg" }],
    left: 40,
    top: -120,
  },

  line2: {
    position: "absolute",
    width: 2,
    height: 900,
    backgroundColor: "rgba(168,85,247,0.15)",
    transform: [{ rotate: "40deg" }],
    right: 60,
    top: -150,
  },

  line3: {
    position: "absolute",
    width: 2,
    height: 900,
    backgroundColor: "rgba(168,85,247,0.12)",
    transform: [{ rotate: "40deg" }],
    left: 200,
    top: -120,
  },

  codeLeft: {
    position: "absolute",
    left: 25,
    top: 140,
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(168,85,247,0.08)",
  },

  codeRight: {
    position: "absolute",
    right: 25,
    top: 300,
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(168,85,247,0.08)",
  },

});