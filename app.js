// ============================================================
// app.js - Enrutamiento y lógica principal (CORREGIDO FINAL)
// ============================================================

var currentPlugin = null;
var selectedVersion = null;
var isLoggedIn = false;
var currentUser = null;
var isRegisterMode = false;

// DOM Refs
var grid = document.getElementById('pluginGrid');
var userStatusText = document.getElementById('userStatusText');
var statusDot = document.getElementById('statusDot');
var userBadge = document.getElementById('userBadge');
var userDropdown = document.getElementById('userDropdown');
var pluginCount = document.getElementById('pluginCount');
var pagePlugins = document.getElementById('pagePlugins');
var pageSettings = document.getElementById('pageSettings');
var pageAdmin = document.getElementById('pageAdmin');
var logoLink = document.getElementById('logoLink');

// Modal plugin
var modalOverlay = document.getElementById('modalOverlay');
var modalClose = document.getElementById('modalClose');
var modalIcon = document.getElementById('modalIcon');
var modalTitle = document.getElementById('modalTitle');
var modalVersionLabel = document.getElementById('modalVersionLabel');
var modalStatus = document.getElementById('modalStatus');
var modalFullDesc = document.getElementById('modalFullDesc');
var versionSelector = document.getElementById('versionSelector');
var modalDownloadBtn = document.getElementById('modalDownloadBtn');

// Login modal
var loginModalOverlay = document.getElementById('loginModalOverlay');
var loginModalClose = document.getElementById('loginModalClose');
var loginUserInput = document.getElementById('loginUserInput');
var loginPassInput = document.getElementById('loginPassInput');
var loginEmailInput = document.getElementById('loginEmailInput');
var loginBtn = document.getElementById('loginBtn');
var loginError = document.getElementById('loginError');
var switchToRegister = document.getElementById('switchToRegister');
var loginToggleText = document.getElementById('loginToggleText');
var loginModalTitle = document.getElementById('loginModalTitle');
var loginModalSub = document.getElementById('loginModalSub');

// Redeem modal
var redeemModal = document.getElementById('redeemModal');
var redeemModalClose = document.getElementById('redeemModalClose');
var redeemKey = document.getElementById('redeemKey');
var redeemError = document.getElementById('redeemError');
var redeemSuccess = document.getElementById('redeemSuccess');
var redeemBtn = document.getElementById('redeemBtn');

// Ticket modal
var ticketModal = document.getElementById('ticketModal');
var ticketModalClose = document.getElementById('ticketModalClose');
var ticketTitle = document.getElementById('ticketTitle');
var ticketMessage = document.getElementById('ticketMessage');
var ticketError = document.getElementById('ticketError');
var ticketSuccess = document.getElementById('ticketSuccess');
var ticketBtn = document.getElementById('ticketBtn');

// My Tickets modal
var myTicketsModal = document.getElementById('myTicketsModal');
var myTicketsModalClose = document.getElementById('myTicketsModalClose');
var myTicketsList = document.getElementById('myTicketsList');
var dropdownMyTickets = document.getElementById('dropdownMyTickets');

// My Licenses modal
var myLicensesModal = document.getElementById('myLicensesModal');
var myLicensesModalClose = document.getElementById('myLicensesModalClose');
var myLicensesList = document.getElementById('myLicensesList');
var dropdownMyLicenses = document.getElementById('dropdownMyLicenses');

// Dropdown
var dropdownSettings = document.getElementById('dropdownSettings');
var dropdownRedeem = document.getElementById('dropdownRedeem');
var dropdownSupport = document.getElementById('dropdownSupport');
var dropdownAdmin = document.getElementById('dropdownAdmin');
var dropdownLogout = document.getElementById('dropdownLogout');

// ============================================================
// NAVEGACIÓN POR LOGO
// ============================================================
if (logoLink) {
    logoLink.addEventListener('click', function() {
        navigateTo('plugins');
    });
}

