import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import { useState, useEffect } from "react";

import { router } from "expo-router";

import { LinearGradient } from "expo-linear-gradient";

import AuthBackground from "../components/AuthBackground";

import { auth } from "../services/firebase";

import {
  usernameExists,
  createUserProfile,
} from "../services/userService";

import {
  validateUsername,
} from "../services/usernameFilter";

export default function UsernameSetupScreen() {

  const [step, setStep] =
    useState(1);

  const [username, setUsername] =
    useState("");

  const [checking, setChecking] =
    useState(false);

  const [available, setAvailable] =
    useState<boolean | null>(null);

  const [statusText, setStatusText] =
    useState("");

  useEffect(() => {

    if (step !== 2)
      return;

    if (!username.trim()) {

      setAvailable(null);
      setStatusText("");

      return;
    }

    const timer =
      setTimeout(async () => {

        const validation =
          validateUsername(
            username
          );

        if (validation) {

          setAvailable(false);

          setStatusText(
            validation
          );

          return;
        }

        try {

          setChecking(true);

          const exists =
            await usernameExists(
              username.toLowerCase()
            );

          if (exists) {

            setAvailable(false);

            setStatusText(
              "✗ This coder name is already taken"
            );

          } else {

            setAvailable(true);

            setStatusText(
              "✓ Coder name available"
            );
          }

        } catch {

          setAvailable(false);

          setStatusText(
            "Unable to check username"
          );

        } finally {

          setChecking(false);
        }

      }, 500);

    return () =>
      clearTimeout(timer);

  }, [username, step]);

  const saveUsername =
    async () => {

      if (!available)
        return;

      const user =
        auth.currentUser;

      if (!user)
        return;

      try {

        await createUserProfile(
          user.uid,
          user.email || "",
          username,
          username.toLowerCase()
        );

        setStep(3);

      } catch {

        Alert.alert(
          "Error",
          "Unable to save profile."
        );
      }
    };

  const getScottImage =
    () => {

      if (step === 1) {

        return require(
          "../assets/scott/scott_normal.png"
        );
      }

      if (step === 2) {

        return require(
          "../assets/scott/scott_wave.png"
        );
      }

      return require(
        "../assets/scott/scott_happy.png"
      );
    };

  return (

    <AuthBackground>

      <Image
        source={getScottImage()}
        style={styles.scott}
        resizeMode="contain"
      />

      <View style={styles.card}>

        {step === 1 && (

          <>

            <Text style={styles.title}>
              Hii!! I'm Scott 👋
            </Text>

            <Text style={styles.subtitle}>
              I'm the coding pup that'll help you throughout your coding journey!
            </Text>

            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() =>
                setStep(2)
              }
            >

              <LinearGradient
                colors={[
                  "#7C3AED",
                  "#9333EA",
                ]}
                style={styles.arrowGradient}
              >

                <Text style={styles.arrowText}>
                    →
                </Text>

              </LinearGradient>

            </TouchableOpacity>

          </>

        )}

        {step === 2 && (

          <>

            <Text style={styles.title}>
              How may I call you? 🐾
            </Text>

            <Text style={styles.subtitle}>
              Choose a unique coder name.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your coder name"
              placeholderTextColor="#777"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            {checking ? (

              <ActivityIndicator
                color="#B794F4"
              />

            ) : (

              <Text
                style={[
                  styles.status,
                  {
                    color:
                      available
                        ? "#22C55E"
                        : "#EF4444",
                  },
                ]}
              >
                {statusText}
              </Text>

            )}

            <TouchableOpacity
              style={[
                styles.arrowButton,
                {
                  opacity:
                    available
                      ? 1
                      : 0.5,
                },
              ]}
              disabled={!available}
              onPress={saveUsername}
            >

              <LinearGradient
                colors={[
                  "#7C3AED",
                  "#9333EA",
                ]}
                style={styles.arrowGradient}
              >

                <Text style={styles.arrowText}>
                  →
                </Text>

              </LinearGradient>

            </TouchableOpacity>

          </>

        )}

        {step === 3 && (

          <>

            <Text style={styles.title}>
              Welcome aboard, {username}! 🎉
            </Text>

            <Text style={styles.subtitle}>
              Everything is ready.

              {"\n\n"}

              Let's start your coding journey!
            </Text>

            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={() =>
                router.replace("/home")
              }
            >

              <LinearGradient
                colors={[
                  "#7C3AED",
                  "#9333EA",
                ]}
                style={styles.gradient}
              >

                <Text style={styles.buttonText}>
                  Let's Go!
                </Text>

              </LinearGradient>

            </TouchableOpacity>

          </>

        )}

      </View>

    </AuthBackground>

  );
}

const styles = StyleSheet.create({

  scott: {
    width: 320,
    height: 320,
    marginBottom: -55,
    zIndex: 10,
  },

  card: {
    width: "88%",
    backgroundColor: "rgba(17,24,39,0.95)",
    borderRadius: 34,
    paddingHorizontal: 26,
    paddingTop: 70,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.25)",
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },

  subtitle: {
    color: "#A1A1AA",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
    lineHeight: 22,
  },

  input: {
    height: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    paddingHorizontal: 18,
    color: "#fff",
    fontSize: 16,
  },

  status: {
    marginTop: 12,
    textAlign: "center",
    fontWeight: "600",
  },

  arrowButton: {
    width: 64,
    height: 60,
    borderRadius: 32,
    overflow: "hidden",
    alignSelf: "center",
    marginTop: 40,
  },

  arrowGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  arrowText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "800",
    marginTop: -14,
  },

  buttonContainer: {
    width: "100%",
    height: 60,
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 24,
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

