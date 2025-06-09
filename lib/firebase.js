import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyBrxYLL4p4Cl2zYCVuLK-T9sZrrkOEemTY",
  authDomain: "daycare-system-68fb7.firebaseapp.com",
  projectId: "daycare-system-68fb7",
  storageBucket: "daycare-system-68fb7.firebasestorage.app",
  messagingSenderId: "610349229743",
  appId: "1:610349229743:web:04e86cc9c01ca9c6c9965a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); 