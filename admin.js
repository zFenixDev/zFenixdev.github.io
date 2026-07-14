// ============================================================
// admin.js - Panel de administración (con Gestión de cuentas)
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
            <p class="sub">Gestiona códigos, usuarios, licencias y tickets</p>

            <!-- Crear código -->
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

            <!-- Lista de códigos -->
            <div class="admin-section">
                <h3><i class="fas fa-list"></i> Códigos creados</h3>
                <div id="adminCodeList"></div>
            </div>

            <!-- Gestión de administradores -->
            <div class="admin-section">
                <h3><i class="fas fa-users-cog"></i> Gestión de administradores</h3>
                <div id="adminUserList"></div>
            </div>

            <!-- NUEVO: Gestión de cuentas -->
            <div class="admin-section">
                <h3><i class="fas fa-user-cog"></i> Gestión de cuentas</h3>
                <div class="account-search">
                    <input type="text" id="accountSearchInput" placeholder="Buscar por nombre o correo...">
                    <button id="accountSearchBtn" class="btn-secondary"><i class="fas fa-search"></i> Buscar</button>
                </div>
                <div id="accountSearchResults" style="margin-top: 1rem;"></div>
                <div id="accountDetail" style="margin-top: 1.5rem; display:none;">
                    <h4 style="color:#f0f2ff; margin-bottom:0.5rem;">Detalles del usuario</h4>
                    <div id="accountDetailContent"></div>
                </div>
            </div>

            <!-- Tickets -->
            <div class="admin-section">
                <h3><i class="fas fa-ticket-alt"></i> Tickets</h3>
                <div id="adminTicketList"></div>
            </div>
        </div>
    `;

    adminContainer.innerHTML = html;

    // ===== Eventos =====
    document.getElementById('adminCodeType').addEventListener('change', function() {
        document.getElementById('adminManualCodeGroup').style.display = this.value === 'manual' ? 'block' : 'none';
    });

    document.getElementById('adminGrantAdmin').addEventListener('change', function() {
        document.getElementById('adminPermissionDurationGroup').style.display = this.checked ? 'block' : 'none';
    });

    // Contar checkboxes
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

    // Eventos de búsqueda de cuentas
    document.getElementById('accountSearchBtn').addEventListener('click', function() {
        searchAccounts();
    });
    document.getElementById('accountSearchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchAccounts();
    });

    // Cargar listas
    renderAdminCodeList();
    renderAdminUserList();
    renderAdminTicketList();
    // Limpiar resultados de búsqueda inicial
    document.getElementById('accountSearchResults').innerHTML = '';
    document.getElementById('accountDetail').style.display = 'none';
}

// ===== Funciones de búsqueda de cuentas =====
function searchAccounts() {
    var query = document.getElementById('accountSearchInput').value.trim().toLowerCase();
    var resultsContainer = document.getElementById('accountSearchResults');
    var detailContainer = document.getElementById('accountDetail');
    var detailContent = document.getElementById('accountDetailContent');

    if (!query) {
        resultsContainer.innerHTML = '<p style="color:#8892b0;">Ingresa un nombre de usuario o correo para buscar.</p>';
        detailContainer.style.display = 'none';
        return;
    }

    var users = loadUsers();
    var foundUsers = [];
    for (var u in users) {
        var user = users[u];
        var displayName = (user.displayName || u).toLowerCase();
        var email = (user.email || '').toLowerCase();
        if (displayName.includes(query) || u.toLowerCase().includes(query) || email.includes(query)) {
            foundUsers.push({ username: u, data: user });
        }
    }

    if (foundUsers.length === 0) {
        resultsContainer.innerHTML = '<p style="color:#8892b0;">No se encontraron usuarios.</p>';
        detailContainer.style.display = 'none';
        return;
    }

    // Mostrar lista de usuarios encontrados
    var html = '<div style="display:flex; flex-wrap:wrap; gap:0.5rem;">';
    for (var i = 0; i < foundUsers.length; i++) {
        var fu = foundUsers[i];
        html += `
            <button class="user-chip" data-username="${fu.username}" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:60px;padding:0.4rem 1rem;color:#c8d0e6;cursor:pointer;transition:0.2s;">
                <i class="fas fa-user"></i> ${fu.username} (${fu.data.displayName || fu.username})
            </button>
        `;
    }
    html += '</div>';
    resultsContainer.innerHTML = html;

    // Asignar eventos a los chips
    var chips = resultsContainer.querySelectorAll('.user-chip');
    for (var j = 0; j < chips.length; j++) {
        chips[j].addEventListener('click', function() {
            var username = this.getAttribute('data-username');
            showAccountDetail(username);
        });
    }
}

function showAccountDetail(username) {
    var users = loadUsers();
    var user = users[username];
    if (!user) {
        alert('Usuario no encontrado.');
        return;
    }

    var detailContainer = document.getElementById('accountDetail');
    var detailContent = document.getElementById('accountDetailContent');
    detailContainer.style.display = 'block';

    var allPlugins = window.PLUGINS_DATA || [];
    var userPlugins = user.plugins || [];

    // Construir listado de plugins con checkboxes para añadir/eliminar
    var pluginsHtml = '';
    for (var i = 0; i < allPlugins.length; i++) {
        var p = allPlugins[i];
        var checked = userPlugins.indexOf(p.id) !== -1 ? 'checked' : '';
        // Si el plugin es gratuito o en desarrollo, no se puede gestionar (solo mostrar)
        var disabled = (p.status === 'free' || p.status === 'dev') ? 'disabled' : '';
        var labelStyle = (p.status === 'free' || p.status === 'dev') ? 'opacity:0.6;' : '';
        pluginsHtml += `
            <label class="checkbox-card" style="${labelStyle}">
                <input type="checkbox" name="userPlugin" value="${p.id}" ${checked} ${disabled}>
                <span class="checkmark"></span>
                ${p.name} (${p.status})
                ${disabled ? ' <span style="color:#8892b0;font-size:0.7rem;">(no editable)</span>' : ''}
            </label>
        `;
    }

    detailContent.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; background:rgba(255,255,255,0.02); padding:1rem; border-radius:1rem;">
            <div><strong>Usuario:</strong> ${username}</div>
            <div><strong>Nombre:</strong> ${user.displayName || username}</div>
            <div><strong>Email:</strong> ${user.email || 'No establecido'}</div>
            <div><strong>Rol:</strong> <span class="badge ${user.role === 'owner' ? 'owner' : (user.role === 'admin' ? 'admin' : (user.role === 'staff' ? 'staff' : 'user'))}">${user.role || 'user'}</span></div>
        </div>
        <div style="margin-top:1rem;">
            <h5 style="color:#c8d0e6; margin-bottom:0.5rem;">Plugins (marca/desmarca para gestionar)</h5>
            <div class="checkbox-group modern-checkboxes" id="userPluginsList">
                ${pluginsHtml}
            </div>
            <button id="saveUserPluginsBtn" class="btn-primary" style="margin-top:0.5rem; width:auto; padding:0.5rem 2rem;"><i class="fas fa-save"></i> Guardar cambios</button>
            <span id="userPluginsMessage" style="margin-left:1rem; color:#4ade80;"></span>
        </div>
        <div style="margin-top:1.5rem;">
            <button id="resetUserPasswordBtn" class="btn-secondary" style="border-color:rgba(167,139,250,0.3);"><i class="fas fa-key"></i> Resetear contraseña</button>
            <span id="resetPasswordMessage" style="margin-left:1rem; color:#4ade80;"></span>
        </div>
    `;

    // Evento para guardar plugins del usuario
    document.getElementById('saveUserPluginsBtn').addEventListener('click', function() {
        saveUserPlugins(username);
    });

    // Evento para resetear contraseña
    document.getElementById('resetUserPasswordBtn').addEventListener('click', function() {
        resetUserPassword(username);
    });
}

