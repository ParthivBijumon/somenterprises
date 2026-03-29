// Check if user is logged in
if (!sessionStorage.getItem('isAdmin')) {
    window.location.href = 'login.html';
}

let employees = [];

// Load employees from server
async function loadEmployees() {
    try {
        const response = await fetch('/api/employees');
        employees = await response.json();
        displayEmployees();
    } catch (error) {
        console.error('Error loading employees:', error);
        document.getElementById('employeesList').innerHTML = '<p>Error loading employee data.</p>';
    }
}

// Display employees in admin panel
function displayEmployees() {
    const list = document.getElementById('employeesList');
    list.innerHTML = '';

    employees.forEach((employee, index) => {
        const card = document.createElement('div');
        card.className = 'employee-admin-card';

        card.innerHTML = `
            <p><strong>Order:</strong> ${employee.order}</p>
            <h4>${employee.position}</h4>
            <p><strong>Name:</strong> ${employee.name}</p>
            <p><strong>Photo:</strong> ${employee.photo}</p>
            <p><strong>Description:</strong> ${employee.description}</p>
            <div class="employee-actions">
                ${index > 0 ? `<button class="btn-small btn-move-up" onclick="moveEmployeeUp(${index})">↑ Move Up</button>` : ''}
                ${index < employees.length - 1 ? `<button class="btn-small btn-move-down" onclick="moveEmployeeDown(${index})">↓ Move Down</button>` : ''}
                <button class="btn-small btn-edit" onclick="editEmployee(${index})">Edit</button>
                <button class="btn-small btn-delete" onclick="deleteEmployee(${index})">Delete</button>
            </div>
        `;

        list.appendChild(card);
    });
}

// Add new employee
document.getElementById('addEmployeeForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const photoFile = document.getElementById('empPhoto').files[0];
    
    let photoFilename = '';
    
    // Upload photo if provided
    if (photoFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('photo', photoFile);
        
        try {
            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: uploadFormData
            });
            
            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                console.error('Upload error:', errorData);
                alert('Error uploading photo: ' + (errorData.error || 'Unknown error'));
                return;
            }
            
            const uploadData = await uploadResponse.json();
            photoFilename = uploadData.filename;
            console.log('Photo uploaded:', photoFilename);
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Error uploading photo: ' + error.message);
            return;
        }
    } else {
        alert('Please select a photo');
        return;
    }
    
    // Create new employee object with form values
    const formDataObj = new FormData(this);
    const newEmployee = {
        order: formDataObj.get('order') ? parseInt(formDataObj.get('order')) : null,
        name: formDataObj.get('name'),
        photo: photoFilename,
        position: formDataObj.get('position'),
        description: formDataObj.get('description')
    };
    
    console.log('Adding employee:', newEmployee);

    try {
        const response = await fetch('/api/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newEmployee)
        });
        
        const responseData = await response.json();
        console.log('Server response:', response.status, responseData);
        
        if (response.ok) {
            loadEmployees();
            this.reset();
            alert('Employee added successfully!');
        } else {
            console.error('Error response:', responseData);
            alert('Error adding employee: ' + (responseData.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Network/Parse Error:', error);
        alert('Error adding employee: ' + error.message);
    }
});

// Edit employee
function editEmployee(index) {
    const employee = employees[index];
    document.getElementById('editIndex').value = index;
    document.getElementById('editOrder').value = employee.order;
    document.getElementById('editName').value = employee.name;
    document.getElementById('editPhoto').value = ''; // Clear file input
    document.getElementById('editPhoto').dataset.currentPhoto = employee.photo; // Store current photo
    document.getElementById('editPosition').value = employee.position;
    document.getElementById('editDescription').value = employee.description;

    document.getElementById('editModal').style.display = 'block';
}

// Handle edit form submission
document.getElementById('editEmployeeForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const index = document.getElementById('editIndex').value;
    const photoFileInput = document.getElementById('editPhoto');
    const photoFile = photoFileInput.files[0];
    const currentPhoto = photoFileInput.dataset.currentPhoto;
    
    let photoFilename = currentPhoto; // Default to current photo
    
    // Upload new photo if selected
    if (photoFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('photo', photoFile);
        
        try {
            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: uploadFormData
            });
            
            if (!uploadResponse.ok) {
                alert('Error uploading photo');
                return;
            }
            
            const uploadData = await uploadResponse.json();
            photoFilename = uploadData.filename;
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Error uploading photo');
            return;
        }
    }

    const formData = new FormData(this);
    const updatedEmployee = {
        order: parseInt(formData.get('order')),
        name: formData.get('name'),
        photo: photoFilename,
        position: formData.get('position'),
        description: formData.get('description')
    };

    try {
        const response = await fetch(`/api/employees/${index}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedEmployee)
        });
        if (response.ok) {
            loadEmployees();
            document.getElementById('editModal').style.display = 'none';
            alert('Employee updated successfully!');
        } else {
            alert('Error updating employee');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error updating employee');
    }
});

// Move employee up
async function moveEmployeeUp(index) {
    try {
        const response = await fetch(`/api/employees/${index}/order`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ direction: 'up' })
        });
        if (response.ok) {
            loadEmployees();
        } else {
            alert('Error moving employee');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error moving employee');
    }
}

// Move employee down
async function moveEmployeeDown(index) {
    try {
        const response = await fetch(`/api/employees/${index}/order`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ direction: 'down' })
        });
        if (response.ok) {
            loadEmployees();
        } else {
            alert('Error moving employee');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error moving employee');
    }
}

// Delete employee
async function deleteEmployee(index) {
    if (confirm('Are you sure you want to delete this employee?')) {
        try {
            const response = await fetch(`/api/employees/${index}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                loadEmployees();
                alert('Employee deleted successfully!');
            } else {
                alert('Error deleting employee');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error deleting employee');
        }
    }
}

// Modal close
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('editModal').style.display = 'none';
});

window.addEventListener('click', function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Logout function
function logout() {
    sessionStorage.removeItem('isAdmin');
    window.location.href = 'index.html';
}

// Load employees when page loads
document.addEventListener('DOMContentLoaded', loadEmployees);