// ============================================================
// PLUGINS
// ============================================================
function getDownloadLink(pluginId, version) {
    if (!window.DOWNLOADS_DATA[pluginId]) return null;
    return window.DOWNLOADS_DATA[pluginId][version] || null;
}

function renderPlugins() {
    console.log('🔁 Renderizando plugins...');
    var plugins = window.PLUGINS_DATA || [];
    grid.innerHTML = '';

    if (plugins.length === 0) {
        grid.innerHTML = '<p style="color:#8892b0;text-align:center;padding:2rem;">No hay plugins disponibles</p>';
        pluginCount.textContent = '0 plugins';
        return;
    }

    for (var i = 0; i < plugins.length; i++) {
        var plugin = plugins[i];
        var card = document.createElement('div');
        card.className = 'plugin-card';

        var statusBadge = '';
        if (plugin.status === 'paid') {
            statusBadge = '<span style="background:rgba(250,204,21,0.15);color:#facc15;font-size:0.7rem;font-weight:600;padding:0.25rem 0.8rem;border-radius:50px;border:1px solid rgba(250,204,21,0.15);"><i class="fas fa-lock" style="margin-right:4px;"></i>pago</span>';
        } else if (plugin.status === 'dev') {
            statusBadge = '<span style="background:rgba(96,165,250,0.12);color:#60a5fa;font-size:0.7rem;font-weight:600;padding:0.25rem 0.8rem;border-radius:50px;border:1px solid rgba(96,165,250,0.15);"><i class="fas fa-code" style="margin-right:4px;"></i>en desarrollo</span>';
        } else {
            statusBadge = '<span style="background:rgba(74,222,128,0.1);color:#4ade80;font-size:0.7rem;font-weight:600;padding:0.25rem 0.8rem;border-radius:50px;border:1px solid rgba(74,222,128,0.15);"><i class="fas fa-check" style="margin-right:4px;"></i>gratis</span>';
        }

        card.innerHTML =
            '<div class="plugin-icon"><i class="fas ' + plugin.icon + '"></i></div>' +
            '<div class="plugin-name">' + plugin.name + '</div>' +
            '<div class="plugin-sub"><i class="fas fa-file-archive"></i> .jar ' + statusBadge + '</div>' +
            '<div class="plugin-desc">' + plugin.shortDesc + '</div>' +
            '<div class="plugin-actions">' +
            '   <button class="btn-info" data-plugin="' + plugin.id + '">' +
            '       <i class="fas fa-info-circle"></i> Ver más información' +
            '   </button>' +
            '</div>';

        grid.appendChild(card);
    }

    // Asignar eventos a los botones (con clonado para evitar duplicados)
    var buttons = document.querySelectorAll('.btn-info');
    for (var j = 0; j < buttons.length; j++) {
        var newBtn = buttons[j].cloneNode(true);
        buttons[j].parentNode.replaceChild(newBtn, buttons[j]);
        newBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var pluginId = this.getAttribute('data-plugin');
            console.log('🔍 Click en plugin:', pluginId);
            var allPlugins = window.PLUGINS_DATA || [];
            for (var k = 0; k < allPlugins.length; k++) {
                if (allPlugins[k].id === pluginId) {
                    console.log('📦 Abriendo modal para:', allPlugins[k].name);
                    // === BUG CORREGIDO: capturar el plugin en una variable local ===
                    var pluginToOpen = allPlugins[k];
                    // Si hay un modal abierto, lo cerramos primero
                    if (modalOverlay.classList.contains('active')) {
                        closeModal();
                    }
                    // Usamos setTimeout con el plugin capturado (no con el índice)
                    setTimeout(function() {
                        openModal(pluginToOpen);
                    }, 50);
                    break;
                }
            }
        });
    }

    pluginCount.textContent = plugins.length + ' plugins';
    console.log('✅ Plugins renderizados correctamente.');
}

