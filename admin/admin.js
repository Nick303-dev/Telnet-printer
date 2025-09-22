// Admin Panel JavaScript

// Global variables
let currentUser = null;
let users = [];

// Initialize admin panel
document.addEventListener('DOMContentLoaded', async function() {
    await checkAuthentication();
    await loadUsers();
    setupEventListeners();
});

// Check if user is authenticated and is admin
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
        
        if (currentUser.role !== 'admin') {
            alert('Accesso negato. Solo gli amministratori possono accedere a questa pagina.');
            window.location.href = '/printer/public/index.html';
            return;
        }
        
        document.getElementById('adminInfo').textContent = `👑 ${currentUser.email}`;
        
    } catch (error) {
        console.error('Authentication failed:', error);
        alert('Sessione scaduta. Reindirizzamento al login...');
        localStorage.clear();
        window.location.href = '/login.html';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Back to printer button
    document.getElementById('backToPrinter').addEventListener('click', () => {
        window.location.href = '/printer/public/index.html';
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Create user form
    document.getElementById('createUserForm').addEventListener('submit', handleCreateUser);
}

// Load all users
async function loadUsers() {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load users');
        }
        
        const data = await response.json();
        users = data.users;
        
        updateStatistics();
        renderUsersTable();
        
    } catch (error) {
        console.error('Error loading users:', error);
        showAlert('Errore nel caricamento degli utenti: ' + error.message, 'error');
    }
}

// Update statistics
function updateStatistics() {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('activeUsers').textContent = activeUsers;
    document.getElementById('adminUsers').textContent = adminUsers;
}

// Render users table
function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Nessun utente trovato</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.email}</td>
            <td class="role-${user.role}">
                ${user.role === 'admin' ? '👑' : '👤'} ${user.role.toUpperCase()}
            </td>
            <td class="status-${user.status}">
                ${user.status === 'active' ? '✅' : '❌'} ${user.status.toUpperCase()}
            </td>
            <td>${formatDate(user.created_at)}</td>
            <td>${formatDate(user.updated_at)}</td>
            <td class="actions">
                ${user.id !== currentUser.id ? generateUserActions(user) : '<span style="color: #999;">Tu stesso</span>'}
            </td>
        </tr>
    `).join('');
}

// Generate user actions buttons
function generateUserActions(user) {
    const actions = [];
    
    // Toggle status
    if (user.status === 'active') {
        actions.push(`<button class="btn-warning btn-small" onclick="toggleUserStatus(${user.id}, 'inactive')">🚫 Disattiva</button>`);
    } else {
        actions.push(`<button class="btn-success btn-small" onclick="toggleUserStatus(${user.id}, 'active')">✅ Attiva</button>`);
    }
    
    // Toggle role
    if (user.role === 'user') {
        actions.push(`<button class="btn-secondary btn-small" onclick="toggleUserRole(${user.id}, 'admin')">👑 Rendi Admin</button>`);
    } else {
        actions.push(`<button class="btn-secondary btn-small" onclick="toggleUserRole(${user.id}, 'user')">👤 Rendi User</button>`);
    }
    
    // Reset password
    actions.push(`<button class="btn-warning btn-small" onclick="resetUserPassword(${user.id})">🔄 Reset Password</button>`);
    
    return actions.join(' ');
}

// Handle create user form
async function handleCreateUser(event) {
    event.preventDefault();
    
    const email = document.getElementById('newUserEmail').value;
    const role = document.getElementById('newUserRole').value;
    
    if (!email || !email.includes('@')) {
        showAlert('Inserisci un indirizzo email valido', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email, role })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.result || 'Errore nella creazione utente');
        }
        
        // Show generated password
        showPasswordModal(data.user.email, data.user.tempPassword);
        
        // Reset form
        document.getElementById('createUserForm').reset();
        
        // Reload users
        await loadUsers();
        
        showAlert(`Utente ${email} creato con successo!`, 'success');
        
    } catch (error) {
        console.error('Error creating user:', error);
        showAlert('Errore nella creazione utente: ' + error.message, 'error');
    }
}

// Toggle user status
async function toggleUserStatus(userId, newStatus) {
    if (!confirm(`Sei sicuro di voler ${newStatus === 'active' ? 'attivare' : 'disattivare'} questo utente?`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.result || 'Errore nell\\'aggiornamento utente');
        }
        
        await loadUsers();
        showAlert(`Utente ${newStatus === 'active' ? 'attivato' : 'disattivato'} con successo!`, 'success');
        
    } catch (error) {
        console.error('Error updating user status:', error);
        showAlert('Errore nell\\'aggiornamento: ' + error.message, 'error');
    }
}

// Toggle user role
async function toggleUserRole(userId, newRole) {
    if (!confirm(`Sei sicuro di voler cambiare il ruolo a ${newRole === 'admin' ? 'amministratore' : 'utente normale'}?`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.result || 'Errore nell\\'aggiornamento ruolo');
        }
        
        await loadUsers();
        showAlert(`Ruolo utente cambiato a ${newRole} con successo!`, 'success');
        
    } catch (error) {
        console.error('Error updating user role:', error);
        showAlert('Errore nell\\'aggiornamento ruolo: ' + error.message, 'error');
    }
}

// Reset user password
async function resetUserPassword(userId) {
    if (!confirm('Sei sicuro di voler resettare la password di questo utente? Verrà generata una nuova password temporanea.')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.result || 'Errore nel reset password');
        }
        
        const user = users.find(u => u.id === userId);
        showPasswordModal(user.email, data.newPassword);
        
        showAlert('Password resettata con successo!', 'success');
        
    } catch (error) {
        console.error('Error resetting password:', error);
        showAlert('Errore nel reset password: ' + error.message, 'error');
    }
}

// Show password modal
function showPasswordModal(email, password) {
    document.getElementById('passwordUserEmail').textContent = email;
    document.getElementById('generatedPassword').value = password;
    document.getElementById('passwordModal').style.display = 'block';
}

// Close password modal
function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
}

// Copy password to clipboard
async function copyPassword() {
    const passwordField = document.getElementById('generatedPassword');
    
    try {
        await navigator.clipboard.writeText(passwordField.value);
        showAlert('Password copiata negli appunti!', 'success');
    } catch (error) {
        // Fallback for older browsers
        passwordField.select();
        document.execCommand('copy');
        showAlert('Password copiata negli appunti!', 'success');
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
    const main = document.querySelector('.admin-main');
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
    return date.toLocaleDateString('it-IT') + ' ' + date.toLocaleTimeString('it-IT', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('passwordModal');
    if (event.target === modal) {
        closePasswordModal();
    }
});