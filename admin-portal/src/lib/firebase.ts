import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-auth",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "mock-app",
};

let auth: any;
let googleProvider: any;

try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch (e) {
  console.error("Firebase failed to initialize:", e);
  auth = { onIdTokenChanged: (auth: any, cb: any) => { cb(null); return () => {}; } };
  googleProvider = {};
}

const wrappedSignInWithPopup = async (a: any, p: any) => {
  if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    throw new Error("Firebase is not configured. Please add VITE_FIREBASE_API_KEY to your .env file.");
  }
  return signInWithPopup(a, p);
};

export { auth, googleProvider, wrappedSignInWithPopup as signInWithPopup, signOut };
