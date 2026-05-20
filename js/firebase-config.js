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

// Global Function for Google Login
function loginWithGoogle() {
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            console.log("Google Sign-In Successful:", result.user);
            
            // 1. Auth Overlay Popup Modal ko band karo
            const authOverlay = document.getElementById('authOverlay');
            if (authOverlay) {
                authOverlay.classList.remove('open');
                document.body.style.overflow = '';
            }
            
            // 2. Form values ko reset karo
            if (document.getElementById('authEmail')) document.getElementById('authEmail').value = '';
            if (document.getElementById('authPassword')) document.getElementById('authPassword').value = '';

            // 3. User ka naam upar navbar mein turant update karo
            const loginBtn = document.getElementById('loginBtn');
            const userDisplay = document.getElementById('userDisplay');
            if (loginBtn) loginBtn.style.display = 'none';
            if (userDisplay) {
                const nameToShow = result.user.displayName || result.user.email.split('@')[0] || "CREATOR";
                userDisplay.textContent = nameToShow.toUpperCase();
                userDisplay.style.display = 'inline-block';
            }
        })
        .catch((error) => {
            console.error("Google Sign-In Error:", error.message);
            alert("Google Login Failed: " + error.message);
        });
}