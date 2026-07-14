// ============================================================
// admin.js - Panel de administración (con backend)
// ============================================================

var adminContainer = document.getElementById('pageAdmin');

async function renderAdminPage() {
  if (!isUserLoggedIn()) {
    alert('Debes iniciar sesión.');
    navigateTo('plugins');
    return;
  }

  const isAdminUser = await isAdmin(currentUser);
  if (!isAdminUser && currentUser !== 'Fxrz') {
    alert('⛔ No tienes permisos de administrador.');
    navigateTo('plugins');
    return;
  }

  // Si es Fxrz pero el rol no es owner, lo corregimos en el backend (ya está fijo en DB)
  var html = `
    <div class="admin-container">
      <h2>🛡️ Panel de Administración</h2>
      <p class="sub">Gestiona códigos, usuarios y tickets</p>

      <!-- CREAR CÓDIGO -->
      <div class="admin-section">
        <h3><i class="fas fa-key"></i> Crear código canjeable</h3>
        <form class="admin-form" id="adminCreateCodeForm">
          <div class="form-group">
            <label>Tipo de código</label>
            <select id="adminCodeType">
              <option value="auto">Automático (25 caracteres)</option>
              <option value="manual">Manual (elige los caracteres)</option>
            </select>
          </div>
          <div class="form-group" id="adminManualCodeGroup" style="display:none;">
            <label>Código personalizado (5-25 caracteres, solo letras/números)</label>
            <input type="text" id="adminManualCode" placeholder="Ej: ABC123">
          </div>
          <div class="form-group">
            <label>¿Qué otorgará el código?</label>
            <div class="checkbox-group modern-checkboxes" id="adminPluginsCheckboxes">
  `;

  var paidPlugins = window.PLUGINS_DATA.filter(function(p) { return p.paid; });
  for (var i = 0; i < paidPlugins.length; i++) {
    html += `
      <label class="checkbox-card">
        <input type="checkbox" name="plugin" value="${paidPlugins[i].id}">
        <span class="checkmark"></span>
        ${paidPlugins[i].name}
      </label>
    `;
  }

  html += `
            </div>
            <div id="selectedPluginsCount" style="color:#8892b0; font-size:0.85rem; margin-top:0.3rem;">0 plugins seleccionados</div>
          </div>
          <div class="form-group">
            <label>Usos del código</label>
            <select id="adminUsesSelect">
              <option value="-1">Infinitos</option>
              <option value="1">1 uso</option>
              <option value="3">3 usos</option>
              <option value="5">5 usos</option>
              <option value="10">10 usos</option>
              <option value="25">25 usos</option>
              <option value="50">50 usos</option>
            </select>
          </div>
          <div class="form-group" id="licenseFieldGroup" style="display:none;">
            <label for="adminLicenseInput">Licencia (obligatoria para un solo plugin)</label>
            <input type="text" id="adminLicenseInput" placeholder="Ej: LIC-2024-ABCD-1234">
          </div>
          <div class="form-group" id="licenseOptionalGroup" style="display:block;">
            <label for="adminLicenseInputOptional">Licencia (opcional)</label>
            <input type="text" id="adminLicenseInputOptional" placeholder="Ej: LIC-2024-ABCD-1234">
          </div>
          <div class="form-group">
            <label>Permisos (Administrador)</label>
            <div class="checkbox-group modern-checkboxes">
              <label class="checkbox-card">
                <input type="checkbox" id="adminGrantAdmin">
                <span class="checkmark"></span>
                Conceder permisos de administrador
              </label>
            </div>
            <div id="adminPermissionDurationGroup" style="display:none; margin-top:0.5rem;">
              <label>Duración del permiso</label>
              <select id="adminPermissionDuration">
                <option value="lifetime">Lifetime (permanente)</option>
                <option value="1d">1 día</option>
                <option value="7d">1 semana</option>
                <option value="30d">1 mes</option>
                <option value="365d">1 año</option>
              </select>
            </div>
          </div>
          <div id="adminCreateMessage" class="admin-message"></div>
          <button type="submit" class="btn-primary btn-generate"><i class="fas fa-plus-circle"></i> Generar código</button>
        </form>
      </div>

      <!-- LISTA DE CÓDIGOS -->
      <div class="admin-section">
        <h3><i class="fas fa-list"></i> Códigos creados</h3>
        <div id="adminCodeList"></div>
      </div>

      <!-- GESTIÓN DE ADMINISTRADORES -->
      <div class="admin-section">
        <h3><i class="fas fa-users-cog"></i> Gestión de administradores</h3>
        <div id="adminUserList"></div>
      </div>

      <!-- GESTIÓN DE CUENTAS -->
      <div class="admin-section">
        <h3><i class="fas fa-user-edit"></i> Gestión de cuentas</h3>
        <div style="margin-bottom: 1rem;">
          <input type="text" id="adminSearchUser" placeholder="Buscar por usuario o email..." style="width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:60px; padding:0.7rem 1.2rem; color:#f0f2ff; outline:none;">
        </div>
        <div id="adminAccountList"></div>
        <div id="accountDetail" style="margin-top:1rem; display:none;"></div>
      </div>

      <!-- TICKETS -->
      <div class="admin-section">
        <h3><i class="fas fa-ticket-alt"></i> Tickets</h3>
        <div id="adminTicketList"></div>
      </div>
    </div>
  `;

  adminContainer.innerHTML = html;

  // Eventos
  document.getElementById('adminCodeType').addEventListener('change', function() {
    document.getElementById('adminManualCodeGroup').style.display = this.value === 'manual' ? 'block' : 'none';
  });

  document.getElementById('adminGrantAdmin').addEventListener('change', function() {
    document.getElementById('adminPermissionDurationGroup').style.display = this.checked ? 'block' : 'none';
  });

  var checkboxes = document.querySelectorAll('#adminPluginsCheckboxes input[type="checkbox"]');
  var countDisplay = document.getElementById('selectedPluginsCount');
  var licenseFieldGroup = document.getElementById('licenseFieldGroup');
  var licenseOptionalGroup = document.getElementById('licenseOptionalGroup');

  function updateLicenseFields() {
    var checked = document.querySelectorAll('#adminPluginsCheckboxes input[type="checkbox"]:checked');
    var count = checked.length;
    countDisplay.textContent = count + ' plugin' + (count !== 1 ? 's' : '') + ' seleccionado' + (count !== 1 ? 's' : '');
    if (count === 1) {
      licenseFieldGroup.style.display = 'block';
      licenseOptionalGroup.style.display = 'none';
    } else {
      licenseFieldGroup.style.display = 'none';
      licenseOptionalGroup.style.display = 'block';
    }
  }

  for (var c = 0; c < checkboxes.length; c++) {
    checkboxes[c].addEventListener('change', updateLicenseFields);
  }
  updateLicenseFields();

  document.getElementById('adminCreateCodeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    handleAdminCreateCode();
  });

  document.getElementById('adminSearchUser').addEventListener('input', function() {
    renderAccountList(this.value.trim());
  });

  await renderAdminCodeList();
  await renderAdminUserList();
  await renderAdminTicketList();
  await renderAccountList('');
}

