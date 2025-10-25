import React, { useEffect, useState } from "react";
import { auth, listenToTrackers } from "../firebase";
import TrackButton from "../components/TrackerButton";

const Dashboard = () => {
  const [trackers, setTrackers] = useState([]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // ✅ Only start listening if user exists
        const stopListening = listenToTrackers(user.uid, setTrackers);
        return () => stopListening && stopListening();
      } else {
        console.log("No user signed in yet.");
      }
    });

    // Cleanup auth listener
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h1>Your Dashboard</h1>
      {trackers.length > 0 ? (
        trackers.map((tracker) => (
          <TrackButton key={tracker.id} tracker={tracker} />
        ))
      ) : (
        <p>No trackers found. Please log in or create one!</p>
      )}
    </div>
  );
};

export default Dashboard;
