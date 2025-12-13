import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD0jHxcgvBuSRtNmGii1trHBcuBtDoLjL8",
    authDomain: "restaurantetotobar.firebaseapp.com",
    projectId: "restaurantetotobar",
    storageBucket: "restaurantetotobar.firebasestorage.app",
    messagingSenderId: "278619460546",
    appId: "1:278619460546:web:2f0c2283900892a01f7c5b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);