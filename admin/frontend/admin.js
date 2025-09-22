        // Mock data initialization
        let users = [
            { id: 1, name: "Mario Rossi", email: "mario.rossi@example.com", role: "admin", status: "active" },
            { id: 2, name: "Anna Bianchi", email: "anna.bianchi@example.com", role: "user", status: "active" },
            { id: 3, name: "Luca Verdi", email: "luca.verdi@example.com", role: "user", status: "inactive" },
            { id: 4, name: "Giulia Neri", email: "giulia.neri@example.com", role: "moderator", status: "active" }
        ];

        // DOM Elements
        const usersTableBody = document.getElementById('usersTableBody');
        const emptyState = document.getElementById('emptyState');
        const searchInput = document.getElementById('searchInput');
        const userModal = document.getElementById('userModal');
        const modalTitle = document.getElementById('modalTitle');
        const userForm = document.getElementById('userForm');
        const userIdInput = document.getElementById('userId');
        const userNameInput = document.getElementById('userName');
        const userEmailInput = document.getElementById('userEmail');
        const userRoleInput = document.getElementById('userRole');
        const userStatusInput = document.getElementById('userStatus');
        const addUserBtn = document.getElementById('addUserBtn');
        const closeModalBtn = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');

        // Event Listeners
        addUserBtn.addEventListener('click', () => {
            resetForm();
            modalTitle.textContent = 'Aggiungi Nuovo Utente';
            userModal.classList.add('active');
        });

        closeModalBtn.addEventListener('click', () => {
            userModal.classList.remove('active');
        });

        cancelBtn.addEventListener('click', () => {
            userModal.classList.remove('active');
        });

        userForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = userIdInput.value ? parseInt(userIdInput.value) : Date.now();
            const name = userNameInput.value;
            const email = userEmailInput.value;
            const role = userRoleInput.value;
            const status = userStatusInput.value;

            if (userIdInput.value) {
                // Update existing user
                const index = users.findIndex(user => user.id === parseInt(userIdInput.value));
                if (index !== -1) {
                    users[index] = { id: parseInt(userIdInput.value), name, email, role, status };
                }
            } else {
                // Add new user
                users.push({ id, name, email, role, status });
            }

            renderUsers();
            userModal.classList.remove('active');
        });

        searchInput.addEventListener('input', () => {
            renderUsers();
        });

        // Functions
        function renderUsers() {
            const searchTerm = searchInput.value.toLowerCase();
            const filteredUsers = users.filter(user => 
                user.name.toLowerCase().includes(searchTerm) || 
                user.email.toLowerCase().includes(searchTerm)
            );

            if (filteredUsers.length === 0) {
                emptyState.style.display = 'block';
                usersTableBody.innerHTML = '';
            } else {
                emptyState.style.display = 'none';
                usersTableBody.innerHTML = filteredUsers.map(user => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td><span class="badge badge-${user.role}">${capitalizeFirstLetter(user.role)}</span></td>
                        <td><span class="badge badge-${user.status}">${user.status === 'active' ? 'Attivo' : 'Inattivo'}</span></td>
                        <td>
                            <button class="action-btn action-edit" data-id="${user.id}">Modifica</button>
                            <button class="action-btn action-delete" data-id="${user.id}">Elimina</button>
                        </td>
                    </tr>
                `).join('');

                // Add event listeners to action buttons
                document.querySelectorAll('.action-edit').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const id = parseInt(e.target.getAttribute('data-id'));
                        editUser(id);
                    });
                });

                document.querySelectorAll('.action-delete').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const id = parseInt(e.target.getAttribute('data-id'));
                        deleteUser(id);
                    });
                });
            }
        }

        function editUser(id) {
            const user = users.find(user => user.id === id);
            if (user) {
                userIdInput.value = user.id;
                userNameInput.value = user.name;
                userEmailInput.value = user.email;
                userRoleInput.value = user.role;
                userStatusInput.value = user.status;
                modalTitle.textContent = 'Modifica Utente';
                userModal.classList.add('active');
            }
        }

        function deleteUser(id) {
            if (confirm('Sei sicuro di voler eliminare questo utente?')) {
                users = users.filter(user => user.id !== id);
                renderUsers();
            }
        }

        function resetForm() {
            userIdInput.value = '';
            userNameInput.value = '';
            userEmailInput.value = '';
            userRoleInput.value = 'user';
            userStatusInput.value = 'active';
        }

        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        // Initialize
        renderUsers();