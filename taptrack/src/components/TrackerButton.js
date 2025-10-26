// src/components/TrackerButton.js
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from "firebase/firestore";

function TrackerButton({ name, colorHex }) {
  const [count, setCount] = useState(0);
  const [chipColor, setChipColor] = useState(colorHex || null);

  useEffect(() => setChipColor(colorHex || null), [colorHex]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const ref = doc(db, "users", user.uid, "trackers", name);

    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setCount(d.count || 0);
        if (!colorHex) setChipColor(d.color || null);
      } else {
        await setDoc(ref, { count: 0 });
      }
    });
    return () => unsub();
  }, [name, colorHex]);

  const handleClick = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Please sign in first!");
    const ref = doc(db, "users", user.uid, "trackers", name);
    try {
      await updateDoc(ref, { count: increment(1) });
    } catch {
      await setDoc(ref, { count: 1 }, { merge: true });
    }
  };

  const style = chipColor
    ? {
        background: `linear-gradient(180deg, ${chipColor}, ${chipColor})`,
        borderColor: `${chipColor}b0`,
        boxShadow: `0 6px 20px ${chipColor}40`,
      }
    : undefined;

  return (
    <button className="tracker" style={style} onClick={handleClick}>
      <span className="name">{name}</span>
      <span className="count">{count}</span>
    </button>
  );
}

export default TrackerButton;