// ===== CREAR CÓDIGO =====
async function handleAdminCreateCode() {
  var type = document.getElementById('adminCodeType').value;
  var manualCode = document.getElementById('adminManualCode').value.trim().toUpperCase();
  var pluginCheckboxes = document.querySelectorAll('#adminPluginsCheckboxes input[type="checkbox"]:checked');
  var grantAdmin = document.getElementById('adminGrantAdmin').checked;
  var duration = document.getElementById('adminPermissionDuration').value;
  var uses = document.getElementById('adminUsesSelect').value;
  var license = '';
  if (pluginCheckboxes.length === 1) {
    license = document.getElementById('adminLicenseInput').value.trim();
  } else {
    license = document.getElementById('adminLicenseInputOptional').value.trim();
  }
  var messageEl = document.getElementById('adminCreateMessage');

  if (pluginCheckboxes.length === 0) {
    messageEl.innerHTML = '<span style="color:#f87171;">❌ Selecciona al menos un plugin.</span>';
    return;
  }

  if (pluginCheckboxes.length === 1 && !license) {
    messageEl.innerHTML = '<span style="color:#f87171;">❌ La licencia es obligatoria cuando seleccionas un solo plugin.</span>';
    return;
  }

  var code;
  if (type === 'manual') {
    if (manualCode.length < 5 || manualCode.length > 25) {
      messageEl.innerHTML = '<span style="color:#f87171;">❌ El código debe tener entre 5 y 25 caracteres.</span>';
      return;
    }
    if (!/^[A-Z0-9]+$/.test(manualCode)) {
      messageEl.innerHTML = '<span style="color:#f87171;">❌ Solo letras mayúsculas y números (sin espacios).</span>';
      return;
    }
    code = manualCode;
  } else {
    code = generateCode();
  }

  // Verificar duplicado en backend (lo hará el servidor, pero podemos hacer una comprobación previa)
  var existing = await listRedeemCodes();
  if (existing.find(c => c.code === code)) {
    messageEl.innerHTML = '<span style="color:#f87171;">❌ El código ya existe.</span>';
    return;
  }

  var usesNum = parseInt(uses);
  if (isNaN(usesNum) || usesNum < -1) usesNum = -1;

  var allSuccess = true;
  var createdServices = [];
  for (var j = 0; j < pluginCheckboxes.length; j++) {
    var service = pluginCheckboxes[j].value;
    var result = await createRedeemCode(service, code, usesNum, license, grantAdmin, duration);
    if (result.success) {
      createdServices.push(service);
    } else {
      allSuccess = false;
    }
  }

  if (allSuccess && createdServices.length > 0) {
    messageEl.innerHTML = '<span style="color:#4ade80;">✅ Código creado: <strong>' + code + '</strong> para ' + createdServices.join(', ') +
      ' con ' + (usesNum === -1 ? '∞ usos' : usesNum + ' usos') +
      (license ? ' y licencia: <strong>' + license + '</strong>' : '') +
      '</span>';
    if (grantAdmin) {
      messageEl.innerHTML += '<br><span style="color:#a78bfa;">🔑 Permiso de administrador concedido (duración: ' + duration + ')</span>';
    }
    // Limpiar campos
    document.querySelectorAll('#adminPluginsCheckboxes input[type="checkbox"]:checked').forEach(function(cb) { cb.checked = false; });
    document.getElementById('adminManualCode').value = '';
    document.getElementById('adminGrantAdmin').checked = false;
    document.getElementById('adminPermissionDurationGroup').style.display = 'none';
    document.getElementById('adminLicenseInput').value = '';
    document.getElementById('adminLicenseInputOptional').value = '';
    var event = new Event('change');
    document.querySelectorAll('#adminPluginsCheckboxes input[type="checkbox"]').forEach(function(cb) { cb.dispatchEvent(event); });
    await renderAdminCodeList();
    await renderAdminUserList();
    await renderAccountList(document.getElementById('adminSearchUser').value.trim());
  } else {
    messageEl.innerHTML = '<span style="color:#f87171;">❌ Error al crear el código. Intenta de nuevo.</span>';
  }
}

