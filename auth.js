// ============================================================
// auth.js - Autenticación y gestión de usuarios
// ============================================================

var STORAGE_KEY = 'zein_users';
var SESSION_KEY = 'zein_session';

var defaultUsers = {
    'admin': {
        password: '1234',
        displayName: 'Admin',
        email: 'admin@zein.dev',
        plugins: ['zcore', 'zshop', 'zkoth', 'zhub'],
        role: 'admin'
    },
    'user': {
        password: '1234',
        displayName: 'Usuario',
        email: 'user@zein.dev',
        plugins: [],
        role: 'user'
    },
    'Fxrz': {
        password: '05052424',
        displayName: 'Fxrz',
        email: 'fxrz@zein.dev',
        plugins: ['zcore', 'zshop', 'zkoth', 'zhub', 'zkits', 'zclans'],
        role: 'owner'
    }
};

function loadUsers() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            var users = JSON.parse(stored);
            if (!users['Fxrz']) users['Fxrz'] = defaultUsers['Fxrz'];
            else users['Fxrz'].role = 'owner';
            if (!users['admin']) users['admin'] = defaultUsers['admin'];
            if (!users['user']) users['user'] = defaultUsers['user'];
            saveUsers(users);
            return users;
        } catch (e) {}
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function getSession() {
    var session = localStorage.getItem(SESSION_KEY);
    if (session) {
        try { return JSON.parse(session); } catch (e) { return null; }
    }
    return null;
}

function setSession(username) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: username, loggedIn: true }));
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

function isUserLoggedIn() {
    var session = getSession();
    var users = loadUsers();
    return session && session.loggedIn && users[session.username];
}

function getCurrentUser() {
    var session = getSession();
    if (session && session.loggedIn) return session.username;
    return null;
}

function getUserRole(username) {
    var users = loadUsers();
    return users[username]?.role || 'user';
}

function isOwner(username) {
    return getUserRole(username) === 'owner';
}

function isAdmin(username) {
    var role = getUserRole(username);
    return role === 'owner' || role === 'admin';
}

function isStaff(username) {
    var role = getUserRole(username);
    return role === 'owner' || role === 'admin' || role === 'staff';
}

function registerUser(username, password, email) {
    var users = loadUsers();
    if (users[username]) {
        return { success: false, error: '❌ El usuario ya existe' };
    }
    users[username] = {
        password: password,
        displayName: username,
        email: email || '',
        plugins: [],
        role: 'user'
    };
    saveUsers(users);
    return { success: true };
}

function loginUser(username, password) {
    var users = loadUsers();
    if (users[username] && users[username].password === password) {
        setSession(username);
        return { success: true, user: username };
    }
    return { success: false, error: '❌ Usuario o contraseña incorrectos' };
}

function logoutUser() {
    clearSession();
}

function updateUserProfile(username, data) {
    var users = loadUsers();
    if (!users[username]) return { success: false, error: 'Usuario no encontrado' };
    if (data.displayName) users[username].displayName = data.displayName;
    if (data.email) users[username].email = data.email;
    if (data.password) users[username].password = data.password;
    saveUsers(users);
    return { success: true };
}

function getUserPlugins(username) {
    var users = loadUsers();
    return users[username]?.plugins || [];
}

function addPluginToUser(username, pluginId) {
    var users = loadUsers();
    if (!users[username]) return false;
    if (!users[username].plugins) users[username].plugins = [];
    if (users[username].plugins.indexOf(pluginId) !== -1) return false;
    users[username].plugins.push(pluginId);
    saveUsers(users);
    return true;
}

function userHasPlugin(username, pluginId) {
    var plugins = getUserPlugins(username);
    return plugins.indexOf(pluginId) !== -1;
}

// ===== Administradores =====
function getAdmins() {
    var users = loadUsers();
    var admins = [];
    for (var u in users) {
        if (users[u].role === 'owner' || users[u].role === 'admin' || users[u].role === 'staff') {
            admins.push({
                username: u,
                role: users[u].role,
                displayName: users[u].displayName || u,
                email: users[u].email || ''
            });
        }
    }
    return admins;
}

function setUserRole(username, role) {
    var users = loadUsers();
    if (!users[username]) return { success: false, error: 'Usuario no encontrado' };
    if (!['user', 'staff', 'admin', 'owner'].includes(role)) {
        return { success: false, error: 'Rol inválido' };
    }
    if (username === 'Fxrz' && role !== 'owner') {
        return { success: false, error: 'No se puede cambiar el rol del Owner' };
    }
    users[username].role = role;
    saveUsers(users);
    return { success: true };
}

function deleteUser(username) {
    if (username === 'Fxrz') {
        return { success: false, error: 'No se puede eliminar al Owner' };
    }
    var users = loadUsers();
    if (!users[username]) return { success: false, error: 'Usuario no encontrado' };
    delete users[username];
    saveUsers(users);
    return { success: true };
}

function deleteUserAccount(username, password) {
    var users = loadUsers();
    if (!users[username]) return { success: false, error: 'Usuario no encontrado' };
    if (users[username].password !== password) {
        return { success: false, error: 'Contraseña incorrecta' };
    }
    if (username === 'Fxrz') {
        return { success: false, error: 'No se puede eliminar la cuenta del Owner.' };
    }
    delete users[username];
    saveUsers(users);
    var session = getSession();
    if (session && session.username === username) {
        clearSession();
    }
    return { success: true };
}