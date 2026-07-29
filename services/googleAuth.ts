import {
  GoogleSignin,
} from "@react-native-google-signin/google-signin";

import {
  userExists,
} from "./userService";

import {
  router,
} from "expo-router";

import {
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";

import {
  auth,
} from "./firebase";

GoogleSignin.configure({
  webClientId:
    "868812370783-27r7aica1avkearl8r3pg5nn9ck6ck2t.apps.googleusercontent.com",
});

export const handleGoogleSignIn =
  async () => {

    try {

      await GoogleSignin.hasPlayServices();

      try {
          await GoogleSignin.signOut();
        } catch {}

        const userInfo = await GoogleSignin.signIn();

      const idToken =
        userInfo.data?.idToken;

      if (!idToken)
        return;

      const credential =

        GoogleAuthProvider.credential(
          idToken
        );

      const result =
        await signInWithCredential(
          auth,
          credential
        );

      const uid =
        result.user.uid;

      const exists =
        await userExists(uid);

      if (exists) {

        router.replace("/home");

      } else {

        router.replace(
          "/username-setup"
        );
      }

    } catch (error) {

      console.log(error);
    }
};