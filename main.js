// 1. Seleccionamos el contenedor principal
const appContainer = document.getElementById('app');

// ==========================================
// VISTA 1: FORMULARIO DE LOGIN (SIGN IN)
// ==========================================
function renderLogin() {
    appContainer.innerHTML = `
        <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md mx-auto mt-20">
            <h2 class="text-3xl font-bold text-center text-slate-800 mb-6">Sign In</h2>
            <form id="login-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input type="text" id="username" placeholder="Enter your username" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" id="password" placeholder="Enter your password" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
                </div>
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition duration-200">Login</button>
            </form>
        </div>
    `;

    // Asignamos el evento al formulario que acabamos de pintar
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const usernameInput = document.getElementById('username').value;
        const passwordInput = document.getElementById('password').value;

        try {
            const response = await axios.get(`http://localhost:3001/users?username=${usernameInput}&password=${passwordInput}`);
            
            if (response.data.length === 0) {
                alert("Invalid username or password.");
                return;
            }

            const loggedInUser = response.data[0];
            // Guardamos el usuario en el mini disco duro del navegador
            localStorage.setItem('currentUser', JSON.stringify(loggedInUser));

            // ¡AQUÍ ESTÁ LA MAGIA! Si el login es correcto, llamamos a la otra función
            renderDashboard();

        } catch (error) {
            console.error("Error connecting to server:", error);
            alert("Connection error.");
        }
    });
}

// ==========================================
// VISTA 2: PANEL PRINCIPAL (DASHBOARD)
// ==========================================
function renderDashboard() {
    // Recuperamos los datos del usuario que guardamos en el localStorage
    const user = JSON.parse(localStorage.getItem('currentUser'));

    // Si por alguna razón no hay usuario, lo devolvemos al Login (Protección de ruta básica)
    if (!user) {
        renderLogin();
        return;
    }

    // Dibujamos el Dashboard en inglés
    appContainer.innerHTML = `
        <div class="min-h-screen flex flex-col">
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
                    <h2 class="text-2xl font-bold text-slate-800 mb-4">Welcome to your workspace</h2>
                    <p class="text-gray-600 mb-6">Here you will manage the technical support cases according to your permissions.</p>
                    
                    <div id="tickets-container" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
                            <p class="text-gray-400 text-center italic">Loading support tickets...</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;

    // Escuchamos el botón de Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        // Borramos el usuario del localStorage
        localStorage.removeItem('currentUser');
        // Volvemos a pintar el Login inmediatamente
        renderLogin();
    });
}

// ==========================================
// INICIALIZACIÓN DE LA APP AT REFRESH
// ==========================================
// Cuando la página se carga por primera vez, verificamos si ya había una sesión guardada
const savedUser = localStorage.getItem('currentUser');
if (savedUser) {
    // Si ya estaba logueado, va directo al Dashboard
    renderDashboard();
} else {
    // Si no, ve al Login
    renderLogin();
}