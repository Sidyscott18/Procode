import {
  GoogleSignin,
} from "@react-native-google-signin/google-signin";

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

      const userInfo =
        await GoogleSignin.signIn();

      const idToken =
        userInfo.data?.idToken;

      if (!idToken)
        return;

      const credential =

        GoogleAuthProvider.credential(
          idToken
        );

      await signInWithCredential(
        auth,
        credential
      );

      console.log(
        "Google Login Success"
      );

    } catch (error) {

      console.log(error);
    }
};