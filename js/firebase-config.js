const firebaseConfig = {
  apiKey: "AIzaSyCDxDOXMpYiXrDuSnwo8cWGY0hBXdgNdDo",
  authDomain: "ankitstudio-auth.firebaseapp.com",
  projectId: "ankitstudio-auth",
  storageBucket: "ankitstudio-auth.firebasestorage.app",
  messagingSenderId: "887537224975",
  appId: "1:887537224975:web:6ca727a203bc6ecf81427a",
  measurementId: "G-KKSD2HRF53"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