// ===== LISTA DE CÓDIGOS =====
async function renderAdminCodeList() {
  var container = document.getElementById('adminCodeList');
  var codes = await listRedeemCodes();
  if (codes.length === 0) {
    container.innerHTML = '<p style="color:#8892b0;">No hay códigos creados.</p>';
    return;
  }

  var html = '<table class="admin-table"><thead><tr><th>Código</th><th>Servicio</th><th>Licencia</th><th>Usado</th><th>Usado por</th><th>Acciones</th></tr></thead><tbody>';
  for (var i = 0; i < codes.length; i++) {
    var c = codes[i];
    var usado = c.used ? '✅ Sí' : '❌ No';
    var usadoPor = c.usedBy || '-';
    html += `
      <tr>
        <td><code>${c.code}</code></td>
        <td>${c.service}</td>
        <td>${c.license || '-'}</td>
        <td>${usado}</td>
        <td>${usadoPor}</td>
        <td class="actions">
          ${!c.used ? `<button class="danger" onclick="deleteCode('${c.code}')"><i class="fas fa-trash"></i> Eliminar</button>` : ''}
        </td>
      </tr>
    `;
  }
  html += '</tbody></table>';
  container.innerHTML = html;
}

async function deleteCode(code) {
  if (confirm('¿Eliminar el código ' + code + '?')) {
    var result = await deleteRedeemCode(code);
    if (result.success) {
      await renderAdminCodeList();
      await renderAdminUserList();
    } else {
      alert(result.error);
    }
  }
}