function openModal(plugin) {
    console.log('🟢 openModal llamado para:', plugin.name);

    // Si hay un modal abierto, lo cerramos para evitar conflictos
    if (modalOverlay.classList.contains('active')) {
        closeModal();
    }

    // Asignar plugin ANTES de actualizar el botón
    currentPlugin = plugin;
    selectedVersion = null;

    // Configurar el modal
    modalIcon.innerHTML = '<i class="fas ' + plugin.icon + '"></i>';
    modalTitle.textContent = plugin.name;

    // Generar versiones
    var versionHtml = '';
    if (plugin.versions && plugin.versions.length > 0) {
        for (var v = 0; v < plugin.versions.length; v++) {
            var ver = plugin.versions[v];
            var active = v === 0 ? 'active' : '';
            var hasLink = !!getDownloadLink(plugin.id, ver);
            versionHtml += '<span class="version-chip ' + active + '" data-version="' + ver + '" style="' + (!hasLink ? 'opacity:0.5;' : '') + '">' + ver + (!hasLink ? ' ⚠️' : '') + '</span>';
        }
    } else {
        versionHtml = '<span style="color:#6d7a9e;font-size:0.9rem;">Sin versiones</span>';
    }
    versionSelector.innerHTML = versionHtml;
    selectedVersion = (plugin.versions && plugin.versions.length > 0) ? plugin.versions[0] : null;
    modalVersionLabel.textContent = selectedVersion ? 'Versión ' + selectedVersion : 'Sin versiones';

    // Estado
    var statusMap = {
        paid: { cls: 'paid', label: '🔒 Pago' },
        free: { cls: 'free', label: '✅ Gratis' },
        dev: { cls: 'dev', label: '⚙️ En desarrollo' }
    };
    var st = statusMap[plugin.status] || statusMap.free;
    modalStatus.className = 'modal-status ' + st.cls;
    modalStatus.textContent = st.label;
    modalFullDesc.textContent = plugin.fullDesc || plugin.shortDesc;

    // Limpiar licencia anterior
    var existingLicense = document.querySelector('.license-display');
    if (existingLicense) existingLicense.remove();

    // === BUG CORREGIDO: ahora currentPlugin ya está asignado ===
    updateDownloadButton();

    // Eventos para versiones (clonado para evitar duplicados)
    var chips = document.querySelectorAll('.version-chip');
    for (var c = 0; c < chips.length; c++) {
        var newChip = chips[c].cloneNode(true);
        chips[c].parentNode.replaceChild(newChip, chips[c]);
        newChip.addEventListener('click', function() {
            var allChips = document.querySelectorAll('.version-chip');
            for (var ac = 0; ac < allChips.length; ac++) {
                allChips[ac].classList.remove('active');
            }
            this.classList.add('active');
            selectedVersion = this.getAttribute('data-version');
            modalVersionLabel.textContent = 'Versión ' + selectedVersion;
            updateDownloadButton();
        });
    }

    modalOverlay.classList.add('active');
    console.log('✅ Modal abierto.');
}

