// Check if already logged in
document.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('isAdmin') === 'true') {
        window.location.href = 'admin.html';
    }
});

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Get username from form
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('loginMessage');


    // Send login request to server
    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            messageDiv.style.color = 'green';
            messageDiv.textContent = 'Login successful! Redirecting...';

            // Store login status in sessionStorage
            sessionStorage.setItem('isAdmin', 'true');

            // Redirect to admin page after a short delay
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
        } else {
            messageDiv.style.color = 'red';
            messageDiv.textContent = data.error || 'Invalid password.';
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        messageDiv.style.color = 'red';
        messageDiv.textContent = 'Error during login. Please try again.';
    });
});

// Show forgot password form
function showForgotPassword() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('forgotPasswordSection').style.display = 'block';
}

// Back to login
function backToLogin() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('forgotPasswordSection').style.display = 'none';
    document.getElementById('forgotMessage').textContent = '';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}