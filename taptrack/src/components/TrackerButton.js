// src/components/TrackerButton.js
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase"; // note the ".." because this file is in /components
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

function TrackerButton({ name }) {
  const [count, setCount] = useState(0);

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
    await updateDoc(ref, { count: increment(1) }).catch(async () => {
      await setDoc(ref, { count: 1 });
    });

    setCount((prev) => prev + 1);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        padding: "1rem",
        fontSize: "1.2rem",
        margin: "0.5rem",
        background: "#2563eb",
        color: "white",
        border: "none",
        borderRadius: "8px",
      }}
    >
      {name}: {count}
    </button>
  );
}

export default TrackerButton;
