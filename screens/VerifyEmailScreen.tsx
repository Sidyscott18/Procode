import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";

import {
  LinearGradient,
} from "expo-linear-gradient";

import AuthBackground
from "../components/AuthBackground";

export default function VerifyEmailScreen() {
  return (

    <AuthBackground>

      <Image
        source={require("../assets/images/procode.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>
        Check Your Email
      </Text>

      <Text style={styles.subtitle}>
        Verify your email to continue your Procode journey
      </Text>

      <View style={styles.card}>

        <Text style={styles.message}>
          We've sent a verification link to your email address.
        </Text>

        <View style={styles.noticeBox}>

          <Text style={styles.noticeText}>
            Can't find the email?
          </Text>

          <Text style={styles.noticeText}>
            Check your Spam or Junk folder.
          </Text>

        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.buttonContainer}
        >

          <LinearGradient
            colors={[
              "#7C3AED",
              "#9333EA",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          >

            <Text style={styles.buttonText}>
              I've Verified My Email
            </Text>

          </LinearGradient>

        </TouchableOpacity>

      </View>

    </AuthBackground>
  );
}

const styles = StyleSheet.create({

  logo: {
    width: 250,
    height: 90,
    marginBottom: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
  },

  subtitle: {
    color: "#A1A1AA",
    marginTop: 8,
    marginBottom: 35,
    fontSize: 16,
    textAlign: "center",
  },

  card: {
    width: "88%",
    backgroundColor: "rgba(17,24,39,0.92)",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  message: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },

  noticeBox: {
    marginTop: 24,
    marginBottom: 24,
    backgroundColor: "rgba(124,58,237,0.08)",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.25)",
    borderRadius: 18,
    padding: 16,
  },

  noticeText: {
    color: "#B794F4",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
  },

  buttonContainer: {
    width: "100%",
    height: 60,
    borderRadius: 18,
    overflow: "hidden",
  },

  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

});