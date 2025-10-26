# TapTrack

TapTrack is a lightweight React app for quickly tracking counts by tapping. It uses Firebase for Google authentication and Cloud Firestore to store per-user trackers and counts.

This repository contains a small single-page React app (Create React App) in the `taptrack/` folder.

Features

- Create named trackers
- Tap a tracker to increment its count
- Rename, override, or delete trackers
- Per-user data via Google Sign-In (Firebase Auth) and Firestore
- Light / dark theme

Quick start

1. Install dependencies

```bash
cd /workspaces/TapTrack/taptrack
npm install
```

2. Start the dev server

```bash
npm start
```

Open http://localhost:3000 in your browser.

Build for production

```bash
npm run build
```

The production build will be placed in the `taptrack/build/` folder.

Firebase notes

- Firebase initialization and Google Sign-In are in `taptrack/src/firebase.js`.
- Trackers are stored in Firestore under `users/{uid}/trackers/{trackerName}`. The `users/{uid]` document contains a `trackers` array used for ordering.
- If you want to use your own Firebase project, create a web app in the Firebase console, enable Google Sign-In, and replace the config object in `taptrack/src/firebase.js` with your project's config.

Security and deployment

- The Firebase client config is not a secret, but for multi-environment setups you may prefer to inject configuration via environment variables at build time.
- To deploy to Firebase Hosting, run `firebase init` (choose Hosting) and point the public directory to `taptrack/build`, then run `firebase deploy`.

Project structure (high level)

- `taptrack/` — the React app
	- `src/` — application source
		- `App.js` — main UI and tracker logic
		- `firebase.js` — Firebase initialization and sign-in helper
		- `components/TrackerButton.js` — tracker button component
		- `components/TrackerActions.js` — rename/override/delete UI
		- `App.css` — styles
	- `public/` — static public assets
	- `package.json` — scripts and dependencies

Notes

- I added a small inline SVG logo next to the title in the app header; to change or replace it with an asset, modify `taptrack/src/App.js` and `taptrack/src/App.css`.
- If you want screenshots or CI/CD instructions for Netlify/Vercel/GitHub Pages, tell me which service and I’ll add deployment steps.

Contributing

PRs and issues welcome. Keep changes focused and include notes about how to test.

License

No license file is included. Add a `LICENSE` if you want to choose an open-source license.
