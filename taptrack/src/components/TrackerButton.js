// src/components/TrackerButton.js
import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

function TrackerButton({ name }) {
  const [count, setCount] = useState(0);
  const btnRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      const user = auth.currentUser;
      if (!user) return;
      const ref = doc(db, "users", user.uid, "trackers", name);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setCount(snap.data().count || 0);
      } else {
        await setDoc(ref, { count: 0 });
        setCount(0);
      }
    }
    loadData();
  }, [name]);

  const handleClick = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please sign in first!");
      return;
    }

    const ref = doc(db, "users", user.uid, "trackers", name);

    // Firestore update (create if missing)
    try {
      await updateDoc(ref, { count: increment(1) });
    } catch {
      await setDoc(ref, { count: 1 });
    }
    setCount((prev) => prev + 1);

    // ✓ pop animation — add 'tick' class briefly
    const el = btnRef.current;
    if (el) {
      el.classList.remove("tick");           // reset if mid-animation
      requestAnimationFrame(() => {
        el.classList.add("tick");
        setTimeout(() => el.classList.remove("tick"), 500); // matches 450ms CSS
      });
    }
  };

  return (
    <button
      ref={btnRef}
      className="tracker"                     // <-- use the CSS class, not inline styles
      onClick={handleClick}
      aria-label={`Increment ${name}`}
      title="Tap to increment"
    >
      <span className="name">{name}</span>
      <span className="count">{count}</span>
    </button>
  );
}

export default TrackerButton;
