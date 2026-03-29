// Check if user is admin
function checkAdminStatus() {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    const adminToggle = document.getElementById('adminToggle');
    if (isAdmin && adminToggle) {
        adminToggle.style.display = 'block';
    }
}

// Load photos from server
function loadPhotos() {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    
    fetch('/api/photos')
        .then(response => response.json())
        .then(photos => {
            const photosGrid = document.getElementById('photosGrid');
            if (photos.length === 0) {
                photosGrid.innerHTML = '<div class="loading">No photos available</div>';
                return;
            }

            photosGrid.innerHTML = photos.map(photo => `
                <div class="photo-item">
                    <img src="photos/${photo}" alt="Gallery photo" loading="lazy">
                    ${isAdmin ? `<button class="photo-delete-btn" onclick="deletePhoto('${photo}')">Delete</button>` : ''}
                </div>
            `).join('');
        })
        .catch(error => {
            console.error('Error loading photos:', error);
            document.getElementById('photosGrid').innerHTML = '<div class="loading">Error loading photos</div>';
        });
}

// Upload photo
function uploadPhoto() {
    const photoInput = document.getElementById('photoInput');
    const file = photoInput.files[0];
    
    if (!file) {
        showMessage('Please select a photo', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    const uploadBtn = event.target;
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';

    fetch('/api/photos', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) throw new Error('Upload failed');
        return response.json();
    })
    .then(data => {
        showMessage('Photo uploaded successfully!', 'success');
        photoInput.value = '';
        setTimeout(() => loadPhotos(), 500);
    })
    .catch(error => {
        console.error('Error uploading photo:', error);
        showMessage('Error uploading photo. Please try again.', 'error');
    })
    .finally(() => {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload';
    });
}

// Delete photo
function deletePhoto(filename) {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
        return;
    }

    fetch(`/api/photos/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) throw new Error('Delete failed');
        showMessage('Photo deleted successfully!', 'success');
        loadPhotos();
    })
    .catch(error => {
        console.error('Error deleting photo:', error);
        showMessage('Error deleting photo. Please try again.', 'error');
    });
}

// Toggle upload section
function toggleUploadSection() {
    const uploadSection = document.getElementById('uploadSection');
    uploadSection.classList.toggle('show');
}

// Show upload message
function showMessage(message, type) {
    const messageDiv = document.getElementById('uploadMessage');
    messageDiv.textContent = message;
    messageDiv.className = `upload-message ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.className = 'upload-message';
        }, 3000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAdminStatus();
    loadPhotos();
});
