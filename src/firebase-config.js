 
 
 
 
import { getFirestore } from "firebase/firestore"; // Import the functions you need from the SDKs you need 
 
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
 
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAKlooKcitCrfjKkKvES2DFtA5zgRTqsjw",
  authDomain: "try3-2cd8e.firebaseapp.com",
  projectId: "try3-2cd8e",
  storageBucket: "try3-2cd8e.firebasestorage.app",
  messagingSenderId: "946304022554",
  appId: "1:946304022554:web:fa3cac8e443633286ff9a3",
  measurementId: "G-KLCK566HM6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
 
 
export const db = getFirestore(app); //this is database connection
//this is getFirestore function





//firebase be read and write true, true, 
//create database   try3



