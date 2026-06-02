// ==========================================
// VISTA 2: PANEL PRINCIPAL (DASHBOARD)
// ==========================================
function renderDashboard() {
    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (!user) {
        renderLogin();
        return;
    }

    appContainer.innerHTML = `
        <div class="min-h-screen flex flex-col bg-slate-100">
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

            <main class="p-6 flex-1">
                <div class="max-w-7xl mx-auto">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h2 class="text-2xl font-bold text-slate-800">Workspace</h2>
                            <p class="text-gray-600">Manage support cases according to your profile permissions.</p>
                        </div>
                        </div>
                    
                    <div id="tickets-container" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        </div>
                </div>
            </main>
        </div>
    `;

    // Escuchamos el botón de Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        renderLogin();
    });

    // ¡NUEVO! Ejecutamos la función para traer los tickets del puerto 3002
    fetchAndRenderTickets(user);
}

// ==========================================
// FUNCIÓN NUEVA: SOLICITAR Y PINTAR TICKETS
// ==========================================
async function fetchAndRenderTickets(user) {
    const ticketsContainer = document.getElementById('tickets-container');
    
    try {
        // 1. Hacemos la petición al puerto 3002 (tickets.json)
        const response = await axios.get('http://localhost:3002/tickets');
        const allTickets = response.data;

        // 2. Filtramos los tickets según las reglas de negocio (Roles)
        let filteredTickets = [];
        
        if (user.role === 'admin') {
            // El administrador ve absolutamente todo
            filteredTickets = allTickets;
        } else if (user.role === 'tecnico') {
            // El técnico solo ve los tickets donde su username coincida con el asignado
            filteredTickets = allTickets.filter(ticket => ticket.assignedTo === user.username);
        }

        // 3. Si no hay tickets para mostrar, ponemos un aviso limpio
        if (filteredTickets.length === 0) {
            ticketsContainer.innerHTML = `
                <div class="col-span-full bg-white p-8 rounded-lg border border-gray-200 text-center text-gray-500 italic">
                    No tickets found for your account.
                </div>
            `;
            return;
        }

        // 4. Limpiamos el contenedor y mapeamos las tarjetas con Tailwind CSS
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

// ==========================================
// FUNCIÓN NUEVA: MOSTRAR FORMULARIO DE CREACIÓN
// ==========================================
function renderCreateTicketForm() {
    // Reemplazamos el contenido del contenedor de tickets por el formulario
    const ticketsContainer = document.getElementById('tickets-container');
    
    ticketsContainer.innerHTML = `
        <div class="col-span-full bg-white p-6 rounded-lg shadow border border-gray-200 max-w-lg mx-auto">
            <h3 class="text-xl font-bold text-slate-800 mb-4">Create New Support Ticket</h3>
            
            <form id="create-ticket-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Ticket Title</label>
                    <input type="text" id="ticket-title" required class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: My computer won't turn on">
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
                    <textarea id="ticket-description" rows="4" required class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe the issue in detail..."></textarea>
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

    // Botón Cancelar: vuelve a cargar el Dashboard normal
    document.getElementById('cancel-ticket-btn').addEventListener('click', () => {
        renderDashboard();
    });

    // Escuchamos el envío del formulario
    document.getElementById('create-ticket-form').addEventListener('submit', async (e) => {
        e.preventDefault(); // Evitamos que la página se recargue

        // Capturamos los datos que escribió el usuario
        const title = document.getElementById('ticket-title').value;
        const type = document.getElementById('ticket-type').value;
        const description = document.getElementById('ticket-description').value;
        
        // Obtenemos quién está creando el ticket desde el localStorage
        const user = JSON.parse(localStorage.getItem('currentUser'));

        // Creamos el objeto del nuevo ticket
        const newTicket = {
            title: title,
            type: type,
            description: description,
            status: "open",
            assignedTo: "unassigned", // Por defecto inicia sin técnico asignado
            createdBy: user.username   // Guardamos quién lo reportó
        };

        try {
            // 🚀 Enviamos el ticket al puerto 3002 con el método POST
            await axios.post('http://localhost:3002/tickets', newTicket);
            
            alert("Ticket created successfully!");
            renderDashboard(); // Volvemos al panel para ver el nuevo ticket listado
            
        } catch (error) {
            console.error("Error creating ticket:", error);
            alert("Failed to create ticket. Is the server on port 3002 running?");
        }
    });
}