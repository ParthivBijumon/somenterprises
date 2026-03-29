// Load employees from server
async function loadEmployees() {
    try {
        const response = await fetch('/api/employees');
        const employees = await response.json();
        displayEmployees(employees);
    } catch (error) {
        console.error('Error loading employees:', error);
        document.getElementById('employeesGrid').innerHTML = '<p>Error loading employee data.</p>';
    }
}

// Display employees in the grid
function displayEmployees(employees) {
    const grid = document.getElementById('employeesGrid');

    employees.forEach(employee => {
        const card = document.createElement('div');
        card.className = 'employee-card';

        card.innerHTML = `
            <img src="employee/${employee.photo}" alt="${employee.name}" class="employee-photo" onerror="this.src='https://via.placeholder.com/150x150?text=No+Photo'">
            <h3 class="employee-position">${employee.position}</h3>
            <h4 class="employee-name">${employee.name}</h4>
            <p class="employee-description">${employee.description}</p>
        `;

        grid.appendChild(card);
    });
}

// Load employees when page loads
document.addEventListener('DOMContentLoaded', loadEmployees);