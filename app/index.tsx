import {
  useEffect,
  useState,
} from "react";

import {
  Animated,
} from "react-native";

import {
  router,
} from "expo-router";

import LoadingScreen
from "../screens/LoadingScreen";

export default function Index() {

  const fadeAnim =
    useState(
      new Animated.Value(1)
    )[0];

  useEffect(() => {

    const timer =
      setTimeout(() => {

        Animated.timing(
          fadeAnim,
          {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }
        ).start(() => {

          router.replace("/signup");

        });

      }, 3000);

    return () =>
      clearTimeout(timer);

  }, []);

  return (

    <Animated.View
      style={{
        flex: 1,
        opacity: fadeAnim,
      }}
    >

      <LoadingScreen />

    </Animated.View>
  );
}