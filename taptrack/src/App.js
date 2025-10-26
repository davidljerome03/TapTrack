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

  // --- Theme state + persistence (default = dark) ---
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored === "light" || stored === "dark" ? stored : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // --- Load user & trackers from Firestore ---
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
          await setDoc(userDocRef, { trackers: [] });
          setCustomButtons([]);
        }
      } else {
        setCustomButtons([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- Add new tracker ---
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

      const trackerDocRef = doc(db, "users", user.uid, "trackers", trimmed);
      try {
        await setDoc(trackerDocRef, { name: trimmed, count: 0 });
      } catch (err) {
        console.warn("Could not create/reset tracker doc:", err);
      }
    }
  };

  // --- Remove tracker ---
  const removeTracker = async (nameToRemove) => {
    const updated = customButtons.filter((n) => n !== nameToRemove);
    setCustomButtons(updated);

    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, { trackers: updated });

    // Delete the associated tracker doc
    const trackerDocRefById = doc(db, "users", user.uid, "trackers", nameToRemove);
    try {
      await deleteDoc(trackerDocRefById);
    } catch {
      /* ignore */
    }

    try {
      const trackersCol = collection(db, "users", user.uid, "trackers");
      const q = query(trackersCol, where("name", "==", nameToRemove));
      const snap = await getDocs(q);
      const deletes = [];
      snap.forEach((d) =>
        deletes.push(deleteDoc(doc(db, "users", user.uid, "trackers", d.id)))
      );
      await Promise.all(deletes);
    } catch (err) {
      console.warn("query-delete failed:", err);
    }
  };

  // --- Sign out ---
  const handleSignOut = () => {
    auth.signOut();
    setCustomButtons([]);
    setNewButtonName("");
  };

  // --- Loading state ---
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

  // --- Main UI ---
  return (
    <div className="container">
      <div className="panel" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="h1">TapTrack</div>

        {/* Theme toggle */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button className="theme-toggle" type="button" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

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

            {/* Add Tracker */}
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
                      aria-label={`Delete ${name}`}
                      title="Delete"
                    >
                      {/* teal trash icon */}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 6h18M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10 11v6M14 11v6"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                      </svg>
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