function saveUserPlugins(username) {
    var checkboxes = document.querySelectorAll('#userPluginsList input[type="checkbox"]:not([disabled])');
    var selectedPlugins = [];
    for (var i = 0; i < checkboxes.length; i++) {
        if (checkboxes[i].checked) {
            selectedPlugins.push(checkboxes[i].value);
        }
    }

    var users = loadUsers();
    if (!users[username]) {
        alert('Usuario no encontrado.');
        return;
    }
    // Mantener plugins gratuitos y en desarrollo que ya tuviera (no se pueden quitar)
    var currentPlugins = users[username].plugins || [];
    var forcedPlugins = [];
    var allPlugins = window.PLUGINS_DATA || [];
    for (var p = 0; p < allPlugins.length; p++) {
        var pl = allPlugins[p];
        if (pl.status === 'free' || pl.status === 'dev') {
            if (currentPlugins.indexOf(pl.id) !== -1) {
                forcedPlugins.push(pl.id);
            }
        }
    }
    // Unir forzados con seleccionados
    var finalPlugins = forcedPlugins.concat(selectedPlugins);
    // Eliminar duplicados
    finalPlugins = finalPlugins.filter(function(item, index) {
        return finalPlugins.indexOf(item) === index;
    });

    users[username].plugins = finalPlugins;
    saveUsers(users);
    document.getElementById('userPluginsMessage').textContent = '✅ Plugins actualizados correctamente.';
    setTimeout(function() {
        document.getElementById('userPluginsMessage').textContent = '';
    }, 3000);
    // Actualizar la vista de detalles para reflejar cambios
    showAccountDetail(username);
}

