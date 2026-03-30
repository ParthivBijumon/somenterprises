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
document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            // Change hamburger character based on state
            if (navLinks.classList.contains('active')) {
                mobileMenuBtn.textContent = '✕';
            } else {
                mobileMenuBtn.textContent = '☰';
            }
        });
        
        // Close menu when a link is clicked
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuBtn.textContent = '☰';
            });
        });
    }
});

// Also check and update if login status changes (for other tabs)
window.addEventListener('storage', updateNavbar);
