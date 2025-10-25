import { signInWithGoogle } from "../firebase";

export default function Home() {
  return (
    <div className="home">
      <h1>TapTrack</h1>
      <p>Track your habits with a single tap!</p>
      <button onClick={signInWithGoogle}>Sign In with Google</button>
    </div>
  );
}