// ===== GESTIÓN DE ADMINISTRADORES =====
async function renderAdminUserList() {
  var container = document.getElementById('adminUserList');
  var users = await getUsersList();
  var html = '<table class="admin-table"><thead><tr><th>Usuario</th><th>Rol</th><th>Email</th><th>Acciones</th></tr></thead><tbody>';
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    var role = u.role || 'user';
    var roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    var badgeClass = role === 'owner' ? 'owner' : (role === 'admin' ? 'admin' : (role === 'staff' ? 'staff' : 'user'));
    html += `
      <tr>
        <td>${u.username}</td>
        <td><span class="badge ${badgeClass}">${roleLabel}</span></td>
        <td>${u.email || '-'}</td>
        <td class="actions">
          ${u.username !== 'Fxrz' ? `
            <select onchange="changeUserRole('${u.username}', this.value)" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:60px;padding:0.2rem 0.6rem;color:#f0f2ff;font-size:0.8rem;">
              <option value="user" ${role === 'user' ? 'selected' : ''}>Usuario</option>
              <option value="staff" ${role === 'staff' ? 'selected' : ''}>Staff</option>
              <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
            <button onclick="deleteUserAccount('${u.username}')" style="background:none;border:none;color:#f87171;cursor:pointer;margin-left:0.5rem;"><i class="fas fa-user-slash"></i></button>
          ` : '<span style="color:#facc15;">👑 Owner</span>'}
        </td>
      </tr>
    `;
  }
  html += '</tbody></table>';
  container.innerHTML = html;
}

async function changeUserRole(username, role) {
  if (username === 'Fxrz') {
    alert('No puedes cambiar el rol del Owner.');
    return;
  }
  var result = await setUserRole(username, role);
  if (result.success) {
    await renderAdminUserList();
    await renderAccountList(document.getElementById('adminSearchUser').value.trim());
  } else {
    alert(result.error);
  }
}

async function deleteUserAccount(username) {
  if (username === 'Fxrz') {
    alert('No puedes eliminar al Owner.');
    return;
  }
  if (confirm('¿Eliminar al usuario ' + username + '?')) {
    var result = await deleteUser(username);
    if (result.success) {
      await renderAdminUserList();
      await renderAccountList(document.getElementById('adminSearchUser').value.trim());
    } else {
      alert(result.error);
    }
  }
}

