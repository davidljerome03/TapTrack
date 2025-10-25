// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { addDoc, getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import {
  doc,
  updateDoc,
  getDoc,
  collection,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

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




/**
 * Creates a new tracker for the signed-in user
 * @param {string} userId - Firebase user ID
 * @param {string} trackerName - The name of the tracker (e.g., “Push-ups”)
 */

export const createTracker = async (userId, trackerName) => {
  try {
    const trackerRef = collection(db, "users", userId, "trackers");
    await addDoc(trackerRef, {
      name: trackerName,
      count: 0,
      lastUpdated: new Date(),
    });

    console.log("Tracker created:", trackerName);
  } catch (error) {
    console.error("Enter creating tracker:", error);
  }
};

export const incrementTracker = async (userId, trackerId) => {
  try{
    const trackerDoc = doc(db, "users", "trackers", trackerId);
    const trackerSnap = await getDoc(trackerDoc);
    if (trackerSnap.exists()){
      const currentCount = trackerSnap.data().count || 0;
      await updateDoc(trackerDoc, {
        count: currentCount + 1,
        lastUpdated: new Date(),
      });
      console.log("Tracker incremented!");
    }
  } catch (error) {
    console.error("Error incrementing tracker:", error);
  }
};

export const getUserTracker = async (userId) => {
  try{
    const trackerRef = collection(db, "users", userId, "trackers");
    const snapshot = await getDocs(trackerRef);
    const trackers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return trackers;
  } catch (error) {
    console.error("Error loading trackers:", error);
    return [];
  }
};

export const listenToTrackers = (userId, callback) => {
  if (!userId) {
    console.error("listenToTrackers called without a valid userId");
    return () => {};
  }

  const trackerRef = collection(db, "users", userId, "trackers");
  const unsubscribe = onSnapshot(trackerRef, (snapshot) => {
    const trackers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(trackers);
  });

  return unsubscribe;
};