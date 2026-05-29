import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";

export const userExists = async (
  uid: string
) => {
  const userRef = doc(
    db,
    "users",
    uid
  );

  const snapshot =
    await getDoc(userRef);

  return snapshot.exists();
};

export const usernameExists =
  async (
    usernameKey: string
  ) => {

    const usernameRef =
      doc(
        db,
        "usernames",
        usernameKey
      );

    const snapshot =
      await getDoc(usernameRef);

    return snapshot.exists();
};

export const createUserProfile =
  async (
    uid: string,
    email: string,
    displayName: string,
    usernameKey: string
  ) => {

    await setDoc(
      doc(db, "users", uid),
      {
        email,
        displayName,
        usernameKey,
        xp: 0,
        level: 1,
        createdAt:
          serverTimestamp(),
      }
    );

    await setDoc(
      doc(
        db,
        "usernames",
        usernameKey
      ),
      {
        uid,
      }
    );
};