function updateDownloadButton() {
    if (!currentPlugin) return;
    var plugin = currentPlugin;

    // Limpiar licencia anterior
    var existingLicense = document.querySelector('.license-display');
    if (existingLicense) existingLicense.remove();

    // Si es desarrollo o no tiene versiones
    if (plugin.status === 'dev' || !plugin.versions || plugin.versions.length === 0) {
        modalDownloadBtn.disabled = true;
        modalDownloadBtn.innerHTML = '<i class="fas fa-code"></i> No disponible';
        modalDownloadBtn.className = 'modal-download-btn';
        return;
    }

    var hasAccess = false;
    if (!plugin.paid) {
        hasAccess = true;
    } else {
        if (isLoggedIn && currentUser) {
            hasAccess = userHasPlugin(currentUser, plugin.id);
        }
    }

    var downloadUrl = getDownloadLink(plugin.id, selectedVersion);
    var hasDownload = !!downloadUrl;

    // Mostrar licencia si el usuario tiene el plugin y es de pago
    if (plugin.paid && isLoggedIn && currentUser && userHasPlugin(currentUser, plugin.id)) {
        var license = getUserLicense(currentUser, plugin.id);
        if (license) {
            var licenseDiv = document.createElement('div');
            licenseDiv.className = 'license-display';
            licenseDiv.innerHTML = `
                <span style="color:#8892b0; font-size:0.85rem;">🔑 Licencia: </span>
                <span class="license-text" data-license="${license}" style="color:#a78bfa; font-weight:600; cursor:pointer; filter: blur(4px); transition: filter 0.3s;">Click para ver</span>
            `;
            var span = licenseDiv.querySelector('.license-text');
            span.addEventListener('click', function() {
                if (this.style.filter === 'blur(0px)') {
                    this.style.filter = 'blur(4px)';
                    this.innerText = 'Click para ver';
                } else {
                    this.style.filter = 'blur(0px)';
                    this.innerText = this.dataset.license;
                }
            });
            modalDownloadBtn.parentNode.insertBefore(licenseDiv, modalDownloadBtn);
        }
    }

    if (hasAccess && hasDownload) {
        modalDownloadBtn.disabled = false;
        modalDownloadBtn.innerHTML = '<i class="fas fa-download"></i> Descargar ' + plugin.name + ' ' + (selectedVersion || '');
        modalDownloadBtn.className = 'modal-download-btn';
        var newBtn = modalDownloadBtn.cloneNode(true);
        modalDownloadBtn.parentNode.replaceChild(newBtn, modalDownloadBtn);
        newBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var url = getDownloadLink(plugin.id, selectedVersion);
            if (url) {
                window.open(url, '_blank');
            } else {
                alert('⚠️ No hay enlace para esta versión.');
            }
        });
    } else {
        modalDownloadBtn.disabled = true;
        if (!hasDownload) {
            modalDownloadBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Sin enlace disponible';
            modalDownloadBtn.className = 'modal-download-btn';
        } else if (!hasAccess) {
            if (!isLoggedIn) {
                modalDownloadBtn.innerHTML = '<i class="fas fa-lock"></i> Inicia sesión para comprar';
                modalDownloadBtn.className = 'modal-download-btn locked';
            } else {
                modalDownloadBtn.innerHTML = '<i class="fas fa-lock"></i> No tienes este plugin';
                modalDownloadBtn.className = 'modal-download-btn locked';
            }
        }
    }
}

function closeModal() {
    modalOverlay.classList.remove('active');
    currentPlugin = null;
    selectedVersion = null;
    console.log('🟢 Modal cerrado.');
}

// ============================================================
// UI Y AUTENTICACIÓN
// ============================================================
function updateUI() {
    console.log('🔄 Actualizando UI...');
    isLoggedIn = isUserLoggedIn();
    currentUser = getCurrentUser();

    if (isLoggedIn && currentUser) {
        var users = loadUsers();
        var displayName = users[currentUser]?.displayName || currentUser;
        userStatusText.textContent = displayName;
        statusDot.className = 'status-dot';
        if (isAdmin(currentUser) || currentUser === 'Fxrz') {
            dropdownAdmin.style.display = 'flex';
        } else {
            dropdownAdmin.style.display = 'none';
        }
        dropdownSupport.style.display = 'flex';
        dropdownMyTickets.style.display = 'flex';
        dropdownMyLicenses.style.display = 'flex';
    } else {
        userStatusText.textContent = 'Invitado';
        statusDot.className = 'status-dot offline';
        userDropdown.classList.remove('show');
        dropdownAdmin.style.display = 'none';
        dropdownSupport.style.display = 'none';
        dropdownMyTickets.style.display = 'none';
        dropdownMyLicenses.style.display = 'none';
    }

    if (currentPlugin && modalOverlay.classList.contains('active')) {
        updateDownloadButton();
    }

    if (pagePlugins.style.display !== 'none') {
        renderPlugins();
    }
}

