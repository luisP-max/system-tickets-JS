// CONFIGURACIÓN INICIAL Y VARIABLES GLOBALES

const appContainer = document.getElementById('app');

// VISTA 1: PANTALLA DE INICIO DE SESIÓN (LOGIN)

function renderLogin() {
    appContainer.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-slate-900 px-4">
            <div class="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl">
                <div class="text-center mb-8">
                    <h2 class="text-3xl font-extrabold text-slate-800 tracking-tight">Sign In</h2>
                    <p class="text-sm text-gray-500 mt-2">Ticket Management System</p>
                </div>
                
                <form id="login-form" class="space-y-6">
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                        <input type="text" id="username" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Enter your username">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                        <input type="password" id="password" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="••••••••">
                    </div>
                    
                    <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-md">
                        Login
                    </button>
                </form>
            </div>
        </div>
    `;

    // Escuchamos el envío del formulario
    
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById('username').value.trim();
        const passwordInput = document.getElementById('password').value.trim();

        try {
            // Petición al puerto 3001 (auth-db)
            const response = await axios.get('http://localhost:3001/auth-db');
            const users = response.data;

            // Buscamos si el usuario y la contraseña coinciden
            const validUser = users.find(u => u.username === usernameInput && u.password === passwordInput);

            if (validUser) {
                // Guardamos la sesión localmente
                localStorage.setItem('currentUser', JSON.stringify(validUser));
                // Redireccionamos al Dashboard
                renderDashboard();
            } else {
                alert("Invalid username or password. Please try again.");
            }
        } catch (error) {
            console.error("Error connecting to auth server:", error);
            alert("Connection error with port 3001. Is json-server running?");
        }
    });
}

// VISTA 2: PANEL PRINCIPAL (DASHBOARD)

function renderDashboard() {
    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (!user) {
        renderLogin();
        return;
    }

    appContainer.innerHTML = `
        <div class="min-h-screen flex flex-col bg-slate-100">
            <!-- Barra de navegación superior -->
            <nav class="bg-slate-800 text-white px-6 py-4 flex justify-between items-center shadow-md">
                <h1 class="text-xl font-bold tracking-wide">TicketMaster Dashboard</h1>
                <div class="flex items-center space-x-4">
                    <span class="text-sm bg-slate-700 px-3 py-1 rounded">
                        Logged in as: <strong class="text-blue-400">${user.username}</strong> (${user.role.toUpperCase()})
                    </span>
                    <button id="logout-btn" class="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm font-semibold transition">
                        Logout
                    </button>
                </div>
            </nav>

            <!-- Contenido principal -->
            <main class="p-6 flex-1">
                <div class="max-w-7xl mx-auto">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h2 class="text-2xl font-bold text-slate-800">Workspace</h2>
                            <p class="text-gray-600">Manage support cases according to your profile permissions.</p>
                        </div>
                        <button id="create-ticket-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold shadow transition">
                            + Create Ticket
                        </button>
                    </div>
                    
                    <!-- Contenedor de tarjetas -->
                    <div id="tickets-container" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Las tarjetas se inyectan dinámicamente -->
                    </div>
                </div>
            </main>
        </div>
    `;

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        renderLogin();
    });

    document.getElementById('create-ticket-btn').addEventListener('click', () => {
        renderCreateTicketForm();
    });

    // Cargamos los tickets reales

    fetchAndRenderTickets(user);
}

// FUNCIÓN: SOLICITAR Y PINTAR TICKETS (Puerto 3002)

async function fetchAndRenderTickets(user) {
    const ticketsContainer = document.getElementById('tickets-container');
    
    try {
        const response = await axios.get('http://localhost:3002/data-db');
        const allTickets = response.data;

        let filteredTickets = [];
        
        if (user.role === 'admin') {
            filteredTickets = allTickets;
        } else if (user.role === 'tecnico') {
            filteredTickets = allTickets.filter(ticket => ticket.assignedTo === user.username);
        }

        if (filteredTickets.length === 0) {
            ticketsContainer.innerHTML = `
                <div class="col-span-full bg-white p-8 rounded-lg border border-gray-200 text-center text-gray-500 italic">
                    No tickets found for your account.
                </div>
            `;
            return;
        }

        ticketsContainer.innerHTML = '';
        filteredTickets.forEach(ticket => {
            ticketsContainer.innerHTML += `
                <div class="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-start mb-3">
                            <span class="text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-800 uppercase">
                                ${ticket.type}
                            </span>
                            <span class="text-xs text-gray-400">ID: #${ticket.id}</span>
                        </div>
                        <h3 class="text-lg font-semibold text-slate-800 mb-2">${ticket.title}</h3>
                        <p class="text-sm text-gray-600 mb-4">${ticket.description}</p>
                    </div>
                    
                    <div class="border-t pt-3 flex justify-between items-center text-xs text-gray-500">
                        <span>Assigned to: <strong class="text-slate-700">${ticket.assignedTo || 'Unassigned'}</strong></span>
                        <span class="font-semibold px-2 py-0.5 rounded ${ticket.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                            ${ticket.status.toUpperCase()}
                        </span>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error("Error fetching tickets:", error);
        ticketsContainer.innerHTML = `
            <div class="col-span-full bg-red-50 p-6 rounded-lg border border-red-200 text-center text-red-600 font-medium">
                Failed to load tickets. Please verify server on port 3002.
            </div>
        `;
    }
}

// FUNCIÓN: MOSTRAR FORMULARIO DE CREACIÓN

function renderCreateTicketForm() {
    const ticketsContainer = document.getElementById('tickets-container');
    
    ticketsContainer.innerHTML = `
        <div class="col-span-full bg-white p-6 rounded-lg shadow border border-gray-200 max-w-lg mx-auto">
            <h3 class="text-xl font-bold text-slate-800 mb-4">Create New Support Ticket</h3>
            
            <form id="create-ticket-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Ticket Title</label>
                    <input type="text" id="ticket-title" required class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: No funciona el internet">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Category / Type</label>
                    <select id="ticket-type" class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="error">Error / Bug</option>
                        <option value="tarea">Task / Request</option>
                        <option value="soporte">Technical Support</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea id="ticket-description" rows="4" required class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe el problema detalladamente..."></textarea>
                </div>
                
                <div class="flex justify-end space-x-3 pt-2">
                    <button type="button" id="cancel-ticket-btn" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium transition">
                        Cancel
                    </button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition">
                        Save Ticket
                    </button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('cancel-ticket-btn').addEventListener('click', () => {
        renderDashboard();
    });

    document.getElementById('create-ticket-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('ticket-title').value;
        const type = document.getElementById('ticket-type').value;
        const description = document.getElementById('ticket-description').value;
        const user = JSON.parse(localStorage.getItem('currentUser'));

        const newTicket = {
            title: title,
            type: type,
            description: description,
            status: "open",
            assignedTo: "unassigned",
            createdBy: user.username
        };

        try {
            await axios.post('http://localhost:3002/data-db', newTicket);
            alert("Ticket created successfully!");
            renderDashboard();
        } catch (error) {
            console.error("Error creating ticket:", error);
            alert("Failed to create ticket.");
        }
    });
}

// INICIALIZACIÓN DE LA APLICACIÓN (ARRANQUE)

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        renderDashboard();
    } else {
        renderLogin();
    }
});