function resetUserPassword(username) {
    if (username === 'Fxrz') {
        alert('No se puede resetear la contraseña del Owner.');
        return;
    }
    var newPassword = prompt('Ingresa la nueva contraseña para ' + username + ':');
    if (newPassword === null || newPassword.trim() === '') return;
    var users = loadUsers();
    if (!users[username]) {
        alert('Usuario no encontrado.');
        return;
    }
    users[username].password = newPassword.trim();
    saveUsers(users);
    document.getElementById('resetPasswordMessage').textContent = '✅ Contraseña actualizada.';
    setTimeout(function() {
        document.getElementById('resetPasswordMessage').textContent = '';
    }, 3000);
}

// ===== Resto de funciones de admin.js (creación de códigos, listados, etc.) =====

function handleAdminCreateCode() {
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
        document.getElementById('adminLicenseInputOptional').value = '';
        var event = new Event('change');
        document.querySelectorAll('#adminPluginsCheckboxes input[type="checkbox"]').forEach(function(cb) { cb.dispatchEvent(event); });
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

// Estilos adicionales para la gestión de cuentas (se añaden al final del archivo para que se apliquen)
// Nota: los estilos deben estar en styles.css, pero los añadimos dinámicamente por si acaso
var style = document.createElement('style');
style.textContent = `
    .user-chip {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 60px;
        padding: 0.4rem 1rem;
        color: #c8d0e6;
        cursor: pointer;
        transition: 0.2s;
    }
    .user-chip:hover {
        background: rgba(167,139,250,0.12);
        border-color: rgba(167,139,250,0.2);
    }
    .account-search {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    .account-search input {
        flex: 1;
        min-width: 200px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 60px;
        padding: 0.6rem 1.2rem;
        color: #f0f2ff;
        outline: none;
    }
    .account-search input:focus {
        border-color: #a78bfa;
    }
    .account-search .btn-secondary {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.08);
        padding: 0.6rem 1.2rem;
        border-radius: 60px;
        color: #c8d0e6;
        cursor: pointer;
        transition: 0.2s;
    }
    .account-search .btn-secondary:hover {
        background: rgba(255,255,255,0.08);
    }
`;
document.head.appendChild(style);
