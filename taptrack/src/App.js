// src/App.js
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { auth, provider } from './firebase';
import Dashboard from './pages/Dashboard';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold mb-4">Welcome to TapTrack</h1>
        <button
          onClick={signIn}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return <Dashboard user={user} />;
}

export default App;
