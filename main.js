/**
 * Main Entry Point - Starts the app and connects global events.
 *
 * This file is the only application bootstrapper. It waits until the browser has
 * read the HTML, renders the sidebar, initializes the visualizer and editor, and
 * wires the global flows that connect both screens.
 */

/**
 * Event: DOMContentLoaded
 * What does it do?: Waits until the browser finishes reading the page HTML.
 * Why does it exist?: If JavaScript searches for an element before the browser has
 * created it, the code would fail.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Renders the sidebar before binding app navigation events.
    Sidebar.render(); // Function defined in: graph/ui/sidebar.js

    // Initializes the visualizer module.
    Visualizer.init(); // Function defined in: graph/visualizer.js

    // Initializes the editor module.
    Editor.init(); // Function defined in: graph/editor.js

    // Fills the dropdown with saved graphs.
    Editor.refreshVisualizerSelector(); // Function defined in: graph/editor.js

    // Gets direct references to interactive HTML elements.
    const selector = document.getElementById('graph-selector');
    const loadBtn = document.getElementById('btn-load-graph');

    // Listens to the 'change' event when the user picks another dropdown option.
    selector.addEventListener('change', () => {
        // Enables or disables the load button depending on whether a valid option is selected.
        loadBtn.disabled = !selector.value;
    });

    // Listens to clicks on the load graph button.
    loadBtn.addEventListener('click', () => {
        const id = selector.value;
        if (!id) return; // If the ID is empty, stops execution.

        // Requests the saved graph from local memory.
        const graph = Almacenamiento.buscarPorId(id); // Function defined in: graph/storage/storage.js
        if (graph) {
            // If found, asks the visualizer to paint it.
            Visualizer.loadGraph(graph); // Function defined in: graph/visualizer.js
        }
    });

    /**
     * Custom global event: 'page-change'
     * What does it do?: Listens to an event emitted when the active tab changes.
     * If the user switches to the visualizer tab, this block makes sure the canvas
     * recalculates its size.
     * Why does it exist?: <canvas> elements need their proportions recalculated when
     * they move from hidden to visible.
     */
    window.addEventListener('page-change', (e) => {
        // 'e.detail.page' contains the page information sent by the sidebar.
        if (e.detail.page === 'visualizer') {
            // Waits briefly so the container has already calculated its final size.
            setTimeout(() => {
                Visualizer.resize(); // Function defined in: graph/visualizer.js
            }, 50);
        }
    });
});
