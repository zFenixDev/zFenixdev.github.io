// ============================================================
// codes.js - Sistema de códigos con backend centralizado
// ============================================================

const API_URL = 'http://localhost:3000/api';

function generateCode(service) {
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

async function createRedeemCode(service, customCode, uses, license, adminGrant, adminDuration) {
  const code = customCode || generateCode(service);
  const usesNum = parseInt(uses) || -1;
  try {
    const res = await fetch(`${API_URL}/codes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        service,
        uses: usesNum,
        license: license || '',
        adminGrant: adminGrant || false,
        adminDuration: adminDuration || null
      })
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: 'Error de conexión' };
  }
}

async function listRedeemCodes() {
  try {
    const res = await fetch(`${API_URL}/codes`);
    return await res.json();
  } catch (e) {
    return [];
  }
}

async function deleteRedeemCode(code) {
  try {
    const res = await fetch(`${API_URL}/codes/${code}`, { method: 'DELETE' });
    return await res.json();
  } catch (e) {
    return { success: false, error: 'Error de conexión' };
  }
}

async function redeemCode(username, code) {
  try {
    const res = await fetch(`${API_URL}/codes/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, code })
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: 'Error de conexión' };
  }
}

// ============================================================
// COMANDOS POR CONSOLA (redeemcode) - adaptados a async
// ============================================================
window.redeemcode = async function() {
  var args = Array.prototype.slice.call(arguments);
  var cmd = args[0];

  if (!cmd) {
    console.log('📦 Comandos redeemcode:');
    console.log('  redeemcode create <service> [usos] [licencia]  - Genera un código');
    console.log('  redeemcode list                     - Muestra todos los códigos');
    console.log('  redeemcode delete <code>            - Elimina un código');
    return;
  }

  if (cmd === 'create') {
    var service = args[1];
    var usesArg = parseInt(args[2]) || -1;
    var licenseArg = args[3] || '';
    if (!service) {
      console.log('❌ Especifica el servicio: redeemcode create zCore 5 "LIC-123"');
      return;
    }
    var result = await createRedeemCode(service, null, usesArg, licenseArg);
    if (result.success) {
      console.log('✅ Código creado:', result.code);
      console.log('   Servicio:', service);
      console.log('   Usos:', usesArg === -1 ? 'Infinitos' : usesArg);
      if (licenseArg) console.log('   Licencia:', licenseArg);
    } else {
      console.log(result.error || '❌ Error al crear');
    }
    return;
  }

  if (cmd === 'list') {
    var codes = await listRedeemCodes();
    if (codes.length === 0) {
      console.log('📭 No hay códigos creados.');
      return;
    }
    console.log('📋 Lista de códigos:');
    console.log('   Código               | Servicio | Usos | Usados | Admin | Licencia');
    console.log('   ------------------------------------------------------------------');
    for (var i = 0; i < codes.length; i++) {
      var c = codes[i];
      var usos = c.uses === -1 ? '∞' : c.uses;
      var usados = c.usedCount || 0;
      var admin = c.adminGrant ? '✅' : '❌';
      var lic = c.license || '-';
      console.log('   ' + c.code + ' | ' + (c.service || '').padEnd(8) + ' | ' + usos.toString().padEnd(4) + ' | ' + usados.toString().padEnd(6) + ' | ' + admin + ' | ' + lic);
    }
    return;
  }

  if (cmd === 'delete') {
    var code = args[1];
    if (!code) {
      console.log('❌ Especifica el código a eliminar');
      return;
    }
    var result = await deleteRedeemCode(code);
    if (result.success) {
      console.log('✅ Código eliminado:', code);
    } else {
      console.log(result.error || '❌ Error al eliminar');
    }
    return;
  }

  console.log('❌ Comando desconocido. Usa: create, list, delete');
};