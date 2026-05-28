import {
  initializeApp,
} from "firebase/app";

import {
  getAuth,
} from "firebase/auth";

import {
  getFirestore,
} from "firebase/firestore";

const firebaseConfig = {

  apiKey:
    "AIzaSyAdZsMY-mYLxeWxdG1Z_ua8x__AUoHH_C0",

  authDomain:
    "procode-1bdef.firebaseapp.com",

  projectId:
    "procode-1bdef",

  storageBucket:
    "procode-1bdef.firebasestorage.app",

  messagingSenderId:
    "868812370783",

  appId:
    "1:868812370783:web:fbe33e0959dc7d399d3cea",

  measurementId:
    "G-QQCWV7442Z",
};

const app =
  initializeApp(firebaseConfig);

export const auth =
  getAuth(app);

export const db =
  getFirestore(app);