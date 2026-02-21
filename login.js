// =============================================================================
// LOGIN.JS - CAMBUS CONNECT Authentication System
// =============================================================================
// This file handles all login logic for both students and administrators
// Features:
// - Smart email detection (auto-converts enrollment IDs)
// - Firebase Authentication integration
// - Role-based redirects (Admin → admin.html, Student → home.html)
// - Comprehensive error handling
// - Session management with localStorage
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {

    console.log("🚀 Login page script loaded");

    // =============================================================================
    // 1. SESSION CHECK - Prevent logged-in users from seeing login page again
    // =============================================================================
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (isLoggedIn === 'true') {
        const role = localStorage.getItem('userRole');
        console.log("✅ User already logged in with role:", role);

        // Redirect immediately based on role
        if (role === 'admin') {
            console.log("→ Redirecting to admin panel...");
            window.location.href = 'admin.html';
        } else {
            console.log("→ Redirecting to student home...");
            window.location.href = 'home.html';
        }
        return; // Stop execution to prevent form from loading
    }

    // =============================================================================
    // 2. GET DOM ELEMENTS
    // =============================================================================
    const loginForm = document.getElementById('login-form');
    const loginButton = document.getElementById('btn-login');
    const errorMessageDiv = document.getElementById('login-error-message');
    const errorText = document.getElementById('error-text');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    // Check if all required elements exist
    if (!loginForm || !loginButton || !emailInput || !passwordInput) {
        console.error("❌ Critical error: Login form elements not found!");
        return;
    }

    console.log("✅ All form elements found");

    // =============================================================================
    // 3. MAIN LOGIN HANDLER
    // =============================================================================
    const handleLogin = async (e) => {
        e.preventDefault(); // Prevent default form submission

        console.log("\n=== LOGIN ATTEMPT STARTED ===");

        // Get input values
        const inputVal = emailInput.value.trim();
        const password = passwordInput.value;

        console.log("Input value:", inputVal);

        // Basic validation
        if (!inputVal || !password) {
            console.warn("⚠️ Empty fields detected");
            showError("Please enter both ID and password");
            return;
        }

        // Show loading state
        setLoadingState(true);
        hideError();

        // =============================================================================
        // SMART EMAIL DETECTION LOGIC
        // =============================================================================
        let email = inputVal;

        // Case 1: Admin login
        if (inputVal === 'admin' || inputVal === 'admin@indoreinstitute.com') {
            email = 'admin@indoreinstitute.com';
            console.log("🔐 Admin login detected");
        }
        // Case 2: Student login with enrollment ID (no @ symbol)
        else if (!inputVal.includes('@')) {
            email = `${inputVal.toLowerCase()}@indoreinstitute.com`;
            console.log("🎓 Student login detected. Email:", email);
        }
        // Case 3: Full email provided
        else {
            console.log("📧 Email format detected:", email);
        }

        try {
            // =============================================================================
            // STEP A: FIREBASE AUTHENTICATION
            // =============================================================================
            console.log("📡 Authenticating with Firebase Auth...");

            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            console.log("✅ Firebase Auth Success!");
            console.log("   UID:", user.uid);
            console.log("   Email:", user.email);

            // =============================================================================
            // STEP B: FETCH USER PROFILE FROM FIRESTORE
            // =============================================================================
            console.log("📡 Fetching user profile from Firestore...");

            const docRef = db.collection('users').doc(email);
            const docSnap = await docRef.get();

            if (!docSnap.exists) {
                console.error("❌ Profile not found in Firestore");
                throw new Error("Profile not found in database. Please contact admin.");
            }

            const userData = docSnap.data();
            console.log("✅ User profile loaded:");
            // console.log("   Name:", userData.name);
            // console.log("   Role:", userData.role);
            // console.log("   Enrollment:", userData.enrollment || "N/A");

            // // ADD THIS COMPLETE BLOCK:
            // Check if pass is expired (for students only)
            if (userData.role === 'student') {
                const passValidity = userData.passValidity;
                if (passValidity) {
                    const passDate = new Date(passValidity);
                    const today = new Date();

                    if (passDate < today) {
                        console.error("❌ Bus pass expired");
                        throw new Error(`Your bus pass expired on ${passDate.toLocaleDateString()}. Please contact admin to renew.`);
                    } else {
                        console.log("✅ Bus pass valid until:", passDate.toLocaleDateString());
                    }
                }
            }
            // =============================================================================
            // STEP C: SAVE SESSION DATA
            // =============================================================================
            console.log("💾 Saving session data to localStorage...");

            // Common session data
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', email);

            // =============================================================================
            // STEP D: ROLE-BASED REDIRECT
            // =============================================================================
            if (userData.role === 'admin') {
                // ========== ADMIN LOGIN ==========
                console.log("\n🔐 ADMIN LOGIN SUCCESSFUL");
                localStorage.setItem('userRole', 'admin');
                localStorage.setItem('adminName', userData.name || 'Admin');

                // Update button to show success
                if (loginButton) {
                    loginButton.textContent = "Admin Login Successful!";
                    loginButton.classList.remove('bg-blue-600');
                    loginButton.classList.add('bg-green-600');
                }

                console.log("→ Redirecting to admin panel in 0.5s...");
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 500);

            } else {
                // ========== STUDENT LOGIN ==========
                console.log("\n🎓 STUDENT LOGIN SUCCESSFUL");
                localStorage.setItem('userRole', 'student');
                // Include the doc ID (email) in the student object so other pages can reference it
                localStorage.setItem('student', JSON.stringify({ id: email, ...userData }));

                // Update button to show success
                if (loginButton) {
                    loginButton.textContent = "Login Successful!";
                    loginButton.classList.remove('bg-blue-600');
                    loginButton.classList.add('bg-green-600');
                }

                console.log("→ Redirecting to student home in 0.5s...");
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 500);
            }

            console.log("=== LOGIN COMPLETE ===\n");

        } catch (error) {
            // =============================================================================
            // ERROR HANDLING
            // =============================================================================
            console.error("\n❌ LOGIN ERROR:");
            console.error("   Code:", error.code);
            console.error("   Message:", error.message);

            let userMessage = "Login failed. Please try again.";

            // Map Firebase error codes to user-friendly messages
            switch (error.code) {
                case 'auth/user-not-found':
                    userMessage = "❌ No account found with this ID.\n\nPlease check your enrollment number or contact admin.";
                    console.error("   → User not found in Firebase Auth");
                    break;

                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    userMessage = "❌ Incorrect password.\n\nPlease try again or contact admin to reset your password.";
                    console.error("   → Wrong password provided");
                    break;

                case 'auth/invalid-email':
                    userMessage = "❌ Invalid email format.";
                    console.error("   → Email format is invalid");
                    break;

                case 'auth/too-many-requests':
                    userMessage = "❌ Too many failed attempts.\n\nPlease try again after 5 minutes.";
                    console.error("   → Account temporarily locked due to multiple failed attempts");
                    break;

                case 'auth/network-request-failed':
                    userMessage = "❌ Network error.\n\nPlease check your internet connection and try again.";
                    console.error("   → Network connection issue");
                    break;

                case 'auth/user-disabled':
                    userMessage = "❌ This account has been disabled.\n\nPlease contact admin.";
                    console.error("   → User account is disabled");
                    break;

                default:
                    if (error.message.includes("Profile not found")) {
                        userMessage = "❌ Account exists but profile is incomplete.\n\nPlease contact admin.";
                        console.error("   → Firestore profile missing");
                    } else {
                        userMessage = `❌ Login failed: ${error.message}`;
                        console.error("   → Unknown error");
                    }
            }

            console.error("=== LOGIN FAILED ===\n");

            // Show error to user
            showError(userMessage);
            setLoadingState(false);
        }
    };

    // =============================================================================
    // 4. HELPER FUNCTIONS
    // =============================================================================

    /**
     * Shows error message to user
     */
    function showError(message) {
        if (errorText) {
            errorText.textContent = message;
        }
        if (errorMessageDiv) {
            errorMessageDiv.classList.remove('hidden');
        }
        console.log("⚠️ Error shown to user:", message);
    }

    /**
     * Hides error message
     */
    function hideError() {
        if (errorMessageDiv) {
            errorMessageDiv.classList.add('hidden');
        }
    }

    /**
     * Sets loading state on/off
     */
    function setLoadingState(loading) {
        if (loginButton) {
            loginButton.disabled = loading;
            loginButton.textContent = loading ? "Verifying..." : "Login";

            if (loading) {
                loginButton.classList.add('opacity-75', 'cursor-not-allowed');
            } else {
                loginButton.classList.remove('opacity-75', 'cursor-not-allowed');
            }
        }

        // Disable inputs during loading
        if (emailInput) emailInput.disabled = loading;
        if (passwordInput) passwordInput.disabled = loading;
    }

    // =============================================================================
    // 5. ATTACH EVENT LISTENERS
    // =============================================================================

    // Main form submission
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log("✅ Login form submit listener attached");
    } else {
        console.error("❌ Login form not found!");
    }

    // Clear error when user starts typing
    [emailInput, passwordInput].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                hideError();
            });
        }
    });

    // Enter key support (already handled by form submit, but explicit for clarity)
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    }

    // =============================================================================
    // 6. OPTIONAL: PASSWORD VISIBILITY TOGGLE
    // =============================================================================
    // If you want to add a "show/hide password" button, use this code:

    const togglePassword = document.getElementById('toggle-password');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.textContent = type === 'password' ? '👁' : '⌣';
        });
    }



    // =============================================================================
    // 7. DEVELOPMENT MODE - AUTO-FILL FOR TESTING (Remove in production)
    // =============================================================================
    // Uncomment this for easier testing during development
    /*
    if(emailInput && passwordInput) {
        emailInput.value = 'admin'; // or '0818CS221001'
        passwordInput.value = 'admin123'; // or '0818CS221001'
        console.log("🔧 DEV MODE: Credentials auto-filled");
    }
    */

    console.log("✅ Login page fully initialized\n");
    console.log("📝 Login Tips:");
    console.log("   Admin: 'admin' / 'admin123'");
    console.log("   Student: '[enrollment]' / '[enrollment]'");
    console.log("   Example: '0818CS221001' / '0818CS221001'");
});

// =============================================================================
// END OF LOGIN.JS
// =============================================================================
