/**
 * ============================================================
 * UTILIDADES.JS — Funciones auxiliares usadas en toda la app
 * ============================================================
 * Este archivo contiene funciones pequeñas y reutilizables
 * que otros módulos necesitan: notificaciones y colores.
 *
 * ¿Por qué están separadas? Porque se usan desde varios
 * archivos diferentes (editor, visualizador, app).
 * ============================================================
 */

// --- NOTIFICACIONES (TOASTS) ---
// Muestra un mensaje temporal en la esquina inferior derecha.
// Tipos disponibles: 'success' (verde), 'error' (rojo), 'info' (azul).
// Ejemplo: showToast('Nodo agregado', 'success')
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Iconos SVG para cada tipo de notificación
    const icons = {
        success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
        error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4d6a" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
    container.appendChild(toast);

    // El toast desaparece solo después de 3 segundos
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


// --- CONVERSIÓN DE COLORES ---
// Convierte un color hexadecimal (#FF00AA) a formato rgba con transparencia.
// Se usa para dibujar nodos con brillo y transparencia en el canvas.
// Ejemplo: hexToRgba('#6C63FF', 0.5) → 'rgba(108,99,255,0.5)'
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
