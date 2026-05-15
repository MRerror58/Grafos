/**
 * ============================================================
 * APP.JS — Punto de entrada de la aplicación
 * ============================================================
 * Este archivo inicializa todos los módulos y conecta los
 * eventos globales que no pertenecen a un módulo específico.
 *
 * Orden de carga de los scripts (importante):
 * 1. utilidades.js    → Funciones auxiliares (showToast, hexToRgba)
 * 2. almacenamiento.js → Datos en localStorage
 * 3. sidebar.js        → Navegación lateral
 * 4. dibujarGrafo.js   → Canvas y visualización (módulo Visualizer)
 * 5. editor.js         → Editor de grafos (módulo Editor)
 * 6. app.js            → Este archivo (inicialización)
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => { //Esto se trata como objetos, ocurre con todos los JS

    // --- Inicializar módulos ---
    Visualizer.init(); // dibujarGrafo.js
    Editor.init(); // editor.js

    // Llenar el selector de grafos en la página del visualizador
    Editor.refreshVisualizerSelector(); // editor.js


    // --- Conectar el selector de grafos con el botón "Visualizar" ---
    const selector = document.getElementById('graph-selector');
    const loadBtn = document.getElementById('btn-load-graph');

    // Se añade la funcion pero no se ejcuta: Activar/desactivar en el botón de visualizacios
    selector.addEventListener('change', () => {
        loadBtn.disabled = !selector.value;
    });

    // Se filtra si hay un grafo seleccionado
    loadBtn.addEventListener('click', () => {
        const id = selector.value;
        if (!id) return;

        const graph = Almacenamiento.buscarPorId(id); // almacenamiento.js
        if (graph) {
            Visualizer.loadGraph(graph); // dibujarGrafo.js
        }
    });


    // --- Ajustar el canvas cuando se cambia a la página del visualizador ---
    // (Necesario porque el canvas no puede calcular su tamaño si está oculto)
    window.addEventListener('page-change', (e) => {
        if (e.detail.page === 'visualizer') {
            setTimeout(() => {
                const canvas = document.getElementById('graph-canvas');
                const parent = canvas.parentElement;
                canvas.width = parent.clientWidth * devicePixelRatio;
                canvas.height = parent.clientHeight * devicePixelRatio;
                canvas.style.width = parent.clientWidth + 'px';
                canvas.style.height = parent.clientHeight + 'px';
                const ctx = canvas.getContext('2d');
                ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
            }, 50);
        }
    });

});
