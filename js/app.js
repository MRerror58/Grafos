/**
 * App Module — Inicializa todos los módulos y conecta eventos globales.
 * 
 * Este archivo es el punto de entrada principal de la aplicación. Se encarga de arrancar 
 * todo cuando la página carga y maneja los flujos principales de la UI.
 */

/**
 * Evento: DOMContentLoaded
 * ¿Qué hace?: Se mantiene "escuchando" hasta que el navegador termina de leer todo el HTML de la página.
 * ¿Por qué existe?: Porque si nuestro código JS intenta buscar un elemento (como un botón) 
 * antes de que el navegador lo haya dibujado, nos dará error.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa el módulo visualizador (Función definida en: dibujarGrafo.js)
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

        // Solicita el grafo guardado en memoria local (Función definida en: almacenamiento.js)
        const graph = Almacenamiento.buscarPorId(id);
        if (graph) {
            // Si lo encuentra, le pide al visualizador que lo pinte (Función definida en: dibujarGrafo.js)
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
                const ctx = canvas.getContext('2d'); // guia-js.md
                ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); // guia-js.md
            }, 50);
        }
    });
});
