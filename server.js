require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// Configure multer for photo uploads (separate from employee uploads)
const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'photos');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Use original filename to keep a clean gallery
        cb(null, file.originalname);
    }
});

const photoUpload = multer({ storage: photoStorage });

// Configure multer for employee photo uploads
const employeeStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'employee');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Use original filename with timestamp to avoid conflicts
        const timestamp = Date.now();
        cb(null, `${timestamp}-${file.originalname}`);
    }
});

const upload = multer({ storage: employeeStorage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter connection
transporter.verify((error, success) => {
    if (error) {
        console.log('Email transporter error:', error);
    } else {
        console.log('Email transporter ready:', success);
    }
});

// Store OTPs temporarily (in memory)
const otpStore = {};

// Store admin credentials (persistently via JSON file)
const credsPath = path.join(__dirname, 'adminCredentials.json');
let adminCredentials = { email: process.env.EMAIL_USER, password: 'Som@123' };

if (fs.existsSync(credsPath)) {
    try {
        adminCredentials = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    } catch (err) {
        console.error('Error reading credentials file:', err);
    }
} else {
    fs.writeFileSync(credsPath, JSON.stringify(adminCredentials), 'utf8');
}

// Route to get employees
app.get('/api/employees', (req, res) => {
    const csvPath = path.join(__dirname, 'employee', 'employee.csv');
    fs.readFile(csvPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading CSV' });
        }
        const lines = data.trim().split('\n').filter(line => line.trim()); // Filter empty lines
        const employees = lines.map(line => {
            const [order, name, photo, position, description] = line.split(',');
            if (!order || !name || !photo || !position || !description) {
                console.warn('Skipping malformed line:', line);
                return null;
            }
            return { 
                order: parseInt(order.trim()), 
                name: name.trim(), 
                photo: photo.trim(), 
                position: position.trim(), 
                description: description.trim() 
            };
        }).filter(emp => emp !== null); // Remove null entries
        // Sort by order
        employees.sort((a, b) => a.order - b.order);
        res.json(employees);
    });
});

// Route to add employee
app.post('/api/employees', (req, res) => {
    const { name, photo, position, description, order } = req.body;
    const employeeDir = path.join(__dirname, 'employee');
    const csvPath = path.join(employeeDir, 'employee.csv');
    
    // Validate inputs
    if (!name || !photo || !position || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Ensure employee directory exists
    if (!fs.existsSync(employeeDir)) {
        fs.mkdirSync(employeeDir, { recursive: true });
    }
    
    // Function to add employee to CSV
    function addEmployee(orderNum) {
        // Ensure CSV file exists and is readable
        if (!fs.existsSync(csvPath)) {
            console.log('CSV file does not exist, creating it...');
            fs.writeFileSync(csvPath, '', 'utf8');
        }
        
        const newLine = `${orderNum},${name},${photo},${position},${description}\n`;
        console.log('Adding line to CSV:', newLine);
        console.log('CSV Path:', csvPath);
        
        try {
            // Use synchronous write to ensure it completes
            fs.appendFileSync(csvPath, newLine, 'utf8');
            console.log('Employee added successfully');
            res.json({ message: 'Employee added' });
        } catch (err) {
            console.error('Full error object:', err);
            console.error('Error code:', err.code);
            console.error('Error message:', err.message);
            return res.status(500).json({ error: 'Error adding employee: ' + err.message });
        }
    }
    
    // If order is not provided, calculate the next order
    let finalOrder = order;
    if (!finalOrder) {
        fs.readFile(csvPath, 'utf8', (err, data) => {
            if (err && err.code !== 'ENOENT') {
                console.error('Error reading CSV:', err);
                return res.status(500).json({ error: 'Error reading CSV' });
            }
            let maxOrder = 0;
            if (data) {
                const lines = data.trim().split('\n');
                lines.forEach(line => {
                    const [orderStr] = line.split(',');
                    const orderNum = parseInt(orderStr.trim());
                    if (orderNum > maxOrder) maxOrder = orderNum;
                });
            }
            finalOrder = maxOrder + 1;
            addEmployee(finalOrder);
        });
    } else {
        addEmployee(finalOrder);
    }
});

// Route to update employee
app.put('/api/employees/:index', (req, res) => {
    const index = parseInt(req.params.index);
    const { order, name, photo, position, description } = req.body;
    const csvPath = path.join(__dirname, 'employee', 'employee.csv');
    fs.readFile(csvPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading CSV' });
        }
        const lines = data.trim().split('\n');
        if (index < 0 || index >= lines.length) {
            return res.status(400).json({ error: 'Invalid index' });
        }
        lines[index] = `${order || 1},${name},${photo},${position},${description}`;
        const newData = lines.join('\n') + '\n';
        fs.writeFile(csvPath, newData, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error updating employee' });
            }
            res.json({ message: 'Employee updated' });
        });
    });
});

