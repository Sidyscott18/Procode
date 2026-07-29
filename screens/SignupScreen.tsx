import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";

import {
  handleGoogleSignIn,
} from "../services/googleAuth";

import {
  router,
} from "expo-router";

import {
  AntDesign,
} from "@expo/vector-icons";

import {
  LinearGradient,
} from "expo-linear-gradient";

import {
  useState,
} from "react";

import {
  Alert,
} from "react-native";

import {
  signupUser,
} from "../services/auth";

import AuthBackground
from "../components/AuthBackground";

export default function SignupScreen() {
  const [email, setEmail] =
  useState("");

  const [password, setPassword] =
    useState("");

  const handleSignup =
    async () => {

      if (
        !email ||
        !password
      ) {

        Alert.alert(
          "Missing Fields",
          "Please fill all fields."
        );

        return;
      }

      try {

        await signupUser(
          email,
          password
        );

        router.replace("/verify-email");

      } catch (error: any) {

        Alert.alert(
          "Signup Error",
          error.message
        );
      }
  };
  return (

    <AuthBackground>

      <Image
        source={require("../assets/images/procode.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>
        Welcome to Procode
      </Text>

      <Text style={styles.subtitle}>
        Start your learning journey
      </Text>

      <View style={styles.card}>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#777"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#777"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.buttonContainer}
          onPress={handleSignup}
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
              Create Account
            </Text>

          </LinearGradient>

        </TouchableOpacity>

        <Text style={styles.or}>
          OR
        </Text>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
        >

          <AntDesign
            name="google"
            size={22}
            color="#000000"
          />

          <Text style={styles.googleText}>
            Continue with Google
          </Text>

        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push("/login")
          }
        >

          <Text style={styles.loginTextBottom}>
            Already have an account? Login
          </Text>

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
  },

  card: {
    width: "88%",
    backgroundColor: "rgba(17,24,39,0.92)",
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  input: {
    height: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    paddingHorizontal: 18,
    marginBottom: 18,
    color: "#fff",
    fontSize: 16,
  },

  buttonContainer: {
    width: "100%",
    height: 60,
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 4,
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

  or: {
    color: "#888",
    textAlign: "center",
    marginVertical: 20,
  },

  googleButton: {
    width: "100%",
    height: 58,
    borderRadius: 18,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
    
  googleText: {
    color: "#111",
    fontSize: 16,
    fontWeight: "600",
  },

  loginTextBottom: {
    color: "#B794F4",
    textAlign: "center",
    marginTop: 24,
    fontSize: 15,
    fontWeight: "600",
  },

});