// ============================================================
// auth.js - Autenticación con backend centralizado
// ============================================================

const API_URL = 'http://localhost:3000/api';
const SESSION_KEY = 'zein_session';

// ===== SESIÓN LOCAL (solo guarda el nombre de usuario) =====
function getSession() {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { return null; }
  }
  return null;
}

function setSession(username) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username, loggedIn: true }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function isUserLoggedIn() {
  const s = getSession();
  return s && s.loggedIn;
}

function getCurrentUser() {
  const s = getSession();
  return s ? s.username : null;
}

// ===== USUARIOS (API) =====
async function registerUser(username, password, email) {
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
}

async function loginUser(username, password) {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      setSession(username);
    }
    return data;
  } catch (e) {
    return { success: false, error: 'Error de conexión con el servidor' };
  }
}

function logoutUser() {
  clearSession();
}

async function updateUserProfile(username, data) {
  try {
    const res = await fetch(`${API_URL}/user/${username}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: 'Error de conexión' };
  }
}

async function getUserData(username) {
  try {
    const res = await fetch(`${API_URL}/user/${username}`);
    return await res.json();
  } catch (e) {
    return { success: false, error: 'Error de conexión' };
  }
}

async function getUserPlugins(username) {
  try {
    const res = await fetch(`${API_URL}/user/${username}/plugins`);
    const data = await res.json();
    return data.plugins || [];
  } catch (e) {
    return [];
  }
}

async function addPluginToUser(username, pluginId) {
  try {
    const res = await fetch(`${API_URL}/user/${username}/plugins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pluginId })
    });
    return (await res.json()).success || false;
  } catch (e) {
    return false;
  }
}

async function userHasPlugin(username, pluginId) {
  const plugins = await getUserPlugins(username);
  return plugins.includes(pluginId);
}

// ===== LICENCIAS =====
async function setUserLicense(username, pluginId, license) {
  try {
    const res = await fetch(`${API_URL}/user/${username}/license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pluginId, license })
    });
    return (await res.json()).success || false;
  } catch (e) {
    return false;
  }
}

async function getUserLicense(username, pluginId) {
  try {
    const res = await fetch(`${API_URL}/user/${username}/license/${pluginId}`);
    const data = await res.json();
    return data.license || null;
  } catch (e) {
    return null;
  }
}

// ===== ROLES =====
async function setUserRole(username, role) {
  try {
    const res = await fetch(`${API_URL}/user/${username}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: 'Error de conexión' };
  }
}

async function getUserRole(username) {
  const data = await getUserData(username);
  return data.success ? data.user.role : 'user';
}

async function isAdmin(username) {
  const role = await getUserRole(username);
  return role === 'owner' || role === 'admin';
}

async function isOwner(username) {
  const role = await getUserRole(username);
  return role === 'owner';
}

// ===== LISTA DE USUARIOS (admin) =====
async function getUsersList() {
  try {
    const res = await fetch(`${API_URL}/users`);
    return await res.json();
  } catch (e) {
    return [];
  }
}

async function deleteUser(username) {
  if (username === 'Fxrz') {
    return { success: false, error: 'No se puede eliminar al Owner' };
  }
  try {
    const res = await fetch(`${API_URL}/user/${username}`, { method: 'DELETE' });
    return await res.json();
  } catch (e) {
    return { success: false, error: 'Error de conexión' };
  }
}

async function deleteUserAccount(username, password) {
  // Primero verificamos que la contraseña sea correcta
  const loginResult = await loginUser(username, password);
  if (!loginResult.success) {
    return { success: false, error: 'Contraseña incorrecta' };
  }
  // Luego eliminamos
  return await deleteUser(username);
}