// ============================================================
// ENRUTAMIENTO
// ============================================================
function navigateTo(page) {
    console.log('🧭 Navegando a:', page);
    pagePlugins.style.display = 'none';
    pageSettings.style.display = 'none';
    pageAdmin.style.display = 'none';

    if (page === 'plugins' || !page) {
        pagePlugins.style.display = 'block';
        renderPlugins();
        window.location.hash = '#';
    } else if (page === 'settings') {
        pageSettings.style.display = 'block';
        if (typeof renderSettingsPage === 'function') renderSettingsPage();
        window.location.hash = '#settings';
    } else if (page === 'admin') {
        if (!isLoggedIn) {
            alert('Debes iniciar sesión.');
            navigateTo('plugins');
            return;
        }
        if (!isAdmin(currentUser) && currentUser !== 'Fxrz') {
            alert('⛔ No tienes permisos de administrador.');
            navigateTo('plugins');
            return;
        }
        pageAdmin.style.display = 'block';
        if (typeof renderAdminPage === 'function') renderAdminPage();
        window.location.hash = '#admin';
    }
}

window.addEventListener('hashchange', function() {
    var hash = window.location.hash.replace('#', '');
    if (hash === 'settings') navigateTo('settings');
    else if (hash === 'admin') navigateTo('admin');
    else navigateTo('plugins');
});

// ============================================================
// LOGIN / REGISTER
// ============================================================
function openLoginModal() {
    isRegisterMode = false;
    loginModalTitle.textContent = 'Iniciar sesión';
    loginModalSub.textContent = 'Ingresa tus credenciales';
    loginBtn.textContent = 'Iniciar sesión';
    loginToggleText.innerHTML = '¿No tienes cuenta? <span class="login-toggle" id="switchToRegister">Regístrate</span>';
    loginEmailInput.style.display = 'none';
    loginError.textContent = '';
    loginUserInput.value = '';
    loginPassInput.value = '';
    loginEmailInput.value = '';
    loginModalOverlay.classList.add('active');
    document.getElementById('switchToRegister').onclick = toggleAuthMode;
}

function openRegisterModal() {
    isRegisterMode = true;
    loginModalTitle.textContent = 'Crear cuenta';
    loginModalSub.textContent = 'Regístrate para acceder a las descargas';
    loginBtn.textContent = 'Registrarse';
    loginToggleText.innerHTML = '¿Ya tienes cuenta? <span class="login-toggle" id="switchToRegister">Iniciar sesión</span>';
    loginEmailInput.style.display = 'block';
    loginError.textContent = '';
    loginUserInput.value = '';
    loginPassInput.value = '';
    loginEmailInput.value = '';
    loginModalOverlay.classList.add('active');
    document.getElementById('switchToRegister').onclick = toggleAuthMode;
}

function toggleAuthMode() {
    if (isRegisterMode) {
        isRegisterMode = false;
        loginModalTitle.textContent = 'Iniciar sesión';
        loginModalSub.textContent = 'Ingresa tus credenciales';
        loginBtn.textContent = 'Iniciar sesión';
        loginToggleText.innerHTML = '¿No tienes cuenta? <span class="login-toggle" id="switchToRegister">Regístrate</span>';
        loginEmailInput.style.display = 'none';
    } else {
        isRegisterMode = true;
        loginModalTitle.textContent = 'Crear cuenta';
        loginModalSub.textContent = 'Regístrate para acceder a las descargas';
        loginBtn.textContent = 'Registrarse';
        loginToggleText.innerHTML = '¿Ya tienes cuenta? <span class="login-toggle" id="switchToRegister">Iniciar sesión</span>';
        loginEmailInput.style.display = 'block';
    }
    loginError.textContent = '';
    loginPassInput.value = '';
    loginEmailInput.value = '';
    document.getElementById('switchToRegister').onclick = toggleAuthMode;
}

function closeLoginModal() {
    loginModalOverlay.classList.remove('active');
    isRegisterMode = false;
}

