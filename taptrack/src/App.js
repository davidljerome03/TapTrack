// src/App.js
import React, { useState, useEffect } from "react";
import TrackerButton from "./components/TrackerButton";
import { signInWithGoogle, auth, db } from "./firebase";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customButtons, setCustomButtons] = useState([]);
  const [newButtonName, setNewButtonName] = useState("");

  // Load user + their saved trackers (array on /users/{uid})
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.trackers)) {
            setCustomButtons(data.trackers);
          } else {
            setCustomButtons([]);
          }
        } else {
          // create doc if missing
          await setDoc(userDocRef, { trackers: [] });
          setCustomButtons([]);
        }
      } else {
        setCustomButtons([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Add new tracker name to array AND create/reset its tracker doc
  const addTracker = async () => {
    const trimmed = newButtonName.trim();
    if (!trimmed) return;
    if (customButtons.includes(trimmed)) return;

    const updated = [...customButtons, trimmed];
    setCustomButtons(updated);
    setNewButtonName("");

    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { trackers: updated });

      // Ensure a fresh tracker doc exists (document ID = tracker name) with count:0
      // This makes re-adding the same name start from 0.
      const trackerDocRef = doc(db, "users", user.uid, "trackers", trimmed);
      try {
        await setDoc(trackerDocRef, { name: trimmed, count: 0 });
      } catch (err) {
        console.warn("Could not create/reset tracker doc:", err);
      }
    }
  };

  // Remove tracker name from array + delete any tracker doc(s)
  const removeTracker = async (nameToRemove) => {
    const updated = customButtons.filter((n) => n !== nameToRemove);
    setCustomButtons(updated);

    if (!user) {
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, { trackers: updated });

    // 1) Try deleting a doc with ID === nameToRemove
    const trackerDocRefById = doc(db, "users", user.uid, "trackers", nameToRemove);
    try {
      await deleteDoc(trackerDocRefById);
    } catch (err) {
      // ignore, we'll try the query approach next
      console.info("delete by id may have failed or doc didn't exist:", err?.message || err);
    }

    // 2) Also delete any docs in the trackers subcollection that have field name == nameToRemove
    try {
      const trackersCol = collection(db, "users", user.uid, "trackers");
      const q = query(trackersCol, where("name", "==", nameToRemove));
      const snap = await getDocs(q);
      const deletes = [];
      snap.forEach((d) => {
        deletes.push(deleteDoc(doc(db, "users", user.uid, "trackers", d.id)));
      });
      await Promise.all(deletes);
    } catch (err) {
      console.warn("query-delete failed:", err);
    }
  };

  // Sign out + clear local state
  const handleSignOut = () => {
    auth.signOut();
    setCustomButtons([]);
    setNewButtonName("");
  };

  // Loading state
  if (loading) {
    return (
      <div className="center-screen">
        <div className="panel" style={{ textAlign: "center", maxWidth: 420 }}>
          <div className="h1">TapTrack</div>
          <p className="sub">Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="panel" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="h1">TapTrack</div>

        {!user ? (
          <div style={{ textAlign: "center" }}>
            <p className="sub">Simple, fast, tap-to-track anything.</p>
            <button className="button primary" onClick={signInWithGoogle}>
              Sign in with Google
            </button>
          </div>
        ) : (
          <>
            <p className="sub">Welcome, {user.displayName}!</p>

            {user.photoURL ? (
              <img className="avatar" src={user.photoURL} alt="" />
            ) : (
              <div className="initial">{(user.displayName || "U")[0]}</div>
            )}

            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <button className="button" onClick={handleSignOut}>
                Sign Out
              </button>
            </div>

            {/* Input + Add (as a form to enable Enter key and prevent weird submits) */}
            <form
              className="input-row"
              onSubmit={(e) => {
                e.preventDefault();
                addTracker();
              }}
            >
              <input
                className="input"
                type="text"
                placeholder="New tracker name"
                value={newButtonName}
                onChange={(e) => setNewButtonName(e.target.value)}
              />
              <button className="button primary" type="submit">
                Add Tracker
              </button>
            </form>

            {/* Tracker List */}
            {Array.isArray(customButtons) && customButtons.length ? (
              <div className="grid">
                {customButtons.map((name, index) => (
                  <div className="tracker-row" key={index}>
                    <TrackerButton name={name} />
                    <button
                      className="delete"
                      type="button"
                      onClick={() => removeTracker(name)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty">No trackers yet — create your first above.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
