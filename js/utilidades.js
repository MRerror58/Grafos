/**
 * Utilidades Module — Funciones auxiliares globales usadas en toda la app.
 * 
 * Este archivo contiene funciones pequeñas y reutilizables que otros módulos necesitan,
 * como el sistema de notificaciones y la conversión de colores para el canvas.
 * ¿Por qué?: Para evitar duplicar el mismo código en varios archivos.
 */

/**
 * Función: showToast
 * ¿Qué recibe?: 
 *  - message (texto): El mensaje a mostrar en pantalla.
 *  - type (texto): El tipo de mensaje ('info', 'success', 'error'). Por defecto es 'info'.
 * ¿Qué hace?: Crea dinámicamente un elemento HTML (una notificación flotante),
 * le añade el icono correspondiente según su tipo, lo inserta en la página 
 * y programa su eliminación automática después de unos segundos.
 * ¿Qué devuelve?: Nada (undefined).
 * ¿Por qué existe?: Para dar retroalimentación visual al usuario en tiempo real.
 */
function showToast(message, type = 'info') {
    // Busca en el HTML (DOM) el contenedor para los mensajes
    const container = document.getElementById('toast-container');

    // Crea un nuevo elemento div en memoria para el mensaje
    const toast = document.createElement('div');
    // Le asigna las clases CSS para darle color y forma
    toast.className = `toast toast-${type}`;

    // Diccionario de iconos en formato SVG según el tipo de notificación
    const icons = {
        success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
        error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4d6a" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    // Inserta el código HTML interno del toast (icono + texto del mensaje)
    toast.innerHTML = `${icons[type] || icons.info}<span>${message}</span>`;
    // Añade el toast al contenedor visible en la página
    container.appendChild(toast);

    // setTimeout ejecuta una función de forma retrasada (espera 3000 milisegundos = 3 segundos)
    setTimeout(() => {
        // Aplica una animación CSS de salida
        toast.style.animation = 'toastOut 0.3s ease forwards';
        // Espera otros 300ms (lo que dura la animación) para eliminar definitivamente el elemento
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Función: hexToRgba
 * ¿Qué recibe?: 
 *  - hex (texto): Un color en formato hexadecimal (ej: '#FF00AA').
 *  - alpha (número decimal): El nivel de transparencia (0 a 1).
 * ¿Qué hace?: Extrae los componentes de color (Rojo, Verde, Azul) y los mezcla 
 * con la transparencia solicitada.
 * ¿Qué devuelve?: Un texto en formato 'rgba(r,g,b,a)' que el canvas entiende.
 * ¿Por qué existe?: Para dibujar nodos con brillo y transparencia en el canvas.
 */
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