function handleLogin() {
    var username = loginUserInput.value.trim();
    var password = loginPassInput.value.trim();

    if (!username || !password) {
        loginError.textContent = '⚠️ Completa todos los campos.';
        loginError.style.color = '#f87171';
        return;
    }

    if (isRegisterMode) {
        var email = loginEmailInput.value.trim();
        var result = registerUser(username, password, email);
        if (result.success) {
            loginError.textContent = '✅ Cuenta creada. Ahora inicia sesión.';
            loginError.style.color = '#4ade80';
            isRegisterMode = false;
            loginModalTitle.textContent = 'Iniciar sesión';
            loginModalSub.textContent = 'Ingresa tus credenciales';
            loginBtn.textContent = 'Iniciar sesión';
            loginToggleText.innerHTML = '¿No tienes cuenta? <span class="login-toggle" id="switchToRegister">Regístrate</span>';
            loginEmailInput.style.display = 'none';
            loginUserInput.value = username;
            loginPassInput.value = '';
            loginEmailInput.value = '';
            document.getElementById('switchToRegister').onclick = toggleAuthMode;
            setTimeout(function() {
                loginError.textContent = '';
                loginError.style.color = '#f87171';
            }, 3000);
        } else {
            loginError.textContent = result.error;
            loginError.style.color = '#f87171';
        }
        return;
    }

    var result = loginUser(username, password);
    if (result.success) {
        loginError.textContent = '';
        closeLoginModal();
        updateUI();
        var hash = window.location.hash.replace('#', '');
        if (hash === 'settings' || hash === 'admin') {
            navigateTo(hash);
        }
    } else {
        loginError.textContent = result.error || '❌ Usuario o contraseña incorrectos';
        loginError.style.color = '#f87171';
    }
}

// ============================================================
// REDEEM
// ============================================================
function openRedeemModal() {
    if (!isLoggedIn || !currentUser) {
        alert('Debes iniciar sesión primero.');
        return;
    }
    redeemKey.value = '';
    redeemError.textContent = '';
    redeemSuccess.textContent = '';
    redeemModal.classList.add('active');
}

function handleRedeem() {
    var code = redeemKey.value.trim().toUpperCase();
    if (!code) {
        redeemError.textContent = '❌ Ingresa un código válido.';
        redeemSuccess.textContent = '';
        return;
    }

    var result = redeemCode(currentUser, code);
    if (result.success) {
        var usosMsg = '';
        if (result.usesLeft !== undefined) {
            usosMsg = result.usesLeft === Infinity ? ' (∞ usos restantes)' : ' (' + result.usesLeft + ' usos restantes)';
        }
        var licMsg = result.license ? ' Licencia: ' + result.license : '';
        redeemSuccess.textContent = '✅ ¡Plugin canjeado correctamente!' + usosMsg + licMsg;
        redeemError.textContent = '';
        redeemKey.value = '';
        updateUI();
        if (currentPlugin && modalOverlay.classList.contains('active')) {
            updateDownloadButton();
        }
    } else {
        redeemError.textContent = result.error;
        redeemSuccess.textContent = '';
    }
}

// ============================================================
// SOPORTE (CREAR TICKET)
// ============================================================
function openTicketModal() {
    if (!isLoggedIn || !currentUser) {
        alert('Debes iniciar sesión para crear un ticket.');
        return;
    }
    ticketTitle.value = '';
    ticketMessage.value = '';
    ticketError.textContent = '';
    ticketSuccess.textContent = '';
    ticketModal.classList.add('active');
}

function handleCreateTicket() {
    var title = ticketTitle.value.trim();
    var message = ticketMessage.value.trim();
    if (!title || !message) {
        ticketError.textContent = '❌ Completa todos los campos.';
        ticketSuccess.textContent = '';
        return;
    }
    var ticket = createTicket(currentUser, title, message);
    if (ticket) {
        ticketSuccess.textContent = '✅ Ticket creado correctamente. ID: ' + ticket.id;
        ticketError.textContent = '';
        ticketTitle.value = '';
        ticketMessage.value = '';
        setTimeout(function() {
            ticketModal.classList.remove('active');
        }, 2000);
    } else {
        ticketError.textContent = '❌ Error al crear el ticket.';
        ticketSuccess.textContent = '';
    }
}

