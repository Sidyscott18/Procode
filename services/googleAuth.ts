import { Platform, Alert } from "react-native";
import { router } from "expo-router";
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "./firebase";
import { userExists } from "./userService";

// ── Shared: route after successful sign-in ─────────────────────
async function handlePostSignIn(uid: string) {
  const exists = await userExists(uid);
  if (exists) {
    router.replace("/home");
  } else {
    router.replace("/username-setup");
  }
}

// ── Web: use Firebase signInWithPopup ──────────────────────────
async function handleGoogleSignInWeb() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await handlePostSignIn(result.user.uid);
  } catch (error: any) {
    console.log("[GoogleAuth Web]", error);
    Alert.alert("Google Sign-In Error", error?.message || String(error));
  }
}

// ── Native (Android): use @react-native-google-signin ─────────
async function handleGoogleSignInNative() {
  const { GoogleSignin } = await import(
    "@react-native-google-signin/google-signin"
  );

  GoogleSignin.configure({
    webClientId:
      "868812370783-27r7aica1avkearl8r3pg5nn9ck6ck2t.apps.googleusercontent.com",
  });

  try {
    await GoogleSignin.hasPlayServices();
    try { await GoogleSignin.signOut(); } catch {}

    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.data?.idToken;
    if (!idToken) return;

    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    await handlePostSignIn(result.user.uid);
  } catch (error: any) {
    console.log("[GoogleAuth Native]", error);
    Alert.alert("Google Sign-In Error", error?.message || String(error));
  }
}

// ── Exported: picks the right path by platform ─────────────────
export const handleGoogleSignIn = () => {
  if (Platform.OS === "web") {
    return handleGoogleSignInWeb();
  }
  return handleGoogleSignInNative();
};