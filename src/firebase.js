import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyABgUH4ktZ955qaoUh5OTA0efucF0sbVkQ",
    authDomain: "mdcoverage.firebaseapp.com",
    databaseURL: "https://mdcoverage-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mdcoverage",
    storageBucket: "mdcoverage.firebasestorage.app",
    messagingSenderId: "656427613595",
    appId: "1:656427613595:web:3d47d88985efadeceab53e"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);