// Route to change employee order
app.put('/api/employees/:index/order', (req, res) => {
    const index = parseInt(req.params.index);
    const { direction } = req.body; // 'up' or 'down'
    const csvPath = path.join(__dirname, 'employee', 'employee.csv');
    
    fs.readFile(csvPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading CSV' });
        }
        const lines = data.trim().split('\n');
        if (index < 0 || index >= lines.length) {
            return res.status(400).json({ error: 'Invalid index' });
        }
        
        // Parse employees
        const employees = lines.map(line => {
            const [order, name, photo, position, description] = line.split(',');
            return { order: parseInt(order.trim()), name, photo, position, description };
        });
        
        // Get current employee
        const currentEmployee = employees[index];
        let swapIndex = -1;
        
        if (direction === 'up' && index > 0) {
            swapIndex = index - 1;
        } else if (direction === 'down' && index < employees.length - 1) {
            swapIndex = index + 1;
        }
        
        if (swapIndex !== -1) {
            // Swap order values
            const temp = employees[index].order;
            employees[index].order = employees[swapIndex].order;
            employees[swapIndex].order = temp;
            
            // Sort by order and recreate lines
            employees.sort((a, b) => a.order - b.order);
            const newLines = employees.map(emp => `${emp.order},${emp.name},${emp.photo},${emp.position},${emp.description}`);
            const newData = newLines.join('\n') + '\n';
            
            fs.writeFile(csvPath, newData, (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Error updating order' });
                }
                res.json({ message: 'Order changed' });
            });
        } else {
            res.status(400).json({ error: 'Cannot move in that direction' });
        }
    });
});

// Route to delete employee
app.delete('/api/employees/:index', (req, res) => {
    const index = parseInt(req.params.index);
    const csvPath = path.join(__dirname, 'employee', 'employee.csv');
    fs.readFile(csvPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading CSV' });
        }
        const lines = data.trim().split('\n');
        if (index < 0 || index >= lines.length) {
            return res.status(400).json({ error: 'Invalid index' });
        }
        lines.splice(index, 1);
        const newData = lines.join('\n') + (lines.length > 0 ? '\n' : '');
        fs.writeFile(csvPath, newData, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error deleting employee' });
            }
            res.json({ message: 'Employee deleted' });
        });
    });
});

// Route to upload photo
app.post('/api/upload', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ filename: req.file.filename });
});

// Route to get all photos
app.get('/api/photos', (req, res) => {
    const photosDir = path.join(__dirname, 'photos');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(photosDir)) {
        fs.mkdirSync(photosDir, { recursive: true });
        return res.json([]);
    }
    
    fs.readdir(photosDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading photos directory' });
        }
        
        // Filter only image files
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const photos = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return imageExtensions.includes(ext);
        });
        
        res.json(photos);
    });
});

// Route to upload gallery photo (admin only)
app.post('/api/photos', photoUpload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ filename: req.file.filename });
});

// Route to delete gallery photo (admin only)
app.delete('/api/photos/:filename', (req, res) => {
    const filename = req.params.filename;
    const photosDir = path.join(__dirname, 'photos');
    const filePath = path.join(photosDir, filename);
    
    // Security: Prevent directory traversal
    if (!filePath.startsWith(photosDir)) {
        return res.status(400).json({ error: 'Invalid filename' });
    }
    
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting photo:', err);
            return res.status(500).json({ error: 'Error deleting photo' });
        }
        res.json({ message: 'Photo deleted' });
    });
});

