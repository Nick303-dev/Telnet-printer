// Profile Page JavaScript

// Global variables
let currentUser = null;

// Initialize profile page
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuthentication();
    await loadUserProfile();
    setupEventListeners();
});

// Check if user is authenticated
async function checkAuthentication() {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
        alert('Accesso negato. Effettua il login prima.');
        window.location.href = '/login.html';
        return;
    }
    
    try {
        const response = await fetch('/api/verify-token', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Token invalid');
        }
        
        const data = await response.json();
        currentUser = data.user;
        
    } catch (error) {
        console.error('Authentication failed:', error);
        alert('Sessione scaduta. Reindirizzamento al login...');
        localStorage.clear();
        window.location.href = '/login.html';
    }
}

// Load user profile data
async function loadUserProfile() {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load profile');
        }
        
        const data = await response.json();
        const user = data.user;
        
        // Update UI with user data
        updateUserInfo(user);
        
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Errore nel caricamento del profilo: ' + error.message, 'error');
    }
}

// Update user information in the UI
function updateUserInfo(user) {
    // Email
    document.getElementById('userEmail').textContent = user.email;
    
    // Role with styling
    const roleElement = document.getElementById('userRole');
    const roleIcon = user.role === 'admin' ? '👑' : '👤';
    roleElement.textContent = `${roleIcon} ${user.role.toUpperCase()}`;
    roleElement.className = `role-${user.role}`;
    
    // Status with styling
    const statusElement = document.getElementById('userStatus');
    const statusIcon = user.status === 'active' ? '✅' : '❌';
    statusElement.textContent = `${statusIcon} ${user.status.toUpperCase()}`;
    statusElement.className = `status-${user.status}`;
    
    // Dates
    document.getElementById('userCreated').textContent = formatDate(user.created_at);
    document.getElementById('userUpdated').textContent = formatDate(user.updated_at);
}

// Setup event listeners
function setupEventListeners() {
    // Back to printer button
    document.getElementById('backToPrinter').addEventListener('click', () => {
        window.location.href = '/printer/public/index.html';
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Change password form
    document.getElementById('changePasswordForm').addEventListener('submit', handleChangePassword);
    
    // Cancel button
    document.getElementById('cancelBtn').addEventListener('click', resetPasswordForm);
    
    // Toggle password visibility buttons
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', togglePasswordVisibility);
    });
    
    // Password confirmation validation
    document.getElementById('confirmPassword').addEventListener('input', validatePasswordConfirmation);
    document.getElementById('newPassword').addEventListener('input', validatePasswordConfirmation);
}

// Handle password change form submission
async function handleChangePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert('Tutti i campi sono obbligatori', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showAlert('La nuova password deve essere lunga almeno 6 caratteri', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showAlert('Le password non coincidono', 'error');
        return;
    }
    
    if (currentPassword === newPassword) {
        showAlert('La nuova password deve essere diversa da quella attuale', 'error');
        return;
    }
    
    // Disable form during submission
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '🔄 Cambio password...';
    
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/profile/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.result || 'Errore nel cambio password');
        }
        
        showAlert('Password cambiata con successo!', 'success');
        resetPasswordForm();
        
        // Optional: Show logout message
        setTimeout(() => {
            if (confirm('Password cambiata con successo! Vuoi effettuare il logout per sicurezza?')) {
                logout();
            }
        }, 2000);
        
    } catch (error) {
        console.error('Error changing password:', error);
        showAlert('Errore nel cambio password: ' + error.message, 'error');
    } finally {
        // Re-enable form
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Reset password form
function resetPasswordForm() {
    document.getElementById('changePasswordForm').reset();
    
    // Reset any error states
    document.querySelectorAll('.password-input input').forEach(input => {
        input.style.borderColor = '#ddd';
    });
}

// Toggle password visibility
function togglePasswordVisibility(event) {
    const target = event.currentTarget.getAttribute('data-target');
    const input = document.getElementById(target);
    const button = event.currentTarget;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

// Validate password confirmation
function validatePasswordConfirmation() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmInput = document.getElementById('confirmPassword');
    
    if (confirmPassword && newPassword !== confirmPassword) {
        confirmInput.style.borderColor = '#e74c3c';
    } else {
        confirmInput.style.borderColor = '#ddd';
    }
}

// Logout function
function logout() {
    if (confirm('Sei sicuro di voler effettuare il logout?')) {
        localStorage.clear();
        window.location.href = '/login.html';
    }
}

// Show alert messages
function showAlert(message, type = 'success') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Insert at the top of main content
    const main = document.querySelector('.profile-main');
    main.insertBefore(alert, main.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alert && alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Format date helper
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}