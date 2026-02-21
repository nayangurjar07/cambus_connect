// =============================================================================
// MAIN.JS - CAMBUS CONNECT Shared Components & Logic
// =============================================================================
// This file is loaded on ALL student pages (home, bus-pass, track, etc.)
// It handles shared functionality that appears on every page:
// - Header with student name
// - Mobile menu toggle
// - Logout functionality
// - Common utilities
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    console.log("🔧 Main.js loaded - Initializing shared components...");

    // =============================================================================
    // 1. GET STUDENT DATA FROM SESSION
    // =============================================================================
    const studentDataString = localStorage.getItem('student');
    let student = null;
    
    if (studentDataString) {
        try {
            student = JSON.parse(studentDataString);
            console.log("✅ Student data loaded:", student.name);
        } catch (error) {
            console.error("❌ Error parsing student data:", error);
            // If data is corrupted, clear and redirect to login
            localStorage.clear();
            window.location.href = 'index.html';
            return;
        }
    } else {
        console.warn("⚠️ No student data found in session");
    }

    // =============================================================================
    // 2. UPDATE HEADER WITH STUDENT NAME
    // =============================================================================
    const studentNameHeader = document.getElementById('student-name-header');
    
    if (studentNameHeader && student) {
        studentNameHeader.textContent = student.name;
        console.log("✅ Header updated with student name");
    } else if (studentNameHeader) {
        studentNameHeader.textContent = "Guest User";
        console.warn("⚠️ Student name not available, showing 'Guest User'");
    }

    // =============================================================================
    // 3. MOBILE MENU TOGGLE
    // =============================================================================
    const menuButton = document.getElementById('menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (menuButton && mobileMenu) {
        // Toggle menu when hamburger button is clicked
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent document click from immediately closing
            mobileMenu.classList.toggle('hidden');
            console.log("📱 Mobile menu toggled");
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            // Check if click is outside both menu button and mobile menu
            if (!menuButton.contains(e.target) && !mobileMenu.contains(e.target)) {
                if (!mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                    console.log("📱 Mobile menu closed (clicked outside)");
                }
            }
        });
        
        // Close menu when pressing Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
                console.log("📱 Mobile menu closed (ESC key)");
            }
        });
        
        console.log("✅ Mobile menu functionality initialized");
    } else {
        if (!menuButton) console.warn("⚠️ Menu button not found");
        if (!mobileMenu) console.warn("⚠️ Mobile menu not found");
    }

    // =============================================================================
    // 4. LOGOUT FUNCTIONALITY
    // =============================================================================
    
    /**
     * Handles logout process
     * - Shows confirmation dialog
     * - Signs out from Firebase
     * - Clears local session data
     * - Redirects to login page
     */
    const handleLogout = async () => {
        console.log("\n🚪 Logout initiated...");
        
        // Show confirmation dialog
        const confirmLogout = confirm(
            "Are you sure you want to logout?\n\n" +
            "You will need to login again to access your account."
        );
        
        if (!confirmLogout) {
            console.log("❌ Logout cancelled by user");
            return;
        }
        
        console.log("✅ User confirmed logout");
        
        try {
            // Check if Firebase Auth is available
            if (typeof auth !== 'undefined' && auth) {
                console.log("📡 Signing out from Firebase...");
                
                await auth.signOut();
                console.log("✅ Firebase logout successful");
            } else {
                console.warn("⚠️ Firebase auth not available, skipping Firebase logout");
            }
            
            // Clear all local storage data
            console.log("🗑️ Clearing session data...");
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('student');
            localStorage.removeItem('adminName');
            
            // Alternative: Clear everything
            // localStorage.clear();
            
            console.log("✅ Session data cleared");
            
            // Show success message (optional)
            // You can uncomment this for better UX
            /*
            alert("Logout successful!\n\nYou will now be redirected to the login page.");
            */
            
            // Redirect to login page
            console.log("→ Redirecting to login page...");
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error("❌ Logout error:", error);
            
            // Even if Firebase logout fails, still clear local data and redirect
            console.log("⚠️ Forcing logout despite error...");
            localStorage.clear();
            
            alert(
                "Logout completed with errors.\n\n" +
                "Error: " + error.message + "\n\n" +
                "You will be redirected to login."
            );
            
            window.location.href = 'index.html';
        }
    };

    // =============================================================================
    // 5. ATTACH LOGOUT EVENT LISTENERS
    // =============================================================================
    
    // Logout button in mobile menu (appears on all pages)
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
        console.log("✅ Header logout button listener attached");
    } else {
        console.warn("⚠️ Header logout button not found");
    }

    // Logout button on profile page (specific to profile.html)
    const profileLogoutButton = document.getElementById('profile-logout');
    if (profileLogoutButton) {
        profileLogoutButton.addEventListener('click', handleLogout);
        console.log("✅ Profile page logout button listener attached");
    }

    // =============================================================================
    // 6. ACTIVE PAGE INDICATOR (Optional Enhancement)
    // =============================================================================
    
    /**
     * Highlights the current page in the navigation bar
     * This helps users know which page they're on
     */
    const highlightActivePage = () => {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('#nav-tabs a');
        
        if (navLinks.length > 0) {
            navLinks.forEach(link => {
                const linkPage = link.getAttribute('href');
                
                if (linkPage === currentPage) {
                    // Add active styles
                    link.classList.add('bg-blue-600', 'text-white');
                    link.classList.remove('text-gray-600', 'hover:bg-gray-100');
                    console.log("📍 Active page highlighted:", currentPage);
                } else {
                    // Remove active styles
                    link.classList.remove('bg-blue-600', 'text-white');
                    link.classList.add('text-gray-600', 'hover:bg-gray-100');
                }
            });
        }
    };
    
    highlightActivePage();

    // =============================================================================
    // 7. NETWORK STATUS INDICATOR (Optional Enhancement)
    // =============================================================================
    
    /**
     * Shows a warning when user goes offline
     * Useful for Firebase real-time features
     */
    let offlineToast = null;
    
    const showOfflineWarning = () => {
        console.warn("⚠️ User went offline");
        
        // Create toast notification
        offlineToast = document.createElement('div');
        offlineToast.id = 'offline-toast';
        offlineToast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
        offlineToast.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
                <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
                <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
                <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
            <span>You are offline. Some features may not work.</span>
        `;
        document.body.appendChild(offlineToast);
    };
    
    const hideOfflineWarning = () => {
        console.log("✅ User is back online");
        
        if (offlineToast) {
            offlineToast.remove();
            offlineToast = null;
        }
    };
    
    // Listen for online/offline events
    window.addEventListener('offline', showOfflineWarning);
    window.addEventListener('online', hideOfflineWarning);
    
    console.log("✅ Network status monitoring enabled");

    // =============================================================================
    // 8. KEYBOARD SHORTCUTS (Optional Enhancement)
    // =============================================================================
    
    /**
     * Global keyboard shortcuts for better UX
     * Ctrl/Cmd + K: Focus search (if available)
     * Ctrl/Cmd + L: Logout
     * Escape: Close mobile menu
     */
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + L = Logout
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            console.log("⌨️ Keyboard shortcut: Logout (Ctrl/Cmd + L)");
            handleLogout();
        }
        
        // Ctrl/Cmd + H = Go to home
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault();
            console.log("⌨️ Keyboard shortcut: Home (Ctrl/Cmd + H)");
            window.location.href = 'home.html';
        }
    });
    
    console.log("✅ Keyboard shortcuts enabled");

    // =============================================================================
    // 9. SESSION TIMEOUT WARNING (Optional Enhancement)
    // =============================================================================
    
    /**
     * Warns user before session expires
     * Useful for security in shared computers
     */
    let inactivityTimeout = null;
    const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds
    
    const resetInactivityTimer = () => {
        // Clear existing timer
        if (inactivityTimeout) {
            clearTimeout(inactivityTimeout);
        }
        
        // Set new timer
        inactivityTimeout = setTimeout(() => {
            console.warn("⏰ Session timeout due to inactivity");
            
            const shouldLogout = confirm(
                "Your session has been inactive for 30 minutes.\n\n" +
                "For security reasons, you will be logged out.\n\n" +
                "Click OK to stay logged in, or Cancel to logout now."
            );
            
            if (!shouldLogout) {
                handleLogout();
            } else {
                resetInactivityTimer(); // Reset timer if user wants to stay
            }
        }, INACTIVITY_TIME);
    };
    
    // Track user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(event => {
        document.addEventListener(event, resetInactivityTimer, { passive: true });
    });
    
    // Initialize timer
    resetInactivityTimer();
    console.log("✅ Inactivity timeout set to 30 minutes");

    // =============================================================================
    // 10. UTILITY FUNCTIONS (Available globally)
    // =============================================================================
    
    /**
     * Format timestamp to readable format
     */
    window.formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Just now';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    };
    
    /**
     * Show toast notification
     */
    window.showToast = (message, type = 'info') => {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-orange-500',
            info: 'bg-blue-500'
        };
        
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-fadeIn`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    };
    
    console.log("✅ Utility functions registered");

    // =============================================================================
    // 11. ERROR BOUNDARY (Optional Enhancement)
    // =============================================================================
    
    /**
     * Global error handler to catch uncaught errors
     */
    window.addEventListener('error', (event) => {
        console.error('🔴 Uncaught error:', event.error);
        
        // Log to analytics or error tracking service
        // Example: Sentry, LogRocket, etc.
        
        // Show user-friendly message
        if (window.showToast) {
            showToast('An error occurred. Please refresh the page.', 'error');
        }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
        console.error('🔴 Unhandled promise rejection:', event.reason);
        
        // Show user-friendly message
        if (window.showToast) {
            showToast('An error occurred. Please refresh the page.', 'error');
        }
    });
    
    console.log("✅ Global error handlers registered");

    // =============================================================================
    // 12. INITIALIZATION COMPLETE
    // =============================================================================
    
    console.log("✅ Main.js initialization complete");
    console.log("📱 Responsive menu: Ready");
    console.log("🚪 Logout functionality: Ready");
    console.log("🌐 Network monitoring: Active");
    console.log("⌨️ Keyboard shortcuts: Enabled");
    console.log("⏰ Session timeout: 30 minutes");
    console.log("🛠️ Utility functions: Available");
    
    // Mark main.js as loaded for other scripts
    window.mainJsLoaded = true;
});

// =============================================================================
// END OF MAIN.JS
// =============================================================================