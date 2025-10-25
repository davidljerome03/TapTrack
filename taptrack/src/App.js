// src/App.js
import React from "react";
import TrackerButton from "./components/TrackerButton";
import { signInWithGoogle, auth } from "./firebase";

function App() {
  return (
    <div style={{ textAlign: "center", marginTop: "3rem" }}>
      <h1>TapTrack</h1>
      <button onClick={signInWithGoogle}>Sign in with Google</button>

      {/* Example trackers */}
      <TrackerButton name="Water Consumed" />
      <TrackerButton name="Pages Read" />
    </div>
  );
}

export default App;
