// src/App.js
import React, { useState, useEffect } from "react";
import TrackerButton from "./components/TrackerButton";
import { signInWithGoogle, auth } from "./firebase";
import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customButtons, setCustomButtons] = useState([]);
  const [newButtonName, setNewButtonName] = useState("");

  const removeTracker = async (nameToRemove) => {
    const updatedButtons = customButtons.filter(name => name !== nameToRemove);
    setCustomButtons(updatedButtons);

    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { trackers: updatedButtons });
    }
  };


  // Listen for auth state changes
  useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async currentUser => {
    setUser(currentUser);
    setLoading(false);

    if (currentUser) {
      const userDocRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.trackers) {
          setCustomButtons(data.trackers);
        }
      }
    }
  });
  return () => unsubscribe();
}, []);
  // Show loading screen while checking auth
  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "3rem" }}>
        <h1>TapTrack</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", marginTop: "3rem" }}>
      <h1>TapTrack</h1>

      {/* Auth UI */}
      {!user ? (
        <button onClick={signInWithGoogle}>Sign in with Google</button>
      ) : (
        <>
          <p>Welcome, {user.displayName}!</p>
          <img
            src={user.photoURL}
            alt="User profile"
            style={{
              borderRadius: "50%",
              width: "80px",
              height: "80px",
              objectFit: "cover",
              marginBottom: "1rem"
            }}
          />
          <br />
          <button 
            onClick={() => {
              auth.signOut();
              setCustomButtons([]); // Clear buttons on logout
            }}
          >
            Sign Out
          </button>

          {/* Input for new tracker */}
          <div style={{ marginTop: "2rem" }}>
            <input
              type="text"
              placeholder="New tracker name"
              value={newButtonName}
              onChange={e => setNewButtonName(e.target.value)}
              style={{
                padding: "0.5rem",
                marginRight: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #ccc"
              }}
            />
            <button
              onClick={async () => {
                const trimmed = newButtonName.trim();
                if (trimmed && !customButtons.includes(trimmed)) {
                  const updatedButtons = [...customButtons, trimmed];
                  setCustomButtons(updatedButtons);
                  setNewButtonName("");

                  // Save to Firestore
                  if (user) {
                    const userDocRef = doc(db, "users", user.uid);
                    await setDoc(userDocRef, { trackers: updatedButtons });
                  }
                }
              }}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "4px",
                backgroundColor: "#007bff",
                color: "#fff",
                border: "none",
                cursor: "pointer"
              }}
            >
              Add Tracker
            </button>
          </div>
        </>
      )}

      {/* Render all tracker buttons */}
      <div style={{ marginTop: "2rem" }}>
        {customButtons.map((name, index) => (
          <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem" }}>
            <TrackerButton name={name} />
            <button
              onClick={() => removeTracker(name)}
              style={{
                marginLeft: "0.5rem",
                backgroundColor: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                padding: "0.25rem 0.5rem",
                cursor: "pointer"
              }}
            >
              ❌
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;