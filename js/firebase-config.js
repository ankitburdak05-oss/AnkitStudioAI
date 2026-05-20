// Firebase initialization
const firebaseConfig = {
  apiKey: "AIzaSyB7kRi62mPhP_tLyQTvrF9pwVQ3h4MGyqQ",
  authDomain: "ankitstudioai.firebaseapp.com",
  projectId: "ankitstudioai",
  storageBucket: "ankitstudioai.firebasestorage.app",
  messagingSenderId: "450755070024",
  appId: "1:450755070024:web:4bf14bc4da4caf1200b07d",
  measurementId: "G-BJ44E7P08S"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
// Google Auth Provider Initialization
const provider = new firebase.auth.GoogleAuthProvider();

// Global Function for Google Login (Which app.js calls)
function loginWithGoogle() {
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            console.log("Google Sign-In Successful:", result.user);
            // Login kamyaab hone par popup modal ko band karne ke liye
            if(typeof closeAuth === 'function') closeAuth();
        })
        .catch((error) => {
            console.error("Google Sign-In Error:", error.message);
            alert("Google Login Failed: " + error.message);
        });
}