require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Configure multer for photo uploads (separate from employee uploads)
const photoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'photos');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const photoUpload = multer({ storage: photoStorage });

// Configure multer for employee photo uploads
const employeeStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'employee');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        cb(null, `${timestamp}-${file.originalname}`);
    }
});

const upload = multer({ storage: employeeStorage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// Function to send email via Google Apps Script
async function sendEmailViaGoogle(to, subject, html) {
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (!scriptUrl) {
        throw new Error('GOOGLE_SCRIPT_URL is not defined in environment variables');
    }

    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            redirect: 'follow', // Follow redirects as Apps Script responds via 302
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Bypass preflight requirements on GAS
            body: JSON.stringify({ to, subject, html })
        });
        
        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch(e) {
            throw new Error('Invalid response from Google Script: ' + responseText.substring(0, 100));
        }

        if (!data.success) throw new Error(data.error || 'Google Script failed');
        return data;
    } catch (err) {
        console.error('Email sending error via Google Script:', err);
        throw err;
    }
}

// Store OTPs temporarily (in memory)
const otpStore = {};

// Store admin credentials
const credsPath = path.join(__dirname, 'adminCredentials.json');
let adminCredentials = { email: 'leoparthik@gmail.com', password: 'Som@123' };

if (fs.existsSync(credsPath)) {
    try {
        adminCredentials = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
        if (!adminCredentials.email) adminCredentials.email = 'leoparthik@gmail.com';
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
        if (err) return res.status(500).json({ error: 'Error reading CSV' });
        const lines = data.trim().split('\n').filter(line => line.trim());
        const employees = lines.map(line => {
            const [order, name, photo, position, description] = line.split(',');
            if (!order || !name || !photo || !position || !description) return null;
            return { 
                order: parseInt(order.trim()), 
                name: name.trim(), 
                photo: photo.trim(), 
                position: position.trim(), 
                description: description.trim() 
            };
        }).filter(emp => emp !== null);
        employees.sort((a, b) => a.order - b.order);
        res.json(employees);
    });
});

app.post('/api/employees', (req, res) => {
    const { name, photo, position, description, order } = req.body;
    const employeeDir = path.join(__dirname, 'employee');
    const csvPath = path.join(employeeDir, 'employee.csv');
    if (!name || !photo || !position || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!fs.existsSync(employeeDir)) fs.mkdirSync(employeeDir, { recursive: true });
    
    function addEmployee(orderNum) {
        if (!fs.existsSync(csvPath)) fs.writeFileSync(csvPath, '', 'utf8');
        const newLine = `${orderNum},${name},${photo},${position},${description}\n`;
        try {
            fs.appendFileSync(csvPath, newLine, 'utf8');
            res.json({ message: 'Employee added' });
        } catch (err) {
            return res.status(500).json({ error: 'Error adding employee' });
        }
    }
    
    let finalOrder = order;
    if (!finalOrder) {
        fs.readFile(csvPath, 'utf8', (err, data) => {
            if (err && err.code !== 'ENOENT') return res.status(500).json({ error: 'Error reading CSV' });
            let maxOrder = 0;
            if (data) {
                const lines = data.trim().split('\n');
                lines.forEach(line => {
                    const orderNum = parseInt(line.split(',')[0].trim());
                    if (orderNum > maxOrder) maxOrder = orderNum;
                });
            }
            addEmployee(maxOrder + 1);
        });
    } else {
        addEmployee(finalOrder);
    }
});

app.put('/api/employees/:index', (req, res) => {
    const index = parseInt(req.params.index);
    const { order, name, photo, position, description } = req.body;
    const csvPath = path.join(__dirname, 'employee', 'employee.csv');
    fs.readFile(csvPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error reading CSV' });
        const lines = data.trim().split('\n');
        if (index < 0 || index >= lines.length) return res.status(400).json({ error: 'Invalid index' });
        lines[index] = `${order || 1},${name},${photo},${position},${description}`;
        fs.writeFile(csvPath, lines.join('\n') + '\n', (err) => {
            if (err) return res.status(500).json({ error: 'Error updating employee' });
            res.json({ message: 'Employee updated' });
        });
    });
});

app.put('/api/employees/:index/order', (req, res) => {
    const index = parseInt(req.params.index);
    const { direction } = req.body;
    const csvPath = path.join(__dirname, 'employee', 'employee.csv');
    
    fs.readFile(csvPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error reading CSV' });
        const lines = data.trim().split('\n');
        if (index < 0 || index >= lines.length) return res.status(400).json({ error: 'Invalid index' });
        
        const employees = lines.map(line => {
            const [order, name, photo, position, description] = line.split(',');
            return { order: parseInt(order.trim()), name, photo, position, description };
        });
        
        let swapIndex = -1;
        if (direction === 'up' && index > 0) swapIndex = index - 1;
        else if (direction === 'down' && index < employees.length - 1) swapIndex = index + 1;
        
        if (swapIndex !== -1) {
            const temp = employees[index].order;
            employees[index].order = employees[swapIndex].order;
            employees[swapIndex].order = temp;
            
            employees.sort((a, b) => a.order - b.order);
            const newLines = employees.map(emp => `${emp.order},${emp.name},${emp.photo},${emp.position},${emp.description}`);
            fs.writeFile(csvPath, newLines.join('\n') + '\n', (err) => {
                if (err) return res.status(500).json({ error: 'Error updating order' });
                res.json({ message: 'Order changed' });
            });
        } else {
            res.status(400).json({ error: 'Cannot move in that direction' });
        }
    });
});

