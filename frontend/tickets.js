// ============================================================
// tickets.js - Sistema de tickets con backend
// ============================================================

const API_URL = 'http://localhost:3000/api';

async function createTicket(username, title, message) {
  try {
    const res = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ createdBy: username, title, message })
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: 'Error de conexión' };
  }
}

async function getTickets() {
  try {
    const res = await fetch(`${API_URL}/tickets`);
    return await res.json();
  } catch (e) {
    return [];
  }
}

async function getTicketsByUser(username) {
  try {
    const res = await fetch(`${API_URL}/tickets/user/${username}`);
    return await res.json();
  } catch (e) {
    return [];
  }
}

async function getTicket(id) {
  const tickets = await getTickets();
  return tickets.find(t => t.id === id) || null;
}

async function addTicketMessage(id, author, text) {
  try {
    const res = await fetch(`${API_URL}/tickets/${id}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text })
    });
    return (await res.json()).success || false;
  } catch (e) {
    return false;
  }
}

async function closeTicket(id) {
  try {
    const res = await fetch(`${API_URL}/tickets/${id}/close`, { method: 'PUT' });
    return (await res.json()).success || false;
  } catch (e) {
    return false;
  }
}

async function reopenTicket(id) {
  try {
    const res = await fetch(`${API_URL}/tickets/${id}/reopen`, { method: 'PUT' });
    return (await res.json()).success || false;
  } catch (e) {
    return false;
  }
}