// ============================================================
// MIS TICKETS (VER Y RESPONDER)
// ============================================================
function openMyTicketsModal() {
    var tickets = getTicketsByUser(currentUser);
    if (tickets.length === 0) {
        myTicketsList.innerHTML = '<p style="color:#8892b0; text-align:center; padding:2rem;">No has creado ningún ticket.</p>';
    } else {
        var html = '<div class="ticket-list">';
        for (var i = 0; i < tickets.length; i++) {
            var t = tickets[i];
            var statusClass = t.status === 'open' ? 'open' : 'closed';
            var statusLabel = t.status === 'open' ? 'Abierto' : 'Cerrado';
            html += `
                <div class="ticket-item" onclick="toggleMyTicketDetail('${t.id}')">
                    <div class="ticket-info">
                        <div class="ticket-title">${t.title}</div>
                        <div class="ticket-meta">
                            <span>${new Date(t.createdAt).toLocaleString()}</span>
                            <span>${t.messages.length} mensajes</span>
                        </div>
                    </div>
                    <span class="ticket-status ${statusClass}">${statusLabel}</span>
                </div>
                <div id="myTicketDetail_${t.id}" style="display:none;" class="ticket-detail"></div>
            `;
        }
        html += '</div>';
        myTicketsList.innerHTML = html;
    }
    myTicketsModal.classList.add('active');
}