app.delete('/api/employees/:index', (req, res) => {
    const index = parseInt(req.params.index);
    const csvPath = path.join(__dirname, 'employee', 'employee.csv');
    fs.readFile(csvPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Error reading CSV' });
        const lines = data.trim().split('\n');
        if (index < 0 || index >= lines.length) return res.status(400).json({ error: 'Invalid index' });
        lines.splice(index, 1);
        fs.writeFile(csvPath, lines.join('\n') + (lines.length > 0 ? '\n' : ''), (err) => {
            if (err) return res.status(500).json({ error: 'Error deleting employee' });
            res.json({ message: 'Employee deleted' });
        });
    });
});

app.post('/api/upload', upload.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ filename: req.file.filename });
});

app.get('/api/photos', (req, res) => {
    const photosDir = path.join(__dirname, 'photos');
    if (!fs.existsSync(photosDir)) {
        fs.mkdirSync(photosDir, { recursive: true });
        return res.json([]);
    }
    fs.readdir(photosDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Error reading photos' });
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const photos = files.filter(file => imageExtensions.includes(path.extname(file).toLowerCase()));
        res.json(photos);
    });
});

app.post('/api/photos', photoUpload.single('photo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ filename: req.file.filename });
});

app.delete('/api/photos/:filename', (req, res) => {
    const filename = req.params.filename;
    const photosDir = path.join(__dirname, 'photos');
    const filePath = path.join(photosDir, filename);
    if (!filePath.startsWith(photosDir)) return res.status(400).json({ error: 'Invalid filename' });
    fs.unlink(filePath, (err) => {
        if (err) return res.status(500).json({ error: 'Error deleting photo' });
        res.json({ message: 'Photo deleted' });
    });
});

app.post('/api/send-inquiry', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Missing req fields', success: false });
    
    // Send email via Google Script
    const targetEmail = process.env.EMAIL_USER || 'leoparthik@gmail.com';
    const subject = `New Inquiry from ${name}`;
    const html = `<h3>New Inquiry</h3><p><strong>From:</strong> ${email}</p><p><strong>Name:</strong> ${name}</p><hr><p>${message}</p>`;
    
    sendEmailViaGoogle(targetEmail, subject, html)
        .then(() => res.json({ message: 'Inquiry sent successfully', success: true }))
        .catch(err => res.status(500).json({ error: 'Error sending email: ' + err.message, success: false }));
});

app.post('/api/forgot-password', (req, res) => {
    const { email } = req.body;
    const systemEmail = process.env.EMAIL_USER || 'leoparthik@gmail.com';
    
    // Trim and lower case effectively ignores random invisible spaces/formatting glitches!
    if (email.trim().toLowerCase() !== systemEmail.trim().toLowerCase()) {
        return res.status(400).json({ error: 'Email not found', success: false });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };
    
    const subject = 'Password Reset OTP - SOM Enterprises';
    const html = `<h3>Password Reset</h3><p>Use this OTP to proceed:</p><h2>${otp}</h2><p>Valid for 10 min.</p>`;
    
    sendEmailViaGoogle(email, subject, html)
        .then(() => res.json({ message: 'OTP sent to email', success: true }))
        .catch(err => res.status(500).json({ error: 'Error sending OTP email', success: false }));
});

app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!otpStore[email]) return res.status(400).json({ error: 'OTP expired or not found', success: false });
    
    const stored = otpStore[email];
    if (Date.now() > stored.expiresAt) {
        delete otpStore[email];
        return res.status(400).json({ error: 'OTP expired', success: false });
    }
    
    if (stored.otp !== otp) return res.status(400).json({ error: 'Invalid OTP', success: false });
    
    const resetToken = Math.random().toString(36).substr(2, 10);
    otpStore[email].resetToken = resetToken;
    res.json({ message: 'OTP verified', success: true, token: resetToken });
});

app.post('/api/reset-password', (req, res) => {
    const { email, token, newPassword } = req.body;
    if (!otpStore[email] || otpStore[email].resetToken !== token) {
        return res.status(400).json({ error: 'Invalid reset token', success: false });
    }
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters', success: false });
    }
    
    adminCredentials.password = newPassword;
    try {
        fs.writeFileSync(credsPath, JSON.stringify(adminCredentials), 'utf8');
    } catch (err) {
        console.error('Failed to save updated credentials:', err);
    }
    
    delete otpStore[email];
    res.json({ message: 'Password reset successfully', success: true });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials', success: false });
    
    if (username.trim().toLowerCase() === adminCredentials.email.trim().toLowerCase() && password === adminCredentials.password) {
        res.json({ message: 'Login successful', success: true });
    } else {
        res.status(401).json({ error: 'Invalid username or password', success: false });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
