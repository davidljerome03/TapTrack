// src/App.js
import React, { useState, useEffect } from "react";
import TrackerButton from "./components/TrackerButton";
import TrackerActions from "./components/TrackerActions"; // gear rail
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

  // Theme (default dark)
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored === "light" || stored === "dark" ? stored : "dark";
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Dialog state: { name, mode: 'delete' | 'override' | 'rename' | 'color' }
  const [confirm, setConfirm] = useState(null);
  const [colors, setColors] = useState({});

  // Load user & tracker list
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCustomButtons(Array.isArray(data.trackers) ? data.trackers : []);
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

  // Add tracker
  const addTracker = async () => {
    const trimmed = newButtonName.trim();
    if (!trimmed || customButtons.includes(trimmed)) return;

    const updated = [...customButtons, trimmed];
    setCustomButtons(updated);
    setNewButtonName("");

    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { trackers: updated });

      const trackerDocRef = doc(db, "users", user.uid, "trackers", trimmed);
      try {
        await setDoc(trackerDocRef, { name: trimmed, count: 0 }, { merge: true });
      } catch (err) {
        console.warn("Could not create/reset tracker doc:", err);
      }
    }
  };

  // Remove tracker
  const removeTracker = async (nameToRemove) => {
    const updated = customButtons.filter((n) => n !== nameToRemove);
    setCustomButtons(updated);
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, { trackers: updated });

    try {
      await deleteDoc(doc(db, "users", user.uid, "trackers", nameToRemove));
    } catch {}
    try {
      const trackersCol = collection(db, "users", user.uid, "trackers");
      const q = query(trackersCol, where("name", "==", nameToRemove));
      const snap = await getDocs(q);
      await Promise.all(
        snap.docs.map((d) => deleteDoc(doc(db, "users", user.uid, "trackers", d.id)))
      );
    } catch (err) {
      console.warn("query-delete failed:", err);
    }
  };

  // Sign out
  const handleSignOut = () => {
    auth.signOut();
    setCustomButtons([]);
    setNewButtonName("");
  };

  // Set chip color (from modal)
  const setTrackerColor = async (name, hex) => {
    if (!auth.currentUser) return;
    const ref = doc(db, "users", auth.currentUser.uid, "trackers", name);
    await setDoc(ref, { color: hex }, { merge: true });
    setColors((m) => ({ ...m, [name]: hex }));
    setConfirm(null);
  };

  // Override value
  const doOverride = async (name, value) => {
    if (!auth.currentUser) return;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return alert("Enter a non-negative number.");
    const ref = doc(db, "users", auth.currentUser.uid, "trackers", name);
    await setDoc(ref, { count: n }, { merge: true });
    setConfirm(null);
  };

  // Rename tracker
  const renameTracker = async (oldName, newName) => {
    if (!auth.currentUser) return;
    const trimmed = (newName || "").trim();
    if (!trimmed) return alert("Please enter a name.");
    if (trimmed === oldName) return setConfirm(null);
    if (customButtons.includes(trimmed)) return alert("A tracker with that name already exists.");

    const uid = auth.currentUser.uid;
    const oldRef = doc(db, "users", uid, "trackers", oldName);
    const newRef = doc(db, "users", uid, "trackers", trimmed);

    let payload = {};
    const oldSnap = await getDoc(oldRef);
    if (oldSnap.exists()) payload = oldSnap.data();

    await setDoc(newRef, { ...payload, name: trimmed }, { merge: true });

    const updated = customButtons.map((n) => (n === oldName ? trimmed : n));
    setCustomButtons(updated);
    await setDoc(doc(db, "users", uid), { trackers: updated });
    await deleteDoc(oldRef);

    setColors((m) => {
      if (!m[oldName]) return m;
      const { [oldName]: c, ...rest } = m;
      return { ...rest, [trimmed]: c };
    });

    setConfirm(null);
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

            {/* Add tracker */}
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

            {/* Trackers */}
            {Array.isArray(customButtons) && customButtons.length ? (
              <div className="grid">
                {customButtons.map((name) => (
                  <div className="tracker-row" key={name}>
                    <TrackerButton name={name} colorHex={colors[name]} />
                    <TrackerActions
                      onRename={() => setConfirm({ name, mode: "rename" })}
                      onOverride={() => setConfirm({ name, mode: "override" })}
                      onColor={() => setConfirm({ name, mode: "color" })}
                      onDelete={() => setConfirm({ name, mode: "delete" })}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty">No trackers yet — create your first above.</p>
            )}

            {/* Modals */}
            {confirm && (
              <div className="modal-backdrop" onClick={() => setConfirm(null)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  {confirm.mode === "delete" && (
                    <>
                      <h3>Delete “{confirm.name}”?</h3>
                      <p className="sub">This will remove the tracker and its data.</p>
                      <div className="modal-actions">
                        <button className="button" onClick={() => setConfirm(null)}>
                          Cancel
                        </button>
                        <button
                          className="button primary"
                          onClick={() => {
                            removeTracker(confirm.name);
                            setConfirm(null);
                          }}
                        >
                          Yes, delete
                        </button>
                      </div>
                    </>
                  )}

                  {confirm.mode === "override" && (
                    <>
                      <h3>Override value</h3>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const v = new FormData(e.currentTarget).get("value");
                          doOverride(confirm.name, v);
                        }}
                      >
                        <input
                          className="input"
                          type="number"
                          min="0"
                          name="value"
                          placeholder="Enter new value"
                          autoFocus
                        />
                        <div className="modal-actions">
                          <button type="button" className="button" onClick={() => setConfirm(null)}>
                            Cancel
                          </button>
                          <button type="submit" className="button primary">
                            Save
                          </button>
                        </div>
                      </form>
                    </>
                  )}

                  {confirm.mode === "rename" && (
                    <>
                      <h3>Rename tracker</h3>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const v = new FormData(e.currentTarget).get("newName");
                          renameTracker(confirm.name, v);
                        }}
                      >
                        <input
                          className="input"
                          type="text"
                          name="newName"
                          defaultValue={confirm.name}
                          placeholder="New name"
                          autoFocus
                        />
                        <div className="modal-actions">
                          <button type="button" className="button" onClick={() => setConfirm(null)}>
                            Cancel
                          </button>
                          <button type="submit" className="button primary">
                            Rename
                          </button>
                        </div>
                      </form>
                    </>
                  )}

                  {confirm.mode === "color" && (
                    <>
                      <h3>Choose a color</h3>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                        {[
                          "#5378ff",
                          "#10b8c9",
                          "#7c3aed",
                          "#ef4444",
                          "#22c55e",
                          "#f59e0b",
                          "#7aa8ff",
                          "#8b5cf6",
                        ].map((c) => (
                          <button
                            key={c}
                            className="swatch"
                            style={{ background: c, width: 28, height: 28 }}
                            onClick={() => setTrackerColor(confirm.name, c)}
                            aria-label={`Set color ${c}`}
                          />
                        ))}
                      </div>
                      <div className="modal-actions">
                        <button className="button" onClick={() => setConfirm(null)}>
                          Close
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
