// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAs1CMWlM1EwfnW-a5waDSmzxDwT7Zm0xk",
  authDomain: "taptrack-c1cc7.firebaseapp.com",
  projectId: "taptrack-c1cc7",
  storageBucket: "taptrack-c1cc7.firebasestorage.app",
  messagingSenderId: "740291340567",
  appId: "1:740291340567:web:6f93e689064644929f6f52",
  measurementId: "G-BNSHFE22GW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, provider);
    console.log("User signed in!");
  } catch (error) {
    if (error.code === "auth/popup-closed-by-user") {
      console.log("User closed the sign-in popup before completing login.");
    } else {
      console.error("Login error:", error);
    }
  }
};