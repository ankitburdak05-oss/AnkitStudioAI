// Firebase initialization
const firebaseConfig = {
  apiKey: "AIzaSyB7kRi62mPhP_tLyQTvrF9pwVQ3h4MGyqQ",
  authDomain: "ankitstudioai.firebaseapp.com",
  databaseURL: "https://ankitstudioai-default-rtdb.firebaseio.com",
  projectId: "ankitstudioai",
  storageBucket: "ankitstudioai.firebasestorage.app",
  messagingSenderId: "450755070024",
  appId: "1:450755070024:web:4bf14bc4da4caf1200b07d",
  measurementId: "G-BJ44E7P08S"
};

// Core Engine Initialization (Safe Mode to prevent duplicate app errors)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// FIXED: Initialized Realtime Database to perfectly match app.js sync logic
const database = firebase.database(); 

// Global Function for Google Login
function loginWithGoogle() {
    // Secure instantiation inside authorization flow scope
    const provider = new firebase.auth.GoogleAuthProvider();
    
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            console.log("Google Sign-In Successful:", result.user);
            
            // State change ko database ke sath fix karne ke liye page ko reload karo
            window.location.reload();
        })
        .catch((error) => {
            console.error("Error during Google Sign-In:", error.message);
            alert("Login failed: " + error.message);
        });
}

// Is line ko firebase-config.js ke ekdam aakhiri mein daal do taaki button kaam kare
window.loginWithGoogle = loginWithGoogle;