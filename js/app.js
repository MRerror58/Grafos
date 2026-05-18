/**
 * App Module — Inicializa todos los módulos y conecta eventos globales.
 * 
 * Este archivo es el punto de entrada principal de la aplicación. Se encarga de arrancar 
 * todo cuando la página carga y de proveer utilidades globales como las notificaciones flotantes (Toasts).
 */

/**
 * Función: showToast
 * ¿Qué recibe?: 
 *  - message (texto): El mensaje a mostrar en pantalla.
 *  - type (texto): El tipo de mensaje ('info', 'success', 'error'). Por defecto es 'info'.
 * ¿Qué hace?: Crea dinámicamente un elemento HTML (una notificación flotante),
 * añade el icono según su tipo, lo inserta en la página 
 * y programa su eliminación automática después de unos segundos.
 * ¿Qué devuelve?: Nada (undefined).
 * ¿Por qué existe?: Para dar retroalimentación visual al usuario en tiempo real 
 * (ej: "Grafo guardado con éxito" o "Error al añadir arista").
 */
function showToast(message, type = 'info') {
    // Busca en el HTML (DOM) el de los mensajes
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
    // Nota: "icons[type] || icons.info" si no existe "icons[type]" usa "icons.info"
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
 * Evento: DOMContentLoaded
 * ¿Qué hace?: Se mantiene "escuchando" hasta que el navegador termina de leer todo el HTML de la página.
 * ¿Por qué existe?: Porque si nuestro código JS intenta buscar un elemento (como un botón) 
 * antes de que el navegador lo haya dibujado, nos dará error.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa el módulo visualizador (Función definida en: visualizer.js)
    Visualizer.init();

    // Inicializa el módulo editor (Función definida en: editor.js)
    Editor.init();

    // Llena el menú desplegable con los grafos guardados (Función definida en: editor.js)
    Editor.refreshVisualizerSelector();

    // Obtiene referencias directas a elementos interactivos del HTML
    const selector = document.getElementById('graph-selector');
    const loadBtn = document.getElementById('btn-load-graph');

    // Escucha el evento 'change' (cuando el usuario escoge otra opción en el desplegable)
    selector.addEventListener('change', () => {
        // Habilita o deshabilita el botón de carga dependiendo de si hay una opción válida seleccionada
        loadBtn.disabled = !selector.value;
    });

    // Escucha el evento 'click' en el botón de cargar grafo
    loadBtn.addEventListener('click', () => {
        const id = selector.value;
        if (!id) return; // Si el id está vacío, detiene la ejecución

        // Solicita la lista de grafos guardados en memoria local (Función definida en: editor.js)
        const saved = Editor.getSavedGraphs();

        // Busca en la lista el grafo específico cuyo ID coincida con la selección
        const graph = saved.find(g => g.id === id);
        if (graph) {
            // Si lo encuentra, le pide al visualizador que lo pinte (Función definida en: visualizer.js)
            Visualizer.loadGraph(graph);
        }
    });

    /**
     * Evento global personalizado: 'page-change'
     * ¿Qué hace?: Escucha un evento que nuestro propio código dispara cuando cambia la pestaña activa.
     * Si el usuario se cambia a la pestaña del 'visualizer', este bloque se asegura de que 
     * el lienzo de dibujo (canvas) ajuste su tamaño a la pantalla.
     * ¿Por qué existe?: Porque los elementos <canvas> necesitan que se recalculen sus proporciones 
     * explícitamente cuando pasan de estar ocultos a estar visibles.
     */
    window.addEventListener('page-change', (e) => {
        // 'e.detail.page' contiene información del evento enviado por el sidebar
        if (e.detail.page === 'visualizer') {
            // Espera un instante (50ms) para asegurarse de que el contenedor ya calculó su tamaño final
            setTimeout(() => {
                const canvas = document.getElementById('graph-canvas');
                const parent = canvas.parentElement;

                // Ajusta las propiedades internas del canvas multiplicadas por el devicePixelRatio
                // para que los gráficos se vean nítidos en pantallas de alta resolución (Retina)
                canvas.width = parent.clientWidth * devicePixelRatio;
                canvas.height = parent.clientHeight * devicePixelRatio;

                // Ajusta las propiedades de estilo visual del canvas
                canvas.style.width = parent.clientWidth + 'px';
                canvas.style.height = parent.clientHeight + 'px';

                // Le indica al "pincel" del canvas (contexto) que trabaje con la nueva escala de píxeles
                const ctx = canvas.getContext('2d');
                ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
            }, 50);
        }
    });
});
