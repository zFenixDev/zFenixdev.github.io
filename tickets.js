// ============================================================
// tickets.js - Sistema de tickets (corregido)
// ============================================================

var TICKETS_KEY = 'zein_tickets';

function loadTickets() {
    var stored = localStorage.getItem(TICKETS_KEY);
    if (stored) {
        try { return JSON.parse(stored); } catch (e) {}
    }
    return [];
}

function saveTickets(tickets) {
    localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
}

function createTicket(username, title, message) {
    var tickets = loadTickets();
    var ticket = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        createdBy: username,
        title: title,
        status: 'open',
        messages: [
            { author: username, text: message, timestamp: Date.now() }
        ],
        createdAt: Date.now()
    };
    tickets.push(ticket);
    saveTickets(tickets);
    return ticket;
}

function getTickets() {
    return loadTickets();
}

function getTicketsByUser(username) {
    var tickets = loadTickets();
    return tickets.filter(function(t) { return t.createdBy === username; });
}

function getTicket(id) {
    var tickets = loadTickets();
    for (var i = 0; i < tickets.length; i++) {
        if (tickets[i].id === id) return tickets[i];
    }
    return null;
}

function addTicketMessage(id, author, text) {
    var tickets = loadTickets();
    for (var i = 0; i < tickets.length; i++) {
        if (tickets[i].id === id) {
            tickets[i].messages.push({ author: author, text: text, timestamp: Date.now() });
            saveTickets(tickets);
            return true;
        }
    }
    return false;
}

function closeTicket(id) {
    var tickets = loadTickets();
    for (var i = 0; i < tickets.length; i++) {
        if (tickets[i].id === id) {
            tickets[i].status = 'closed';
            saveTickets(tickets);
            return true;
        }
    }
    return false;
}

function reopenTicket(id) {
    var tickets = loadTickets();
    for (var i = 0; i < tickets.length; i++) {
        if (tickets[i].id === id) {
            tickets[i].status = 'open';
            saveTickets(tickets);
            return true;
        }
    }
    return false;
}