// Route to send inquiry email
app.post('/api/send-inquiry', (req, res) => {
    const { name, email, message } = req.body;
    
    console.log('Inquiry received:', { name, email, message: message.substring(0, 50) });
    
    // Validate inputs
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Missing required fields', success: false });
    }
    
    // Prepare email
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: name,
        html: `
            <h3>New Inquiry from SOM Enterprises Website</h3>
            <p><strong>From:</strong> ${email}</p>
            <p><strong>Name:</strong> ${name}</p>
            <hr>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
        `
    };
    
    console.log('Sending email...');
    
    // Send email
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error('Email error:', err);
            console.error('Error code:', err.code);
            console.error('Error response:', err.response);
            return res.status(500).json({ 
                error: 'Error sending email: ' + err.message, 
                success: false,
                details: err.message 
            });
        }
        console.log('Email sent successfully:', info.response);
        res.json({ message: 'Inquiry sent successfully', success: true });
    });
});

// Route to send OTP for password reset
app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    
    // Verify email
    if (email !== process.env.EMAIL_USER) {
        return res.status(400).json({ error: 'Email not found', success: false });
    }
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration (10 minutes)
    otpStore[email] = {
        otp: otp,
        expiresAt: Date.now() + 10 * 60 * 1000
    };
    
    console.log(`OTP for ${email}: ${otp}`);
    
    // Send OTP via email
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset OTP - SOM Enterprises',
        html: `
            <h3>Password Reset Request</h3>
            <p>You requested a password reset. Use this OTP to proceed:</p>
            <h2 style="color: #0f5a6f; font-size: 32px; letter-spacing: 2px;">${otp}</h2>
            <p>This OTP is valid for 10 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        `
    };
    
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error('Error sending OTP:', err);
            return res.status(500).json({ error: 'Error sending OTP email', success: false });
        }
        console.log('OTP email sent successfully');
        res.json({ message: 'OTP sent to email', success: true });
    });
});

// Route to verify OTP
app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    
    if (!otpStore[email]) {
        return res.status(400).json({ error: 'OTP expired or not found', success: false });
    }
    
    const stored = otpStore[email];
    
    // Check if OTP is expired
    if (Date.now() > stored.expiresAt) {
        delete otpStore[email];
        return res.status(400).json({ error: 'OTP expired', success: false });
    }
    
    // Check if OTP matches
    if (stored.otp !== otp) {
        return res.status(400).json({ error: 'Invalid OTP', success: false });
    }
    
    // OTP is valid, generate reset token
    const resetToken = Math.random().toString(36).substr(2, 10);
    otpStore[email].resetToken = resetToken;
    
    res.json({ 
        message: 'OTP verified', 
        success: true, 
        token: resetToken 
    });
});

// Route to reset password
app.post('/api/reset-password', (req, res) => {
    const { email, token, newPassword } = req.body;
    
    if (!otpStore[email] || otpStore[email].resetToken !== token) {
        return res.status(400).json({ error: 'Invalid reset token', success: false });
    }
    
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters', success: false });
    }
    
    // Update password
    adminCredentials.password = newPassword;
    
    // Save to persistent file
    try {
        fs.writeFileSync(credsPath, JSON.stringify(adminCredentials), 'utf8');
        console.log(`Password reset for ${email}. New password stored persistently.`);
    } catch (err) {
        console.error('Failed to save updated credentials:', err);
    }
    
    // Clear OTP data
    delete otpStore[email];
    
    res.json({ 
        message: 'Password reset successfully', 
        success: true 
    });
});

// Route to verify login credentials
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing credentials', success: false });
    }
    
    if (username === adminCredentials.email && password === adminCredentials.password) {
        res.json({ 
            message: 'Login successful', 
            success: true 
        });
    } else {
        res.status(401).json({ 
            error: 'Invalid username or password', 
            success: false 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});