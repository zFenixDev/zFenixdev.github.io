// ============================================================
// plugins.js - Datos de plugins y enlaces de descarga
// ============================================================

window.PLUGINS_DATA = [
    {
        id: 'zcore',
        name: 'zCore',
        icon: 'fa-bolt',
        shortDesc: 'Núcleo robusto para gestión de servidores.',
        fullDesc: 'zCore es el corazón de tu servidor. Proporciona comandos esenciales, optimización de rendimiento, sistema de permisos integrado y una API ligera para desarrolladores.',
        paid: true,
        status: 'paid',
        versions: ['1.0.0', '1.1.0']
    },
    {
        id: 'zshop',
        name: 'zShop',
        icon: 'fa-store',
        shortDesc: 'Sistema avanzado de tiendas virtuales.',
        fullDesc: 'zShop permite crear tiendas personalizadas con soporte para monedas, economía, y sistemas de pago. Incluye editor visual y estadísticas.',
        paid: true,
        status: 'paid',
        versions: ['1.0.0']
    },
    {
        id: 'zkoth',
        name: 'zKoTH',
        icon: 'fa-crown',
        shortDesc: 'Eventos KoTH dinámicos y recompensas.',
        fullDesc: 'Organiza eventos King of the Hill con zonas configurables, recompensas automáticas y estadísticas de jugadores.',
        paid: true,
        status: 'paid',
        versions: ['1.0.0']
    },
    {
        id: 'zkits',
        name: 'zKits',
        icon: 'fa-box-open',
        shortDesc: 'Gestor de kits con temporizadores.',
        fullDesc: 'Administra kits de inicio, recompensas y eventos. Permite editar items en tiempo real y cooldowns por jugador.',
        paid: false,
        status: 'free',
        versions: ['1.0.0']
    },
    {
        id: 'zclans',
        name: 'zClans',
        icon: 'fa-flag',
        shortDesc: 'Sistema completo de clanes y guerras.',
        fullDesc: 'zClans ofrece un sistema de clanes con alianzas, guerras territoriales, ranking global y eventos exclusivos.',
        paid: false,
        status: 'free',
        versions: ['1.0.0']
    },
    {
        id: 'zapi',
        name: 'zAPI',
        icon: 'fa-code',
        shortDesc: 'API para desarrolladores (en desarrollo).',
        fullDesc: 'zAPI proporciona herramientas para desarrollar plugins compatibles con el ecosistema Zein. Actualmente en fase de desarrollo.',
        paid: false,
        status: 'dev',
        versions: []
    },
    {
        id: 'zhub',
        name: 'zHub',
        icon: 'fa-server',
        shortDesc: 'Central de servidores y lobby.',
        fullDesc: 'zHub es el plugin definitivo para gestionar lobbies y centrales de servidores. Incluye sistema de motd y menús de navegación.',
        paid: true,
        status: 'paid',
        versions: ['1.0.0']
    },
    // ===== NUEVO: zPrefixs (en desarrollo) =====
    {
        id: 'zprefixs',
        name: 'zPrefixs',
        icon: 'fa-tag',
        shortDesc: 'Sistema de prefijos y rangos (en desarrollo).',
        fullDesc: 'zPrefixs permitirá gestionar prefijos personalizados para jugadores, con soporte para rangos, colores y animaciones. Actualmente en fase de desarrollo, no disponible para descarga.',
        paid: false,
        status: 'dev',
        versions: []
    }
];

window.DOWNLOADS_DATA = {
    'zcore': {
        '1.0.0': 'https://cdn.zein.dev/plugins/zcore-1.0.0.jar',
        '1.1.0': 'https://cdn.zein.dev/plugins/zcore-1.1.0.jar'
    },
    'zshop': {
        '1.0.0': 'https://cdn.zein.dev/plugins/zshop-1.0.0.jar'
    },
    'zkoth': {
        '1.0.0': 'https://cdn.zein.dev/plugins/zkoth-1.0.0.jar'
    },
    'zkits': {
        '1.0.0': 'https://cdn.zein.dev/plugins/zkits-1.0.0.jar'
    },
    'zclans': {
        '1.0.0': 'https://cdn.zein.dev/plugins/zclans-1.0.0.jar'
    },
    'zapi': {},
    'zhub': {
        '1.0.0': 'https://cdn.zein.dev/plugins/zhub-1.0.0.jar'
    },
    'zprefixs': {} // Sin enlaces de descarga por estar en desarrollo
};
