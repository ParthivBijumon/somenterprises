// Update navbar based on login status
function updateNavbar() {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    const adminLink = document.getElementById('adminLink');
    if (adminLink) {
        if (isAdmin) {
            adminLink.querySelector('a').textContent = 'Admin';
            adminLink.querySelector('a').href = 'admin.html';
        } else {
            adminLink.querySelector('a').textContent = 'Login';
            adminLink.querySelector('a').href = 'login.html';
        }
    }
    // Hide logout link in navbar (only show on admin page)
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) logoutLink.style.display = 'none';
}

// Logout function
function logout() {
    sessionStorage.removeItem('isAdmin');
    updateNavbar();
    window.location.href = 'index.html';
}

// Initialize navbar on page load
document.addEventListener('DOMContentLoaded', updateNavbar);

// Also check and update if login status changes (for other tabs)
window.addEventListener('storage', updateNavbar);
