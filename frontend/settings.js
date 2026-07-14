// ============================================================
// settings.js - Configuración de cuenta (con backend)
// ============================================================

var settingsContainer = document.getElementById('pageSettings');

async function renderSettingsPage() {
  if (!isUserLoggedIn()) {
    alert('Debes iniciar sesión para acceder a la configuración.');
    navigateTo('plugins');
    return;
  }

  var data = await getUserData(currentUser);
  if (!data.success) {
    alert('Error al cargar los datos del usuario.');
    navigateTo('plugins');
    return;
  }
  var userData = data.user;

  settingsContainer.innerHTML = `
    <div class="settings-container">
      <h2><i class="fas fa-user-cog"></i> Configuración de la cuenta</h2>
      <p class="sub">Administra tus datos personales y seguridad</p>

      <div class="settings-card">
        <form class="settings-form" id="settingsForm">
          <div class="form-row">
            <div class="form-group">
              <label><i class="fas fa-user"></i> Nombre de usuario</label>
              <div class="current-value">${userData.displayName || currentUser}</div>
              <input type="text" id="settingsNewDisplayName" placeholder="Nuevo nombre" value="${userData.displayName || ''}">
            </div>
            <div class="form-group">
              <label><i class="fas fa-envelope"></i> Correo electrónico</label>
              <div class="current-value">${userData.email || 'No establecido'}</div>
              <input type="email" id="settingsNewEmail" placeholder="Nuevo correo" value="${userData.email || ''}">
            </div>
          </div>

          <div class="form-divider"></div>

          <div class="form-group">
            <label><i class="fas fa-lock"></i> Cambiar contraseña</label>
            <div class="password-fields">
              <input type="password" id="settingsCurrentPassword" placeholder="Contraseña actual">
              <input type="password" id="settingsNewPassword" placeholder="Nueva contraseña">
              <input type="password" id="settingsConfirmPassword" placeholder="Repetir nueva contraseña">
            </div>
          </div>

          <div id="settingsMessage" class="settings-message"></div>
          <button type="submit" class="btn-primary"><i class="fas fa-save"></i> Guardar cambios</button>
        </form>
      </div>

      <div class="settings-card danger-zone">
        <h3><i class="fas fa-exclamation-triangle"></i> Zona peligrosa</h3>
        <p class="danger-text">Eliminar tu cuenta es irreversible. Se borrarán todos tus datos.</p>
        <button id="deleteAccountBtn" class="btn-danger"><i class="fas fa-user-slash"></i> Eliminar cuenta</button>
        <div id="deleteMessage" class="settings-message"></div>
      </div>
    </div>
  `;

  document.getElementById('settingsForm').addEventListener('submit', function(e) {
    e.preventDefault();
    saveSettingsChanges();
  });

  document.getElementById('deleteAccountBtn').addEventListener('click', function() {
    openDeleteConfirmation();
  });
}

async function saveSettingsChanges() {
  var displayName = document.getElementById('settingsNewDisplayName').value.trim();
  var email = document.getElementById('settingsNewEmail').value.trim();
  var currentPass = document.getElementById('settingsCurrentPassword').value;
  var newPass = document.getElementById('settingsNewPassword').value;
  var confirmPass = document.getElementById('settingsConfirmPassword').value;
  var messageEl = document.getElementById('settingsMessage');

  if (!displayName) {
    messageEl.innerHTML = '<span style="color:#f87171;">❌ El nombre es obligatorio.</span>';
    return;
  }

  if (newPass || confirmPass || currentPass) {
    if (!currentPass || !newPass || !confirmPass) {
      messageEl.innerHTML = '<span style="color:#f87171;">❌ Completa todos los campos de contraseña.</span>';
      return;
    }
    if (newPass !== confirmPass) {
      messageEl.innerHTML = '<span style="color:#f87171;">❌ Las contraseñas no coinciden.</span>';
      return;
    }
    // Verificar contraseña actual
    var loginCheck = await loginUser(currentUser, currentPass);
    if (!loginCheck.success) {
      messageEl.innerHTML = '<span style="color:#f87171;">❌ Contraseña actual incorrecta.</span>';
      return;
    }
    var data = { displayName: displayName, email: email, password: newPass };
    var result = await updateUserProfile(currentUser, data);
    if (result.success) {
      messageEl.innerHTML = '<span style="color:#4ade80;">✅ Datos actualizados.</span>';
      document.getElementById('settingsCurrentPassword').value = '';
      document.getElementById('settingsNewPassword').value = '';
      document.getElementById('settingsConfirmPassword').value = '';
      // Refrescar UI
      await renderSettingsPage();
      updateUI();
    } else {
      messageEl.innerHTML = '<span style="color:#f87171;">❌ ' + (result.error || 'Error al actualizar') + '</span>';
    }
  } else {
    var data = { displayName: displayName, email: email };
    var result = await updateUserProfile(currentUser, data);
    if (result.success) {
      messageEl.innerHTML = '<span style="color:#4ade80;">✅ Datos actualizados.</span>';
      await renderSettingsPage();
      updateUI();
    } else {
      messageEl.innerHTML = '<span style="color:#f87171;">❌ ' + (result.error || 'Error al actualizar') + '</span>';
    }
  }
}

function openDeleteConfirmation() {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay active';
  overlay.id = 'deleteConfirmOverlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:440px;">
      <div class="modal-title" style="color:#f87171;">⚠️ Eliminar cuenta</div>
      <div class="modal-sub">¿Estás seguro? ¡Es irreversible!</div>
      <p style="color:#b9c2dd; margin-bottom:1.5rem;">Se borrarán todos tus datos y perderás el acceso a tus plugins.</p>
      <div class="modal-form">
        <input type="password" id="deleteConfirmPassword" placeholder="Ingresa tu contraseña">
        <div id="deleteConfirmError" class="modal-error"></div>
        <div style="display:flex; gap:0.8rem; margin-top:0.5rem;">
          <button id="deleteConfirmYes" class="btn-danger" style="flex:1;"><i class="fas fa-trash"></i> Sí, eliminar</button>
          <button id="deleteConfirmNo" class="btn-secondary" style="flex:1;">Cancelar</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('deleteConfirmNo').addEventListener('click', function() { overlay.remove(); });
  document.getElementById('deleteConfirmYes').addEventListener('click', async function() {
    var password = document.getElementById('deleteConfirmPassword').value.trim();
    var errorEl = document.getElementById('deleteConfirmError');
    if (!password) {
      errorEl.textContent = '❌ Ingresa tu contraseña.';
      return;
    }
    var result = await deleteUserAccount(currentUser, password);
    if (result.success) {
      errorEl.textContent = '';
      overlay.innerHTML = `
        <div class="modal" style="max-width:440px; text-align:center;">
          <div class="modal-title" style="color:#4ade80;">✅ Cuenta eliminada</div>
          <p style="color:#b9c2dd; margin:1.5rem 0;">Tu cuenta ha sido eliminada correctamente.</p>
          <button id="deleteConfirmOk" class="btn-primary" style="width:100%;">Aceptar</button>
        </div>
      `;
      document.getElementById('deleteConfirmOk').addEventListener('click', function() {
        overlay.remove();
        logoutUser();
        updateUI();
        navigateTo('plugins');
      });
      logoutUser();
      updateUI();
    } else {
      errorEl.textContent = '❌ ' + (result.error || 'Error al eliminar.');
    }
  });

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.remove();
  });
}