function toggleMyTicketDetail(ticketId) {
    var detailEl = document.getElementById('myTicketDetail_' + ticketId);
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
                <input type="text" id="myTicketReplyInput_${ticketId}" placeholder="Escribe una respuesta...">
                <button onclick="sendMyTicketReply('${ticketId}')">Enviar</button>
            </div>
        `;
    } else {
        html += `
            <div style="text-align:center;color:#8892b0;margin-top:1rem;">
                Ticket cerrado. <button onclick="reopenMyTicket('${ticketId}')" style="background:none;border:1px solid #a78bfa;color:#a78bfa;padding:0.3rem 1rem;border-radius:60px;cursor:pointer;">Reabrir</button>
            </div>
        `;
    }

    detailEl.innerHTML = html;
    detailEl.style.display = 'block';
}

function sendMyTicketReply(ticketId) {
    var input = document.getElementById('myTicketReplyInput_' + ticketId);
    var text = input.value.trim();
    if (!text) return;
    var result = addTicketMessage(ticketId, currentUser, text);
    if (result) {
        input.value = '';
        openMyTicketsModal();
    }
}

function reopenMyTicket(ticketId) {
    reopenTicket(ticketId);
    openMyTicketsModal();
}

// ============================================================
// MIS LICENCIAS
// ============================================================
function openMyLicensesModal() {
    var users = loadUsers();
    var userData = users[currentUser];
    if (!userData || !userData.licenses || Object.keys(userData.licenses).length === 0) {
        myLicensesList.innerHTML = '<p style="color:#8892b0; text-align:center; padding:2rem;">No tienes licencias asignadas.</p>';
    } else {
        var html = '<table class="admin-table"><thead><tr><th>Plugin</th><th>Licencia</th></tr></thead><tbody>';
        for (var pluginId in userData.licenses) {
            var license = userData.licenses[pluginId];
            var pluginName = pluginId;
            var plugins = window.PLUGINS_DATA || [];
            for (var p = 0; p < plugins.length; p++) {
                if (plugins[p].id === pluginId) {
                    pluginName = plugins[p].name;
                    break;
                }
            }
            html += `
                <tr>
                    <td><strong>${pluginName}</strong> (${pluginId})</td>
                    <td><code style="background:rgba(255,255,255,0.04);padding:0.2rem 0.6rem;border-radius:4px;">${license}</code></td>
                </tr>
            `;
        }
        html += '</tbody></table>';
        myLicensesList.innerHTML = html;
    }
    myLicensesModal.classList.add('active');
}

// ============================================================
// DROPDOWN
// ============================================================
function toggleDropdown(e) {
    e.stopPropagation();
    if (isLoggedIn) {
        userDropdown.classList.toggle('show');
    } else {
        openLoginModal();
    }
}

function closeDropdown() {
    userDropdown.classList.remove('show');
}

// ============================================================
// EVENTOS
// ============================================================
userBadge.addEventListener('click', toggleDropdown);

document.addEventListener('click', function(e) {
    if (!userBadge.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove('show');
    }
});

loginBtn.addEventListener('click', handleLogin);
loginUserInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') loginPassInput.focus();
});
loginPassInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') handleLogin();
});
loginEmailInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') handleLogin();
});

loginModalClose.addEventListener('click', closeLoginModal);
loginModalOverlay.addEventListener('click', function(e) {
    if (e.target === loginModalOverlay) closeLoginModal();
});

dropdownSettings.addEventListener('click', function() {
    closeDropdown();
    navigateTo('settings');
});

dropdownRedeem.addEventListener('click', function() {
    closeDropdown();
    openRedeemModal();
});
redeemModalClose.addEventListener('click', function() {
    redeemModal.classList.remove('active');
});
redeemModal.addEventListener('click', function(e) {
    if (e.target === redeemModal) redeemModal.classList.remove('active');
});
redeemBtn.addEventListener('click', handleRedeem);

dropdownSupport.addEventListener('click', function() {
    closeDropdown();
    openTicketModal();
});
ticketModalClose.addEventListener('click', function() {
    ticketModal.classList.remove('active');
});
ticketModal.addEventListener('click', function(e) {
    if (e.target === ticketModal) ticketModal.classList.remove('active');
});
ticketBtn.addEventListener('click', handleCreateTicket);

dropdownMyTickets.addEventListener('click', function() {
    closeDropdown();
    if (!isLoggedIn || !currentUser) {
        alert('Debes iniciar sesión para ver tus tickets.');
        return;
    }
    openMyTicketsModal();
});
myTicketsModalClose.addEventListener('click', function() {
    myTicketsModal.classList.remove('active');
});
myTicketsModal.addEventListener('click', function(e) {
    if (e.target === myTicketsModal) myTicketsModal.classList.remove('active');
});

dropdownMyLicenses.addEventListener('click', function() {
    closeDropdown();
    if (!isLoggedIn || !currentUser) {
        alert('Debes iniciar sesión para ver tus licencias.');
        return;
    }
    openMyLicensesModal();
});
myLicensesModalClose.addEventListener('click', function() {
    myLicensesModal.classList.remove('active');
});
myLicensesModal.addEventListener('click', function(e) {
    if (e.target === myLicensesModal) myLicensesModal.classList.remove('active');
});

dropdownAdmin.addEventListener('click', function() {
    closeDropdown();
    navigateTo('admin');
});

dropdownLogout.addEventListener('click', function() {
    closeDropdown();
    if (confirm('¿Cerrar sesión?')) {
        logoutUser();
        updateUI();
        navigateTo('plugins');
    }
});

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay) closeModal();
});

// ============================================================
// INICIALIZACIÓN
// ============================================================
function init() {
    console.log('🚀 Inicializando aplicación...');
    console.log('📦 ' + (window.PLUGINS_DATA?.length || 0) + ' plugins cargados');
    console.log('👤 Usuarios: admin/1234, user/1234, Fxrz/05052424');

    var hash = window.location.hash.replace('#', '');
    if (hash === 'settings') navigateTo('settings');
    else if (hash === 'admin') navigateTo('admin');
    else navigateTo('plugins');

    updateUI();
    console.log('✅ Inicialización completa.');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
