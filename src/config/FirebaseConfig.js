// firebase.js
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  update,
  off,
  set,
  get,
  onValue,
  push,
  query,
  orderByChild,
} from "firebase/database";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOyCXTlqrogx99bx2TppEhSZKq0S2INgQ",
  authDomain: "trivialbased.firebaseapp.com",
  databaseURL: "https://trivialbased-default-rtdb.firebaseio.com",
  projectId: "trivialbased",
  storageBucket: "trivialbased.appspot.com",
  messagingSenderId: "23476738877",
  appId: "1:23476738877:web:5d6e76b7614626518a8354",
  measurementId: "G-Y9GH0H2N87",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export {
  app,
  database,
  update,
  ref,
  off,
  set,
  get,
  getDatabase,
  push,
  onValue,
  query,
  orderByChild,
};
