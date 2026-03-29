// Generate random OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP
function sendOTP(event) {
    event.preventDefault();
    
    const email = document.getElementById('forgotEmail').value;
    const messageDiv = document.getElementById('forgotMessage');
    
    if (!email) {
        messageDiv.textContent = 'Please enter your email';
        messageDiv.style.color = 'red';
        return;
    }
    
    // Send request to server
    fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            messageDiv.textContent = 'OTP sent to your email!';
            messageDiv.style.color = 'green';
            
            // Show OTP verification step
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
            
            // Store email for later use
            sessionStorage.setItem('resetEmail', email);
        } else {
            messageDiv.textContent = data.error || 'Error sending OTP';
            messageDiv.style.color = 'red';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        messageDiv.textContent = 'Error sending OTP';
        messageDiv.style.color = 'red';
    });
}

// Verify OTP
function verifyOTP(event) {
    event.preventDefault();
    
    const otp = document.getElementById('otp').value;
    const email = sessionStorage.getItem('resetEmail');
    const messageDiv = document.getElementById('forgotMessage');
    
    if (!otp) {
        messageDiv.textContent = 'Please enter OTP';
        messageDiv.style.color = 'red';
        return;
    }
    
    // Send request to server
    fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            messageDiv.textContent = 'OTP verified! Enter new password';
            messageDiv.style.color = 'green';
            
            // Show password reset step
            document.getElementById('step2').style.display = 'none';
            document.getElementById('step3').style.display = 'block';
            
            // Store reset token
            sessionStorage.setItem('resetToken', data.token);
        } else {
            messageDiv.textContent = data.error || 'Invalid OTP';
            messageDiv.style.color = 'red';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        messageDiv.textContent = 'Error verifying OTP';
        messageDiv.style.color = 'red';
    });
}

// Reset Password
function resetPassword(event) {
    event.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const email = sessionStorage.getItem('resetEmail');
    const token = sessionStorage.getItem('resetToken');
    const messageDiv = document.getElementById('forgotMessage');
    
    if (!newPassword || !confirmPassword) {
        messageDiv.textContent = 'Please enter password';
        messageDiv.style.color = 'red';
        return;
    }
    
    if (newPassword !== confirmPassword) {
        messageDiv.textContent = 'Passwords do not match';
        messageDiv.style.color = 'red';
        return;
    }
    
    if (newPassword.length < 6) {
        messageDiv.textContent = 'Password must be at least 6 characters';
        messageDiv.style.color = 'red';
        return;
    }
    
    // Send request to server
    fetch('/api/reset-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, token, newPassword })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            messageDiv.textContent = 'Password reset successfully! Redirecting to login...';
            messageDiv.style.color = 'green';
            
            // Clear session
            sessionStorage.removeItem('resetEmail');
            sessionStorage.removeItem('resetToken');
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                backToLogin();
                document.getElementById('loginSection').style.display = 'block';
                document.getElementById('forgotPasswordSection').style.display = 'none';
                resetForgotPasswordForm();
            }, 2000);
        } else {
            messageDiv.textContent = data.error || 'Error resetting password';
            messageDiv.style.color = 'red';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        messageDiv.textContent = 'Error resetting password';
        messageDiv.style.color = 'red';
    });
}

// Reset forgot password form
function resetForgotPasswordForm() {
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    document.getElementById('forgotEmail').value = '';
    document.getElementById('otp').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('forgotMessage').textContent = '';
}
