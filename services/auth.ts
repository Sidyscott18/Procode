import {

  createUserWithEmailAndPassword,

  signInWithEmailAndPassword,

  sendEmailVerification,

  signOut,

} from "firebase/auth";

import {
  auth,
} from "./firebase";

export const signupUser =
  async (
    email: string,
    password: string
  ) => {

    const userCredential =

      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    await sendEmailVerification(
      userCredential.user
    );

    return userCredential.user;
};

export const loginUser =
  async (
    email: string,
    password: string
  ) => {

    const userCredential =

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    return userCredential.user;
};

export const logoutUser =
  async () => {

    await signOut(auth);
};