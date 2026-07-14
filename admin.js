// ============================================================
// admin.js - Panel de administración (con licencias)
// ============================================================

var adminContainer = document.getElementById('pageAdmin');

function renderAdminPage() {
    if (!isUserLoggedIn()) {
        alert('Debes iniciar sesión.');
        navigateTo('plugins');
        return;
    }

    var isUserAdmin = isAdmin(currentUser);
    if (!isUserAdmin && currentUser !== 'Fxrz') {
        alert('⛔ No tienes permisos de administrador.');
        navigateTo('plugins');
        return;
    }

    if (currentUser === 'Fxrz' && !isUserAdmin) {
        var users = loadUsers();
        if (users['Fxrz']) {
            users['Fxrz'].role = 'owner';
            saveUsers(users);
        }
    }

    var html = `
        <div class="admin-container">
            <h2>🛡️ Panel de Administración</h2>
            <p class="sub">Gestiona códigos, usuarios y tickets</p>

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
                        <div class="checkbox-group" id="adminPluginsCheckboxes">
    `;

    var paidPlugins = window.PLUGINS_DATA.filter(function(p) { return p.paid; });
    for (var i = 0; i < paidPlugins.length; i++) {
        html += `
            <label>
                <input type="checkbox" name="plugin" value="${paidPlugins[i].id}">
                ${paidPlugins[i].name}
            </label>
        `;
    }

    html += `
                        </div>
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
                    <div class="form-group">
                        <label>Licencia (opcional)</label>
                        <input type="text" id="adminLicenseInput" placeholder="Ej: LIC-2024-ABCD-1234">
                    </div>
                    <div class="form-group">
                        <label>Permisos (Administrador)</label>
                        <div class="checkbox-group">
                            <label>
                                <input type="checkbox" id="adminGrantAdmin">
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
                    <button type="submit" class="btn-primary">Generar código</button>
                </form>
            </div>

            <div class="admin-section">
                <h3><i class="fas fa-list"></i> Códigos creados</h3>
                <div id="adminCodeList"></div>
            </div>

            <div class="admin-section">
                <h3><i class="fas fa-users-cog"></i> Gestión de administradores</h3>
                <div id="adminUserList"></div>
            </div>

            <div class="admin-section">
                <h3><i class="fas fa-ticket-alt"></i> Tickets</h3>
                <div id="adminTicketList"></div>
            </div>
        </div>
    `;

    adminContainer.innerHTML = html;

    document.getElementById('adminCodeType').addEventListener('change', function() {
        document.getElementById('adminManualCodeGroup').style.display = this.value === 'manual' ? 'block' : 'none';
    });

    document.getElementById('adminGrantAdmin').addEventListener('change', function() {
        document.getElementById('adminPermissionDurationGroup').style.display = this.checked ? 'block' : 'none';
    });

    document.getElementById('adminCreateCodeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        handleAdminCreateCode();
    });

    renderAdminCodeList();
    renderAdminUserList();
    renderAdminTicketList();
}