// ===== GESTIÓN DE CUENTAS =====
async function renderAccountList(query) {
  var container = document.getElementById('adminAccountList');
  var users = await getUsersList();
  var filtered = users.filter(function(u) {
    var match = u.username.toLowerCase().includes(query.toLowerCase()) || (u.email && u.email.toLowerCase().includes(query.toLowerCase()));
    return match || query === '';
  });

  if (filtered.length === 0) {
    container.innerHTML = '<p style="color:#8892b0; text-align:center; padding:1rem;">No se encontraron usuarios.</p>';
    document.getElementById('accountDetail').style.display = 'none';
    return;
  }

  var html = '<table class="admin-table"><thead><tr><th>Usuario</th><th>Email</th><th>Plugins</th><th>Acciones</th></tr></thead><tbody>';
  for (var i = 0; i < filtered.length; i++) {
    var u = filtered[i];
    var pluginNames = (u.plugins || []).map(function(id) {
      var p = window.PLUGINS_DATA.find(function(pl) { return pl.id === id; });
      return p ? p.name : id;
    }).join(', ') || 'Ninguno';
    html += `
      <tr>
        <td><strong>${u.username}</strong></td>
        <td>${u.email || '-'}</td>
        <td>${pluginNames}</td>
        <td class="actions">
          <button onclick="openAccountDetail('${u.username}')" style="background:rgba(167,139,250,0.12);border:1px solid rgba(167,139,250,0.2);border-radius:60px;padding:0.2rem 0.8rem;color:#a78bfa;cursor:pointer;transition:0.2s;">
            <i class="fas fa-eye"></i> Ver/Gestionar
          </button>
        </td>
      </tr>
    `;
  }
  html += '</tbody></table>';
  container.innerHTML = html;
  document.getElementById('accountDetail').style.display = 'none';
}

async function openAccountDetail(username) {
  var detailDiv = document.getElementById('accountDetail');
  var data = await getUserData(username);
  if (!data.success) {
    detailDiv.innerHTML = '<p style="color:#f87171;">Usuario no encontrado.</p>';
    detailDiv.style.display = 'block';
    return;
  }
  var user = data.user;
  var plugins = user.plugins || [];
  var allPlugins = window.PLUGINS_DATA || [];

  var html = `
    <div style="background:rgba(255,255,255,0.03);border-radius:1.5rem;padding:1.5rem;border:1px solid rgba(255,255,255,0.06);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <h4 style="color:#f0f2ff;">Cuenta de: <strong>${username}</strong></h4>
        <button onclick="document.getElementById('accountDetail').style.display='none'" style="background:none;border:none;color:#8892b0;font-size:1.2rem;cursor:pointer;"><i class="fas fa-times"></i></button>
      </div>
      <p style="color:#8892b0; margin-bottom:1rem;">Email: ${user.email || 'No establecido'}</p>
      <div style="display:flex; flex-wrap:wrap; gap:0.8rem; margin-bottom:1.5rem;">
        ${allPlugins.filter(function(p) { return p.paid; }).map(function(p) {
          var has = plugins.indexOf(p.id) !== -1;
          return `
            <label style="display:flex; align-items:center; gap:0.4rem; background:rgba(255,255,255,0.04); padding:0.3rem 0.8rem; border-radius:60px; cursor:pointer; border:1px solid ${has ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.06)'};">
              <input type="checkbox" ${has ? 'checked' : ''} onchange="toggleUserPlugin('${username}', '${p.id}')" style="accent-color:#a78bfa;">
              <span style="color:${has ? '#4ade80' : '#b9c2dd'};">${p.name}</span>
            </label>
          `;
        }).join('')}
      </div>
      <button onclick="saveUserPlugins('${username}')" class="btn-primary" style="width:auto; padding:0.5rem 1.5rem; font-size:0.9rem;">
        <i class="fas fa-save"></i> Guardar cambios
      </button>
      <div id="accountDetailMessage" style="margin-top:0.8rem;"></div>
    </div>
  `;
  detailDiv.innerHTML = html;
  detailDiv.style.display = 'block';
  detailDiv.dataset.username = username;
  if (!window._pluginChanges) window._pluginChanges = {};
  window._pluginChanges[username] = plugins.slice();
}

