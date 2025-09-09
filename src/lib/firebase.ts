// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "adbelm",
  appId: "1:271240144270:web:d36c23d1e2eb26b0d2f0df",
  storageBucket: "adbelm.firebasestorage.app",
  apiKey: "AIzaSyCZ10tFeJAJmHYN9QLN5q_MUY3PHXiSZ7M",
  authDomain: "adbelm.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "271240144270"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
