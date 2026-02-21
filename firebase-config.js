// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBliJ5tYf1pHxeUYF6Xm_H9I47wkSLk8Vg",
    authDomain: "cambus2-9bbb1.firebaseapp.com",
    projectId: "cambus2-9bbb1",
    storageBucket: "cambus2-9bbb1.firebasestorage.app",
    messagingSenderId: "803501850082",
    appId: "1:803501850082:web:b6a36b6d993745872b4dbb",
    measurementId: "G-Z9W8VBLN5T"
};

// Initialize Firebase
let app;
try {
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully");
    } else {
        app = firebase.app();
        console.log("Firebase already initialized");
    }

    // Initialize core services first (required on all pages)
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Optional service: Storage (SDK not loaded on every page)
    let storage = null;
    if (typeof firebase.storage === 'function') {
        storage = firebase.storage();
    } else {
        console.warn("Firebase Storage SDK not loaded on this page.");
    }

    // Optional service: Analytics (can fail in restricted environments)
    let analytics = null;
    try {
        if (typeof firebase.analytics === 'function') {
            analytics = firebase.analytics();
        }
    } catch (analyticsError) {
        console.warn("Firebase Analytics unavailable:", analyticsError.message);
    }

    // Make globally available
    window.auth = auth;
    window.db = db;
    window.storage = storage;
    window.analytics = analytics;

    // Optional: Enable offline persistence
    db.enablePersistence()
        .then(() => console.log("Firestore offline persistence enabled"))
        .catch(err => {
            if (err.code == 'failed-precondition') {
                console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
            } else if (err.code == 'unimplemented') {
                console.warn("The current browser doesn't support persistence.");
            } else {
                console.warn("Firestore persistence not enabled:", err.message);
            }
        });

} catch (error) {
    console.error("Firebase initialization error:", error);
    
    // Show user-friendly error
    const errorDiv = document.getElementById('login-error-message');
    if (errorDiv) {
        const errorText = document.getElementById('error-text');
        if(errorText) errorText.textContent = "Connection error. Please refresh the page.";
        errorDiv.classList.remove('hidden');
    }
}
