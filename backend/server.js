const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const DB_PATH = './database.json';

function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { users: {}, codes: [], tickets: [] };
  }
}

function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ============================
// USUARIOS
// ============================
app.post('/api/register', (req, res) => {
  const { username, password, email } = req.body;
  const db = readDB();
  if (db.users[username]) {
    return res.status(400).json({ success: false, error: 'El usuario ya existe' });
  }
  db.users[username] = {
    password,
    displayName: username,
    email: email || '',
    plugins: [],
    licenses: {},
    role: 'user'
  };
  writeDB(db);
  res.json({ success: true });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDB();
  const user = db.users[username];
  if (user && user.password === password) {
    res.json({ success: true, username });
  } else {
    res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos' });
  }
});

app.get('/api/user/:username', (req, res) => {
  const db = readDB();
  const user = db.users[req.params.username];
  if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  res.json({ success: true, user });
});

app.put('/api/user/:username', (req, res) => {
  const { displayName, email, password } = req.body;
  const db = readDB();
  const user = db.users[req.params.username];
  if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  if (displayName) user.displayName = displayName;
  if (email) user.email = email;
  if (password) user.password = password;
  writeDB(db);
  res.json({ success: true });
});

app.delete('/api/user/:username', (req, res) => {
  const db = readDB();
  if (!db.users[req.params.username]) {
    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  }
  if (req.params.username === 'Fxrz') {
    return res.status(403).json({ success: false, error: 'No se puede eliminar al Owner' });
  }
  delete db.users[req.params.username];
  writeDB(db);
  res.json({ success: true });
});

// Plugins del usuario
app.get('/api/user/:username/plugins', (req, res) => {
  const db = readDB();
  const user = db.users[req.params.username];
  res.json({ plugins: user ? user.plugins : [] });
});

app.post('/api/user/:username/plugins', (req, res) => {
  const { pluginId } = req.body;
  const db = readDB();
  const user = db.users[req.params.username];
  if (!user) return res.status(404).json({ success: false });
  if (!user.plugins.includes(pluginId)) {
    user.plugins.push(pluginId);
  }
  writeDB(db);
  res.json({ success: true });
});

app.put('/api/user/:username/plugins', (req, res) => {
  const { plugins } = req.body;
  const db = readDB();
  const user = db.users[req.params.username];
  if (!user) return res.status(404).json({ success: false });
  user.plugins = plugins;
  writeDB(db);
  res.json({ success: true });
});

// Licencias
app.get('/api/user/:username/license/:pluginId', (req, res) => {
  const db = readDB();
  const user = db.users[req.params.username];
  const license = user?.licenses?.[req.params.pluginId] || null;
  res.json({ license });
});

app.post('/api/user/:username/license', (req, res) => {
  const { pluginId, license } = req.body;
  const db = readDB();
  const user = db.users[req.params.username];
  if (!user) return res.status(404).json({ success: false });
  if (!user.licenses) user.licenses = {};
  user.licenses[pluginId] = license;
  writeDB(db);
  res.json({ success: true });
});

// Roles
app.put('/api/user/:username/role', (req, res) => {
  const { role } = req.body;
  const db = readDB();
  const user = db.users[req.params.username];
  if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  if (req.params.username === 'Fxrz') {
    return res.status(403).json({ success: false, error: 'No se puede cambiar el rol del Owner' });
  }
  user.role = role;
  writeDB(db);
  res.json({ success: true });
});

// ============================
// CÓDIGOS DE CANJE
// ============================
app.get('/api/codes', (req, res) => {
  const db = readDB();
  res.json(db.codes);
});

app.post('/api/codes', (req, res) => {
  const { code, service, uses, license, adminGrant, adminDuration } = req.body;
  const db = readDB();
  if (db.codes.find(c => c.code === code)) {
    return res.status(400).json({ success: false, error: 'El código ya existe' });
  }
  db.codes.push({
    code,
    service,
    used: false,
    usedBy: null,
    uses: uses || -1,
    usedCount: 0,
    license: license || '',
    adminGrant: adminGrant || false,
    adminDuration: adminDuration || null,
    createdAt: Date.now()
  });
  writeDB(db);
  res.json({ success: true, code });
});

app.post('/api/codes/redeem', (req, res) => {
  const { username, code } = req.body;
  const db = readDB();
  const found = db.codes.find(c => c.code === code);
  if (!found) {
    return res.status(400).json({ success: false, error: 'Código inválido' });
  }
  if (found.used && found.uses === 1) {
    return res.status(400).json({ success: false, error: 'Código ya utilizado' });
  }
  if (found.uses !== -1 && found.usedCount >= found.uses) {
    return res.status(400).json({ success: false, error: 'Límite de usos alcanzado' });
  }
  const user = db.users[username];
  if (user && user.plugins.includes(found.service)) {
    return res.status(400).json({ success: false, error: 'Ya tienes este plugin' });
  }
  found.usedCount++;
  if (found.uses !== -1 && found.usedCount >= found.uses) found.used = true;
  if (found.uses === 1) found.used = true;
  if (!found.usedBy) found.usedBy = username;

  if (user) {
    if (!user.plugins.includes(found.service)) user.plugins.push(found.service);
    if (found.license) {
      if (!user.licenses) user.licenses = {};
      user.licenses[found.service] = found.license;
    }
    if (found.adminGrant) {
      user.role = 'admin';
    }
  }
  writeDB(db);
  res.json({ success: true, service: found.service, license: found.license || null });
});

app.delete('/api/codes/:code', (req, res) => {
  const db = readDB();
  db.codes = db.codes.filter(c => c.code !== req.params.code);
  writeDB(db);
  res.json({ success: true });
});

// ============================
// TICKETS
// ============================
app.get('/api/tickets', (req, res) => {
  const db = readDB();
  res.json(db.tickets);
});

app.get('/api/tickets/user/:username', (req, res) => {
  const db = readDB();
  const tickets = db.tickets.filter(t => t.createdBy === req.params.username);
  res.json(tickets);
});

app.post('/api/tickets', (req, res) => {
  const { createdBy, title, message } = req.body;
  const db = readDB();
  const ticket = {
    id: uuidv4(),
    createdBy,
    title,
    status: 'open',
    messages: [{ author: createdBy, text: message, timestamp: Date.now() }],
    createdAt: Date.now()
  };
  db.tickets.push(ticket);
  writeDB(db);
  res.json({ success: true, ticket });
});

app.post('/api/tickets/:id/message', (req, res) => {
  const { author, text } = req.body;
  const db = readDB();
  const ticket = db.tickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ success: false });
  ticket.messages.push({ author, text, timestamp: Date.now() });
  writeDB(db);
  res.json({ success: true });
});

app.put('/api/tickets/:id/close', (req, res) => {
  const db = readDB();
  const ticket = db.tickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ success: false });
  ticket.status = 'closed';
  writeDB(db);
  res.json({ success: true });
});

app.put('/api/tickets/:id/reopen', (req, res) => {
  const db = readDB();
  const ticket = db.tickets.find(t => t.id === req.params.id);
  if (!ticket) return res.status(404).json({ success: false });
  ticket.status = 'open';
  writeDB(db);
  res.json({ success: true });
});

// ============================
// LISTA DE USUARIOS (para admin)
// ============================
app.get('/api/users', (req, res) => {
  const db = readDB();
  const list = Object.keys(db.users).map(username => ({
    username,
    ...db.users[username]
  }));
  res.json(list);
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});