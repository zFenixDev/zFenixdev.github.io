// ============================================================
// codes.js - Sistema de códigos de canje con usos y licencias
// ============================================================

var CODES_KEY = 'zein_codes';

function loadCodes() {
    var stored = localStorage.getItem(CODES_KEY);
    if (stored) {
        try { return JSON.parse(stored); } catch (e) {}
    }
    return [];
}

function saveCodes(codes) {
    localStorage.setItem(CODES_KEY, JSON.stringify(codes));
}

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

function createRedeemCode(service, customCode, uses, license) {
    var plugin = window.PLUGINS_DATA.find(function(p) { return p.id === service; });
    if (!plugin) return { success: false, error: '❌ Servicio no válido' };
    if (!plugin.paid) return { success: false, error: '❌ El servicio es gratuito' };

    var codes = loadCodes();
    var code = customCode || generateCode(service);
    for (var i = 0; i < codes.length; i++) {
        if (codes[i].code === code) return { success: false, error: '❌ El código ya existe' };
    }
    var usesNum = parseInt(uses);
    if (isNaN(usesNum) || usesNum < -1) usesNum = -1;

    codes.push({
        code: code,
        service: service,
        used: false,
        usedBy: null,
        uses: usesNum,
        usedCount: 0,
        license: license || '',   // Licencia asociada al código
        adminGrant: false,
        adminDuration: null,
        createdAt: Date.now()
    });
    saveCodes(codes);
    return { success: true, code: code };
}

function listRedeemCodes() {
    return loadCodes();
}

function deleteRedeemCode(code) {
    var codes = loadCodes();
    var filtered = codes.filter(function(c) { return c.code !== code; });
    if (filtered.length === codes.length) {
        return { success: false, error: '❌ Código no encontrado' };
    }
    saveCodes(filtered);
    return { success: true };
}

function redeemCode(username, code) {
    var codes = loadCodes();
    var found = null;
    for (var i = 0; i < codes.length; i++) {
        if (codes[i].code === code) {
            found = codes[i];
            break;
        }
    }
    if (!found) return { success: false, error: '❌ Código inválido' };
    if (found.used && found.uses === 1) return { success: false, error: '❌ Código ya utilizado' };
    if (found.uses !== -1 && found.usedCount >= found.uses) {
        return { success: false, error: '❌ Este código ya ha alcanzado su límite de usos' };
    }

    if (typeof userHasPlugin === 'function') {
        if (userHasPlugin(username, found.service)) {
            return { success: false, error: '❌ Ya tienes este plugin' };
        }
    }

    found.usedCount = (found.usedCount || 0) + 1;
    if (found.uses !== -1 && found.usedCount >= found.uses) {
        found.used = true;
    }
    if (found.uses === 1) {
        found.used = true;
    }
    if (!found.usedBy) found.usedBy = username;
    saveCodes(codes);

    if (typeof addPluginToUser === 'function') {
        var added = addPluginToUser(username, found.service);
        if (!added) return { success: false, error: '❌ Error al agregar el plugin' };
    }

    // Guardar licencia si existe
    if (found.license && typeof setUserLicense === 'function') {
        setUserLicense(username, found.service, found.license);
    }

    if (found.adminGrant && typeof setUserRole === 'function') {
        setUserRole(username, 'admin');
    }

    var usesLeft = found.uses === -1 ? Infinity : found.uses - found.usedCount;
    return { success: true, service: found.service, usesLeft: usesLeft, license: found.license || null };
}

// ============================================================
// COMANDOS POR CONSOLA (redeemcode)
// ============================================================
window.redeemcode = function() {
    var args = Array.prototype.slice.call(arguments);
    var cmd = args[0];

    if (!cmd) {
        console.log('📦 Comandos redeemcode:');
        console.log('  redeemcode create <service> [usos] [licencia]  - Genera un código con usos y licencia');
        console.log('  redeemcode list                     - Muestra todos los códigos');
        console.log('  redeemcode delete <code>            - Elimina un código');
        console.log('');
        console.log('Ejemplos:');
        console.log('  redeemcode create zCore 5 "LIC-123"');
        console.log('  redeemcode list');
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
        var result = createRedeemCode(service, null, usesArg, licenseArg);
        if (result.success) {
            console.log('✅ Código creado:', result.code);
            console.log('   Servicio:', service);
            console.log('   Usos:', usesArg === -1 ? 'Infinitos' : usesArg);
            if (licenseArg) console.log('   Licencia:', licenseArg);
        } else {
            console.log(result.error);
        }
        return;
    }

    if (cmd === 'list') {
        var codes = listRedeemCodes();
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
            var servicePad = (c.service || '').padEnd(8);
            console.log('   ' + c.code + ' | ' + servicePad + ' | ' + usos.padEnd(4) + ' | ' + usados.padEnd(6) + ' | ' + admin + ' | ' + lic);
        }
        return;
    }

    if (cmd === 'delete') {
        var code = args[1];
        if (!code) {
            console.log('❌ Especifica el código a eliminar');
            return;
        }
        var result = deleteRedeemCode(code);
        if (result.success) {
            console.log('✅ Código eliminado:', code);
        } else {
            console.log(result.error);
        }
        return;
    }

    console.log('❌ Comando desconocido. Usa: create, list, delete');
};