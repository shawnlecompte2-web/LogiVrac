import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBhmEZvRVPItSVNr9HoR7-VGwps0vD8rNE",
  authDomain: "logivrac-6b3fa.firebaseapp.com",
  projectId: "logivrac-6b3fa",
  storageBucket: "logivrac-6b3fa.firebasestorage.app",
  messagingSenderId: "323110955565",
  appId: "1:323110955565:web:8f583e2832a56835be66a4"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Activer Auth et Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);