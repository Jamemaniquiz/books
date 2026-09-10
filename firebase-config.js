// ============================================================
// PASTE YOUR FIREBASE CONFIG BELOW — this is the ONLY file you
// need to edit. Every page on the site loads this file first.
//
// Get this block from: Firebase console → ⚙️ Project settings →
// General tab → "Your apps" → your web app → Config.
// ============================================================
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
