// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLgwoTQ1EB59nr9rerF0gonBbblZ9IJ0g",
  authDomain: "minutos-87fe9.firebaseapp.com",
  projectId: "minutos-87fe9",
  storageBucket: "minutos-87fe9.appspot.com",
  messagingSenderId: "28186647799",
  appId: "1:28186647799:web:1228819cff4f9d77c987f2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db };