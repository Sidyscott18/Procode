import * as WebBrowser
from "expo-web-browser";

import * as Google
from "expo-auth-session/providers/google";

import {
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";

import {
  auth,
} from "./firebase";

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth =
  () => {

    const [
      request,
      response,
      promptAsync,
    ] = Google.useAuthRequest({

      webClientId:
        "868812370783-27r7aica1avkearl8r3pg5nn9ck6ck2t.apps.googleusercontent.com",

      androidClientId:
        "868812370783-ldjn1m4hkuq3m5ihqhivnf0cvtd4bt0d.apps.googleusercontent.com"
    });

    const handleGoogleSignIn =
      async () => {

        try {

          const result =
            await promptAsync();

          if (
            result.type !== "success"
          ) {

            console.log(result);

            return;
          }

          const idToken =
            result.authentication?.idToken;

          if (!idToken) {

            console.log(
              "No ID token"
            );

            return;
          }

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

    return {
      request,
      response,
      handleGoogleSignIn,
    };
};