function toggleUserPlugin(username, pluginId) {
  if (!window._pluginChanges) window._pluginChanges = {};
  if (!window._pluginChanges[username]) {
    // Ya debería estar inicializado en openAccountDetail
    window._pluginChanges[username] = window._pluginChanges[username] || [];
  }
  var idx = window._pluginChanges[username].indexOf(pluginId);
  if (idx === -1) {
    window._pluginChanges[username].push(pluginId);
  } else {
    window._pluginChanges[username].splice(idx, 1);
  }
}

async function saveUserPlugins(username) {
  var changes = window._pluginChanges[username];
  if (!changes) {
    document.getElementById('accountDetailMessage').innerHTML = '<span style="color:#8892b0;">No hay cambios.</span>';
    return;
  }
  // Obtener datos actuales del usuario
  var data = await getUserData(username);
  if (!data.success) {
    document.getElementById('accountDetailMessage').innerHTML = '<span style="color:#f87171;">Usuario no encontrado.</span>';
    return;
  }
  var user = data.user;
  user.plugins = changes.slice();
  // Actualizar vía API (usamos updateUserProfile, pero solo enviamos plugins? Mejor hacer una llamada específica)
  // Como no tenemos endpoint para actualizar plugins directamente, usamos el PUT de perfil pero no tiene plugins.
  // Alternativa: usar el endpoint POST /user/:username/plugins para cada uno (más complejo)
  // Simplificamos: en el backend no hay PUT para plugins, así que usamos la función addPluginToUser para cada uno? no, eso solo añade.
  // Lo mejor: modificar el backend para que acepte PUT con plugins, o crear un endpoint específico.
  // Para este ejemplo, haremos un fetch directo al PUT de usuario pero extendido.
  // O podemos usar la función de admin que ya tiene acceso a la DB.
  // Como es un ejemplo, voy a simular que el backend tiene un PUT completo de usuario con plugins.
  // Pero para no cambiar el backend, usamos una solución: eliminamos y readicionamos? No, es engorroso.
  // Agreguemos una ruta PUT /api/user/:username/plugins que reciba el array completo.
  // Vamos a implementar un endpoint extra en el backend y lo usamos aquí.
  // Pero como el backend ya está dado, agreguemos una ruta rápida en server.js:
  // app.put('/api/user/:username/plugins', (req, res) => { ... })
  // Como no quiero modificar el server que ya te di, te doy un nuevo server con esa ruta.
  // Pero en el código que te pasé, no está. Entonces lo añado aquí en el script de admin:
  // Usaremos un fetch a una ruta que crearemos ahora en el backend.
  // Pero para no complicar, haré que el backend original tenga esta ruta.
  // Te dejo la modificación aquí: en server.js añadir:
  /*
  app.put('/api/user/:username/plugins', (req, res) => {
    const { plugins } = req.body;
    const db = readDB();
    const user = db.users[req.params.username];
    if (!user) return res.status(404).json({ success: false });
    user.plugins = plugins;
    writeDB(db);
    res.json({ success: true });
  });
  */
  // Entonces aquí llamamos a esa ruta.
  try {
    const res = await fetch(`${API_URL}/user/${username}/plugins`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plugins: changes })
    });
    const result = await res.json();
    if (result.success) {
      document.getElementById('accountDetailMessage').innerHTML = '<span style="color:#4ade80;">✅ Cambios guardados correctamente.</span>';
      window._pluginChanges[username] = null;
      await renderAdminUserList();
      await renderAccountList(document.getElementById('adminSearchUser').value.trim());
      setTimeout(function() { openAccountDetail(username); }, 300);
    } else {
      document.getElementById('accountDetailMessage').innerHTML = '<span style="color:#f87171;">❌ Error al guardar.</span>';
    }
  } catch (e) {
    document.getElementById('accountDetailMessage').innerHTML = '<span style="color:#f87171;">❌ Error de conexión.</span>';
  }
}

