// src/App.js
import React, { useState, useEffect } from "react";
import TrackerButton from "./components/TrackerButton";
import TrackerActions from "./components/TrackerActions"; // ✅ NEW
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

  // ===== Theme (default dark) =====
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored === "light" || stored === "dark" ? stored : "dark";
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // ===== Modal & UI helpers (NEW) =====
  // confirm = { name, mode: 'delete' | 'override' | 'rename' }
  const [confirm, setConfirm] = useState(null);
  // local color cache (optional, chip reads live too)
  const [colors, setColors] = useState({});

  // ===== Load user & tracker names =====
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

  // ===== Add tracker =====
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
        await setDoc(trackerDocRef, { name: trimmed, count: 0 }, { merge: true });
      } catch (err) {
        console.warn("Could not create/reset tracker doc:", err);
      }
    }
  };

  // ===== Remove tracker =====
  const removeTracker = async (nameToRemove) => {
    const updated = customButtons.filter((n) => n !== nameToRemove);
    setCustomButtons(updated);

    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, { trackers: updated });

    // delete by ID
    const trackerDocRefById = doc(db, "users", user.uid, "trackers", nameToRemove);
    try {
      await deleteDoc(trackerDocRefById);
    } catch {
      /* ignore */
    }

    // delete any doc with field name == nameToRemove
    try {
      const trackersCol = collection(db, "users", user.uid, "trackers");
      const q = query(trackersCol, where("name", "==", nameToRemove));
      const snap = await getDocs(q);
      const deletes = [];
      snap.forEach((d) => deletes.push(deleteDoc(doc(db, "users", user.uid, "trackers", d.id))));
      await Promise.all(deletes);
    } catch (err) {
      console.warn("query-delete failed:", err);
    }
  };

  // ===== Sign out =====
  const handleSignOut = () => {
    auth.signOut();
    setCustomButtons([]);
    setNewButtonName("");
  };

  // ===== NEW: set chip color =====
  const setTrackerColor = async (name, hex) => {
    if (!auth.currentUser) return;
    const ref = doc(db, "users", auth.currentUser.uid, "trackers", name);
    await setDoc(ref, { color: hex }, { merge: true });
    setColors((m) => ({ ...m, [name]: hex }));
  };

  // ===== NEW: override value =====
  const doOverride = async (name, value) => {
    if (!auth.currentUser) return;
    const n = Number(value);
    if (Number.isNaN(n) || n < 0) return alert("Enter a non-negative number.");
    const ref = doc(db, "users", auth.currentUser.uid, "trackers", name);
    await setDoc(ref, { count: n }, { merge: true });
    setConfirm(null);
  };

  // ===== NEW: rename tracker =====
  const renameTracker = async (oldName, newName) => {
    if (!auth.currentUser) return;
    const trimmed = (newName || "").trim();
    if (!trimmed) return alert("Please enter a name.");
    if (trimmed === oldName) return setConfirm(null);
    if (customButtons.includes(trimmed)) return alert("A tracker with that name already exists.");

    const uid = auth.currentUser.uid;
    const oldRef = doc(db, "users", uid, "trackers", oldName);
    const newRef = doc(db, "users", uid, "trackers", trimmed);

    // copy doc if exists
    let payload = {};
    const oldSnap = await getDoc(oldRef);
    if (oldSnap.exists()) payload = oldSnap.data();

    // write new, keep count/color, ensure name
    await setDoc(newRef, { ...payload, name: trimmed }, { merge: true });

    // update array
    const updated = customButtons.map((n) => (n === oldName ? trimmed : n));
    setCustomButtons(updated);
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, { trackers: updated });

    // delete old
    await deleteDoc(oldRef);

    // move color cache if present
    setColors((m) => {
      if (!m[oldName]) return m;
      const { [oldName]: c, ...rest } = m;
      return { ...rest, [trimmed]: c };
    });

    setConfirm(null);
  };

  // ===== Loading =====
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
        {/* Your logo/title stays untouched */}
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

            {/* List */}
            {Array.isArray(customButtons) && customButtons.length ? (
              <div className="grid">
                {customButtons.map((name) => (
                  <div className="tracker-row" key={name}>
                    <TrackerButton name={name} colorHex={colors[name]} />
                    <TrackerActions
                      onRename={() => setConfirm({ name, mode: "rename" })}
                      onOverride={() => setConfirm({ name, mode: "override" })}
                      onPickColor={(hex) => setTrackerColor(name, hex)}
                      onDelete={() => setConfirm({ name, mode: "delete" })}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty">No trackers yet — create your first above.</p>
            )}

            {/* Modal */}
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
