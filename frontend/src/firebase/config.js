// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1xQCy12L2IIbwcK4_diokJB1BR72F8SE",
  authDomain: "sala-gestion.firebaseapp.com",
  projectId: "sala-gestion",
  storageBucket: "sala-gestion.firebasestorage.app",
  messagingSenderId: "499849682113",
  appId: "1:499849682113:web:e8eb3c8e0b65ec52cc8840"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);