function handleAdminCreateCode() {
    var type = document.getElementById('adminCodeType').value;
    var manualCode = document.getElementById('adminManualCode').value.trim().toUpperCase();
    var pluginCheckboxes = document.querySelectorAll('#adminPluginsCheckboxes input[type="checkbox"]:checked');
    var grantAdmin = document.getElementById('adminGrantAdmin').checked;
    var duration = document.getElementById('adminPermissionDuration').value;
    var uses = document.getElementById('adminUsesSelect').value;
    var license = document.getElementById('adminLicenseInput').value.trim();
    var messageEl = document.getElementById('adminCreateMessage');

    if (pluginCheckboxes.length === 0) {
        messageEl.innerHTML = '<span style="color:#f87171;">❌ Selecciona al menos un plugin.</span>';
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
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var parts = [];
        for (var p = 0; p < 5; p++) {
            var segment = '';
            for (var i = 0; i < 5; i++) {
                segment += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            parts.push(segment);
        }
        code = parts.join('-');
    }

    var existingCodes = listRedeemCodes();
    for (var e = 0; e < existingCodes.length; e++) {
        if (existingCodes[e].code === code) {
            messageEl.innerHTML = '<span style="color:#f87171;">❌ El código ya existe.</span>';
            return;
        }
    }

    var usesNum = parseInt(uses);
    if (isNaN(usesNum) || usesNum < -1) usesNum = -1;

    var codesCreated = [];
    var allSuccess = true;
    for (var j = 0; j < pluginCheckboxes.length; j++) {
        var service = pluginCheckboxes[j].value;
        var plugin = window.PLUGINS_DATA.find(function(p) { return p.id === service; });
        if (!plugin || !plugin.paid) continue;

        var result = createRedeemCode(service, code, usesNum, license);
        if (result.success) {
            codesCreated.push(service);
        } else {
            allSuccess = false;
        }
    }

    if (allSuccess && codesCreated.length > 0) {
        messageEl.innerHTML = '<span style="color:#4ade80;">✅ Código creado: <strong>' + code + '</strong> para ' + codesCreated.join(', ') +
            ' con ' + (usesNum === -1 ? '∞ usos' : usesNum + ' usos') +
            (license ? ' y licencia: <strong>' + license + '</strong>' : '') +
            '</span>';
        if (grantAdmin) {
            var codes = loadCodes();
            for (var k = 0; k < codes.length; k++) {
                if (codes[k].code === code) {
                    codes[k].adminGrant = true;
                    codes[k].adminDuration = duration;
                    break;
                }
            }
            saveCodes(codes);
            messageEl.innerHTML += '<br><span style="color:#a78bfa;">🔑 Permiso de administrador concedido (duración: ' + duration + ')</span>';
        }
        document.querySelectorAll('#adminPluginsCheckboxes input[type="checkbox"]:checked').forEach(function(cb) { cb.checked = false; });
        document.getElementById('adminManualCode').value = '';
        document.getElementById('adminGrantAdmin').checked = false;
        document.getElementById('adminPermissionDurationGroup').style.display = 'none';
        document.getElementById('adminLicenseInput').value = '';
        renderAdminCodeList();
        renderAdminUserList();
    } else {
        messageEl.innerHTML = '<span style="color:#f87171;">❌ Error al crear el código. Intenta de nuevo.</span>';
    }
}

function renderAdminCodeList() {
    var container = document.getElementById('adminCodeList');
    var codes = listRedeemCodes();
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

function deleteCode(code) {
    if (confirm('¿Eliminar el código ' + code + '?')) {
        var result = deleteRedeemCode(code);
        if (result.success) {
            renderAdminCodeList();
        } else {
            alert(result.error);
        }
    }
}

function renderAdminUserList() {
    var container = document.getElementById('adminUserList');
    var users = loadUsers();
    var html = '<table class="admin-table"><thead><tr><th>Usuario</th><th>Rol</th><th>Email</th><th>Acciones</th></tr></thead><tbody>';
    for (var u in users) {
        var user = users[u];
        var role = user.role || 'user';
        var roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
        var badgeClass = role === 'owner' ? 'owner' : (role === 'admin' ? 'admin' : (role === 'staff' ? 'staff' : 'user'));
        html += `
            <tr>
                <td>${u}</td>
                <td><span class="badge ${badgeClass}">${roleLabel}</span></td>
                <td>${user.email || '-'}</td>
                <td class="actions">
                    ${u !== 'Fxrz' ? `
                        <select onchange="changeUserRole('${u}', this.value)" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:60px;padding:0.2rem 0.6rem;color:#f0f2ff;font-size:0.8rem;">
                            <option value="user" ${role === 'user' ? 'selected' : ''}>Usuario</option>
                            <option value="staff" ${role === 'staff' ? 'selected' : ''}>Staff</option>
                            <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                        <button onclick="deleteUserAccount('${u}')" style="background:none;border:none;color:#f87171;cursor:pointer;margin-left:0.5rem;"><i class="fas fa-user-slash"></i></button>
                    ` : '<span style="color:#facc15;">👑 Owner</span>'}
                </td>
            </tr>
        `;
    }
    html += '</tbody></table>';
    container.innerHTML = html;
}

function changeUserRole(username, role) {
    if (username === 'Fxrz') {
        alert('No puedes cambiar el rol del Owner.');
        return;
    }
    var result = setUserRole(username, role);
    if (result.success) {
        renderAdminUserList();
    } else {
        alert(result.error);
    }
}

function deleteUserAccount(username) {
    if (username === 'Fxrz') {
        alert('No puedes eliminar al Owner.');
        return;
    }
    if (confirm('¿Eliminar al usuario ' + username + '?')) {
        var result = deleteUser(username);
        if (result.success) {
            renderAdminUserList();
        } else {
            alert(result.error);
        }
    }
}

function renderAdminTicketList() {
    var container = document.getElementById('adminTicketList');
    var tickets = getTickets();
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

function toggleTicketDetail(ticketId) {
    var detailEl = document.getElementById('ticketDetail_' + ticketId);
    if (detailEl.style.display === 'block') {
        detailEl.style.display = 'none';
        return;
    }

    var ticket = getTicket(ticketId);
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

function sendTicketReply(ticketId) {
    var input = document.getElementById('ticketReplyInput_' + ticketId);
    var text = input.value.trim();
    if (!text) return;
    var result = addTicketMessage(ticketId, currentUser, text);
    if (result) {
        input.value = '';
        toggleTicketDetail(ticketId);
    }
}

function closeTicketById(ticketId) {
    if (confirm('¿Cerrar este ticket?')) {
        closeTicket(ticketId);
        toggleTicketDetail(ticketId);
        renderAdminTicketList();
    }
}

function reopenTicketById(ticketId) {
    reopenTicket(ticketId);
    toggleTicketDetail(ticketId);
    renderAdminTicketList();
}