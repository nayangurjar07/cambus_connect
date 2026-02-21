// Authentication Guard - Protects pages from unauthorized access
// This script must be loaded on EVERY page to enforce authentication

document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userRole = localStorage.getItem('userRole');

    // Get current page
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';

    const loginPath = 'index.html';
    const adminHomePath = 'admin.html';
    const studentHomePath = 'home.html';

    console.log(`Auth Guard checking page: ${page}, Logged in: ${isLoggedIn}, Role: ${userRole}`);

    // Public pages (no authentication required)
    const publicPages = ['index.html', 'login.html', ''];

    // Admin-only pages
    const adminPages = ['admin.html', 'admin-track.html'];

    // Student-only pages
    const studentPages = [
        'home.html',
        'bus-pass.html',
        'track.html',
        'notifications.html',
        'lost-found.html',
        'profile.html',
        'help.html',
        'search.html',
        'support.html'
    ];

    // RULE 1: If NOT logged in and trying to access protected page -> Redirect to login
    if (isLoggedIn !== 'true' && !publicPages.includes(page)) {
        console.log('Not authenticated. Redirecting to login...');
        window.location.href = loginPath;
        return;
    }

    // RULE 2: If logged in and on login page -> Redirect to appropriate dashboard
    if (isLoggedIn === 'true' && publicPages.includes(page)) {
        console.log('Already logged in. Redirecting to dashboard...');
        if (userRole === 'admin') {
            window.location.href = adminHomePath;
        } else {
            window.location.href = studentHomePath;
        }
        return;
    }

    // RULE 3: If student trying to access admin page -> Deny access
    if (isLoggedIn === 'true' && userRole === 'student' && adminPages.includes(page)) {
        alert('Access Denied!\n\nThis page is for administrators only.\nYou will be redirected to the student dashboard.');
        window.location.href = studentHomePath;
        return;
    }

    // RULE 4: If admin trying to access student pages -> Redirect to admin panel
    if (isLoggedIn === 'true' && userRole === 'admin' && studentPages.includes(page)) {
        window.location.href = adminHomePath;
        return;
    }

    console.log(`Auth guard passed for ${page}`);
});