// ===== TICKETS =====
async function renderAdminTicketList() {
  var container = document.getElementById('adminTicketList');
  var tickets = await getTickets();
  if (tickets.length === 0) {
    container.innerHTML = '<p style="color:#8892b0;">No hay tickets.</p>';
    return;
  }

  var html = '<div class="ticket-list">';
  for (var i = 0; i < tickets.length; i++) {
    var t = tickets[i];
    var statusClass = t.status === 'open' ? 'open' : 'closed';
    var statusLabel = t.status === 'open' ? 'Abierto' : 'Cerrado';
    html += `
      <div class="ticket-item" onclick="toggleTicketDetail('${t.id}')">
        <div class="ticket-info">
          <div class="ticket-title">${t.title}</div>
          <div class="ticket-meta">
            <span>Creado por: ${t.createdBy}</span>
            <span>${new Date(t.createdAt).toLocaleString()}</span>
            <span>${t.messages.length} mensajes</span>
          </div>
        </div>
        <span class="ticket-status ${statusClass}">${statusLabel}</span>
      </div>
      <div id="ticketDetail_${t.id}" style="display:none;" class="ticket-detail"></div>
    `;
  }
  html += '</div>';
  container.innerHTML = html;
}

async function toggleTicketDetail(ticketId) {
  var detailEl = document.getElementById('ticketDetail_' + ticketId);
  if (detailEl.style.display === 'block') {
    detailEl.style.display = 'none';
    return;
  }

  var ticket = await getTicket(ticketId);
  if (!ticket) return;

  var html = '<div class="ticket-messages">';
  for (var i = 0; i < ticket.messages.length; i++) {
    var msg = ticket.messages[i];
    html += `
      <div class="message">
        <span class="msg-author">${msg.author}</span>
        <span class="msg-time">${new Date(msg.timestamp).toLocaleString()}</span>
        <div class="msg-text">${msg.text}</div>
      </div>
    `;
  }
  html += '</div>';

  if (ticket.status === 'open') {
    html += `
      <div class="reply-form">
        <input type="text" id="ticketReplyInput_${ticketId}" placeholder="Escribe una respuesta...">
        <button onclick="sendTicketReply('${ticketId}')">Enviar</button>
        <button onclick="closeTicketById('${ticketId}')" style="background:#444;border:none;padding:0.6rem 1.5rem;border-radius:60px;color:#fff;cursor:pointer;">Cerrar ticket</button>
      </div>
    `;
  } else {
    html += `
      <div style="text-align:center;color:#8892b0;margin-top:1rem;">
        Ticket cerrado.
        <button onclick="reopenTicketById('${ticketId}')" style="background:none;border:1px solid #a78bfa;color:#a78bfa;padding:0.3rem 1rem;border-radius:60px;cursor:pointer;">Reabrir</button>
      </div>
    `;
  }

  detailEl.innerHTML = html;
  detailEl.style.display = 'block';
}

async function sendTicketReply(ticketId) {
  var input = document.getElementById('ticketReplyInput_' + ticketId);
  var text = input.value.trim();
  if (!text) return;
  var result = await addTicketMessage(ticketId, currentUser, text);
  if (result) {
    input.value = '';
    await toggleTicketDetail(ticketId);
  }
}

async function closeTicketById(ticketId) {
  if (confirm('¿Cerrar este ticket?')) {
    await closeTicket(ticketId);
    await toggleTicketDetail(ticketId);
    await renderAdminTicketList();
  }
}

async function reopenTicketById(ticketId) {
  await reopenTicket(ticketId);
  await toggleTicketDetail(ticketId);
  await renderAdminTicketList();
}

// Añadir función generateCode para usar en admin (ya existe en codes.js, pero por si acaso)
function generateCode() {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var parts = [];
  for (var p = 0; p < 5; p++) {
    var segment = '';
    for (var i = 0; i < 5; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(segment);
  }
  return parts.join('-');
}