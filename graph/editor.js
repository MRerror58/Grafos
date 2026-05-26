/**
 * Editor Module - Creates and edits graphs using browser memory.
 *
 * Uses the Module Pattern (IIFE: Immediately Invoked Function Expression).
 * Why?: To encapsulate internal variables and avoid mixing editor data with
 * visualizer data.
 */
const Editor = (() => {
    // Main object representing the graph currently being edited.
    let currentGraph = {
        name: '',
        type: 'undirected', // Can be 'undirected' or 'directed'.
        weighted: false,    // Indicates whether edges have a numeric weight/value.
        nodes: [],          // Empty array that stores points (nodes).
        edges: []           // Empty array that stores lines (edges).
    };

    // Counter used to generate unique automatic node IDs (example: n1, n2, n3).
    let nodeIdCounter = 0;

    /**
     * Function: init
     * What does it receive?: Nothing.
     * What does it do?: Starts the editor, assigns button events, loads saved graphs,
     * and shows the initial empty preview.
     * What does it return?: Nothing.
     */
    function init() {
        bindEvents();
        loadSavedGraphsList();
        updatePreview();

        // Initialize TXT file import/export handlers from Requerimientos module
        Requerimientos.initTxtEvents();
    }

    /**
     * Function: bindEvents
     * What does it receive?: Nothing.
     * What does it do?: Connects HTML controls with JavaScript event listeners.
     * What does it return?: Nothing.
     */
    function bindEvents() {
        // Main button clicks.
        document.getElementById('btn-add-node').addEventListener('click', addNode);
        document.getElementById('btn-add-edge').addEventListener('click', addEdge);
        document.getElementById('btn-save-graph').addEventListener('click', saveGraph);
        document.getElementById('btn-clear-form').addEventListener('click', clearForm);

        // The 'change' event runs when a select menu changes value.
        document.getElementById('graph-weighted').addEventListener('change', function () {
            currentGraph.weighted = this.value === 'yes';
            // Modifies CSS directly with JS (.style.display).
            document.getElementById('weight-group').style.display = this.value === 'yes' ? 'flex' : 'none';
        });

        // Event for directed/undirected graph type changes.
        document.getElementById('graph-type').addEventListener('change', function () {
            currentGraph.type = this.value;
            updatePreview();
        });

        // Keyboard shortcuts for adding items with Enter.
        document.getElementById('node-label').addEventListener('keydown', e => {
            if (e.key === 'Enter') addNode();
        });
        document.getElementById('edge-weight').addEventListener('keydown', e => {
            if (e.key === 'Enter') addEdge();
        });
    }

    // ===== NODE MANAGEMENT =====

    /**
     * Function: addNode
     * What does it receive?: Nothing.
     * What does it do?: Reads the user's label/color, validates the data, creates a node,
     * and stores it in the current graph.
     * What does it return?: Nothing.
     */
    function addNode() {
        const labelInput = document.getElementById('node-label');
        const colorInput = document.getElementById('node-color');

        // .trim() removes accidental spaces at the beginning or end.
        const label = labelInput.value.trim();

        if (!label) {
            showToast('Ingresa una etiqueta para el nodo', 'error'); // Function defined in: graph/utils.js
            labelInput.focus();
            return;
        }

        // find() searches the array for an item with the same label.
        if (currentGraph.nodes.find(n => n.label.toLowerCase() === label.toLowerCase())) {
            showToast('Ya existe un nodo con esa etiqueta', 'error'); // Function defined in: graph/utils.js
            return;
        }

        // Creates the Node object that travels through the app.
        const node = {
            id: 'n' + (++nodeIdCounter),
            label: label,
            color: colorInput.value
        };

        // .push() adds this object to the end of the array.
        currentGraph.nodes.push(node);
        labelInput.value = '';

        // Updates the visual interface.
        updateNodeSelectors();
        updateNodesList();
        updateSummary();
        updatePreview();

        showToast(`Nodo "${label}" agregado`, 'success'); // Function defined in: graph/utils.js
        labelInput.focus();
    }

    /**
     * Function: removeNode
     * What does it receive?:
     *  - id (text): Internal unique node ID (example: 'n2').
     * What does it do?: Removes the node and every edge connected to it.
     * What does it return?: Nothing.
     */
    function removeNode(id) {
        // filter() creates a new array containing only items that match the condition.
        currentGraph.nodes = currentGraph.nodes.filter(n => n.id !== id);

        // Removes every edge associated with the deleted node.
        currentGraph.edges = currentGraph.edges.filter(e => e.from !== id && e.to !== id);

        // Refreshes the view.
        updateNodeSelectors();
        updateNodesList();
        updateEdgesList();
        updateSummary();
        updatePreview();
    }

    // ===== EDGE MANAGEMENT =====

    /**
     * Function: addEdge
     * What does it receive?: Nothing.
     * What does it do?: Reads the selected origin/destination nodes, validates that the
     * connection is not duplicated, and stores the edge.
     * What does it return?: Nothing.
     */
    function addEdge() {
        const fromSelect = document.getElementById('edge-from');
        const toSelect = document.getElementById('edge-to');
        const weightInput = document.getElementById('edge-weight');

        const from = fromSelect.value;
        const to = toSelect.value;

        if (!from || !to) {
            showToast('Selecciona origen y destino', 'error'); // Function defined in: graph/utils.js
            return;
        }

        // Checks whether the user is trying to create a duplicate connection.
        const duplicate = currentGraph.edges.find(e => {
            if (currentGraph.type === 'undirected') {
                return (e.from === from && e.to === to) || (e.from === to && e.to === from);
            }
            return e.from === from && e.to === to;
        });

        if (duplicate) {
            showToast('Esa arista ya existe', 'error'); // Function defined in: graph/utils.js
            return;
        }

        const edge = { from, to };

        // If the graph supports weights, store the numeric value too.
        if (currentGraph.weighted) {
            edge.weight = parseFloat(weightInput.value) || 1;
        }

        currentGraph.edges.push(edge);

        updateEdgesList();
        updateSummary();
        updatePreview();

        const fromLabel = currentGraph.nodes.find(n => n.id === from)?.label || from;
        const toLabel = currentGraph.nodes.find(n => n.id === to)?.label || to;
        showToast(`Arista ${fromLabel} -> ${toLabel} agregada`, 'success'); // Function defined in: graph/utils.js
    }

    /**
     * Function: removeEdge
     * What does it receive?:
     *  - index (number): Exact edge position in the array (0, 1, 2...).
     * What does it do?: Removes that edge directly.
     * What does it return?: Nothing.
     */
    function removeEdge(index) {
        // splice() modifies the original array by removing elements.
        currentGraph.edges.splice(index, 1);

        updateEdgesList();
        updateSummary();
        updatePreview();
    }

    // ===== SAVE / LOAD =====

    /**
     * Function: saveGraph
     * What does it receive?: Nothing.
     * What does it do?: Validates data before saving. If a graph with the same name
     * exists, it opens a modal asking whether to overwrite it.
     * What does it return?: Nothing.
     */
    function saveGraph() {
        const nameInput = document.getElementById('graph-name');
        const name = nameInput.value.trim();

        if (!name) {
            showToast('Ingresa un nombre para el grafo', 'error'); // Function defined in: graph/utils.js
            nameInput.focus();
            return;
        }

        if (currentGraph.nodes.length === 0) {
            showToast('Agrega al menos un nodo', 'error'); // Function defined in: graph/utils.js
            return;
        }

        currentGraph.name = name;

        // Searches the database (localStorage) through the storage module.
        const existingGraph = Almacenamiento.buscarPorNombre(name); // Function defined in: graph/storage/storage.js

        // If it already exists, open the confirmation modal.
        if (existingGraph) {
            const modal = document.getElementById('confirm-modal');
            document.getElementById('confirm-graph-name').textContent = name;
            modal.classList.remove('hidden');

            const btnCancel = document.getElementById('btn-confirm-cancel');
            const btnOverwrite = document.getElementById('btn-confirm-overwrite');

            // Temporary functions for these buttons.
            const onCancel = () => {
                modal.classList.add('hidden');
                cleanup();
            };

            const onOverwrite = () => {
                modal.classList.add('hidden');
                cleanup();
                // Calls performSave with the exact ID that should be overwritten.
                performSave(existingGraph.id);
            };

            const cleanup = () => {
                btnCancel.removeEventListener('click', onCancel);
                btnOverwrite.removeEventListener('click', onOverwrite);
            };

            btnCancel.addEventListener('click', onCancel);
            btnOverwrite.addEventListener('click', onOverwrite);
            return;
        }

        // If no graph with the same name exists, save as new.
        performSave();
    }

    /**
     * Function: performSave
     * What does it receive?:
     *  - overrideId (text, optional): ID to overwrite. If omitted, it is 'null'.
     * What does it do?: Calls the Storage module to save the work.
     * What does it return?: Nothing.
     */
    function performSave(overrideId = null) {
        // Saves to localStorage.
        Almacenamiento.guardarGrafo(currentGraph, overrideId); // Function defined in: graph/storage/storage.js

        // Refreshes panels.
        loadSavedGraphsList();
        refreshVisualizerSelector();
        showToast(overrideId ? `Grafo "${currentGraph.name}" sobrescrito exitosamente` : `Grafo "${currentGraph.name}" guardado exitosamente`, 'success'); // Function defined in: graph/utils.js
    }

    /**
     * Function: deleteGraph
     * What does it receive?:
     *  - id (text): Graph identifier.
     * What does it do?: Calls the Storage module to delete it and refreshes the list.
     * What does it return?: Nothing.
     */
    function deleteGraph(id) {
        Almacenamiento.eliminarGrafo(id); // Function defined in: graph/storage/storage.js

        loadSavedGraphsList();
        refreshVisualizerSelector();
        showToast('Grafo eliminado', 'info'); // Function defined in: graph/utils.js
    }

    /**
     * Function: loadGraphToEditor
     * What does it receive?:
     *  - id (text): Graph identifier.
     * What does it do?: Loads an old graph from memory into `currentGraph` so it can
     * be edited on screen.
     * What does it return?: Nothing.
     */
    function loadGraphToEditor(id) {
        const graph = Almacenamiento.buscarPorId(id); // Function defined in: graph/storage/storage.js
        if (!graph) return;

        // Clones the found graph into the working area.
        currentGraph = {
            name: graph.name,
            type: graph.type,
            weighted: graph.weighted,
            nodes: [...graph.nodes],
            edges: [...graph.edges]
        };

        // Fills the HTML controls with the old values.
        document.getElementById('graph-name').value = graph.name;
        document.getElementById('graph-type').value = graph.type;
        document.getElementById('graph-weighted').value = graph.weighted ? 'yes' : 'no';
        document.getElementById('weight-group').style.display = graph.weighted ? 'flex' : 'none';

        // Updates the internal ID counter so it keeps growing correctly.
        nodeIdCounter = 0;
        currentGraph.nodes.forEach(n => {
            const num = parseInt(n.id.replace('n', ''));
            if (num > nodeIdCounter) nodeIdCounter = num;
        });

        // Repaints the screen.
        updateNodeSelectors();
        updateNodesList();
        updateEdgesList();
        updateSummary();
        updatePreview();

        showToast(`Grafo "${graph.name}" cargado en el editor`, 'info'); // Function defined in: graph/utils.js
    }

    /**
     * Function: clearForm
     * What does it do?: Resets everything, leaving a blank graph form.
     */
    function clearForm() {
        currentGraph = { name: '', type: 'undirected', weighted: false, nodes: [], edges: [] };
        nodeIdCounter = 0;

        document.getElementById('graph-name').value = '';
        document.getElementById('graph-type').value = 'undirected';
        document.getElementById('graph-weighted').value = 'no';
        document.getElementById('weight-group').style.display = 'none';
        document.getElementById('node-label').value = '';

        updateNodeSelectors();
        updateNodesList();
        updateEdgesList();
        updateSummary();
        updatePreview();
    }

    /**
     * Function: loadGraphObject
     * What does it receive?: A graph object.
     * What does it do?: Loads a graph object directly into currentGraph, sets the ID counter,
     * fills the form controls, and repaints the screen.
     */
    function loadGraphObject(graph) {
        if (!graph) return;

        currentGraph = {
            name: graph.name || '',
            type: graph.type || 'undirected',
            weighted: graph.weighted || false,
            nodes: [...graph.nodes],
            edges: [...graph.edges]
        };

        // Fills the HTML controls with the new values.
        document.getElementById('graph-name').value = currentGraph.name;
        document.getElementById('graph-type').value = currentGraph.type;
        document.getElementById('graph-weighted').value = currentGraph.weighted ? 'yes' : 'no';
        document.getElementById('weight-group').style.display = currentGraph.weighted ? 'flex' : 'none';

        // Reset and recalculate ID counter.
        nodeIdCounter = 0;
        currentGraph.nodes.forEach(n => {
            const num = parseInt(n.id.replace('n', ''));
            if (num > nodeIdCounter) nodeIdCounter = num;
        });

        // Repaints the screen.
        updateNodeSelectors();
        updateNodesList();
        updateEdgesList();
        updateSummary();
        updatePreview();
    }

    /**
     * Function: getCurrentGraph
     * What does it do?: Returns the graph currently being edited in the editor.
     * What does it return?: The currentGraph object.
     */
    function getCurrentGraph() {
        return currentGraph;
    }


    // ===== INTERFACE UPDATES (UI) =====

    /**
     * Function: updateNodeSelectors
     * What does it do?: Builds the `<option>...</option>` HTML needed by the edge
     * origin and destination dropdowns.
     */
    function updateNodeSelectors() {
        const options = currentGraph.nodes.map(n =>
            `<option value="${n.id}">${n.label}</option>`
        ).join('');

        const placeholder = '<option value="">-</option>';
        document.getElementById('edge-from').innerHTML = placeholder + options;
        document.getElementById('edge-to').innerHTML = placeholder + options;
    }

    /**
     * Function: updateNodesList
     * What does it do?: Draws the small chips that represent created nodes.
     */
    function updateNodesList() {
        const container = document.getElementById('nodes-list');
        if (currentGraph.nodes.length === 0) {
            container.innerHTML = '<span class="empty-chip">Sin nodos</span>';
            return;
        }

        container.innerHTML = currentGraph.nodes.map(n => `
            <span class="chip">
                <span class="chip-dot" style="background:${n.color}"></span>
                ${n.label}
                <span class="chip-remove" onclick="Editor.removeNode('${n.id}')" title="Eliminar">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </span>
            </span>
        `).join('');
    }

    /**
     * Function: updateEdgesList
     * What does it do?: Draws the visual list that shows which nodes are connected.
     */
    function updateEdgesList() {
        const container = document.getElementById('edges-list');
        if (currentGraph.edges.length === 0) {
            container.innerHTML = '<span class="empty-chip">Sin aristas</span>';
            return;
        }

        container.innerHTML = currentGraph.edges.map((e, i) => {
            const fromLabel = currentGraph.nodes.find(n => n.id === e.from)?.label || '?';
            const toLabel = currentGraph.nodes.find(n => n.id === e.to)?.label || '?';
            const arrow = currentGraph.type === 'directed' ? '->' : '<->';
            const weightStr = currentGraph.weighted && e.weight !== undefined ? ` (${e.weight})` : '';

            return `
                <span class="chip">
                    ${fromLabel} ${arrow} ${toLabel}${weightStr}
                    <span class="chip-remove" onclick="Editor.removeEdge(${i})" title="Eliminar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </span>
                </span>
            `;
        }).join('');
    }

    /**
     * Function: updateSummary
     * What does it do?: Updates the lower node and edge counters.
     */
    function updateSummary() {
        document.getElementById('summary-nodes').textContent = currentGraph.nodes.length;
        document.getElementById('summary-edges').textContent = currentGraph.edges.length;
    }

    /**
     * Function: updatePreview
     * What does it do?: Manages the preview panel and sends graph data to the visualizer engine.
     */
    function updatePreview() {
        const previewCanvas = document.getElementById('preview-canvas');
        const emptyState = document.getElementById('preview-empty');

        if (currentGraph.nodes.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }

        // Delegates advanced drawing to the visualizer.
        Visualizer.renderPreview(previewCanvas, currentGraph); // Function defined in: graph/visualizer.js
    }

    /**
     * Function: loadSavedGraphsList
     * What does it do?: Reads browser memory and draws the list of saved projects.
     */
    function loadSavedGraphsList() {
        const container = document.getElementById('saved-graphs-list');
        const saved = Almacenamiento.obtenerGrafos(); // Function defined in: graph/storage/storage.js

        if (saved.length === 0) {
            container.innerHTML = `
                <div class="empty-state small">
                    <p>No hay grafos guardados</p>
                </div>
            `;
            return;
        }

        container.innerHTML = saved.map(g => {
            const date = new Date(g.createdAt);
            const dateStr = date.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });

            return `
                <div class="saved-graph-card">
                    <div class="saved-graph-info">
                        <span class="saved-graph-name">${g.name}</span>
                        <span class="saved-graph-meta">
                            <span>${g.nodes.length} nodos</span>
                            <span>${g.edges.length} aristas</span>
                            <span>${dateStr}</span>
                        </span>
                    </div>
                    <div class="saved-graph-actions">
                        <button class="btn btn-sm btn-ghost" onclick="Editor.loadGraphToEditor('${g.id}')" title="Editar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="Editor.visualizeGraph('${g.id}')" title="Visualizar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="Editor.deleteGraph('${g.id}')" title="Eliminar">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Function: visualizeGraph
     * What does it receive?:
     *  - id (text): The saved graph identifier.
     * What does it do?: Loads a graph from memory, moves to the visualizer screen,
     * and asks the visualizer to draw it there.
     * What does it return?: Nothing.
     */
    function visualizeGraph(id) {
        const graph = Almacenamiento.buscarPorId(id); // Function defined in: graph/storage/storage.js
        if (!graph) return;

        Sidebar.navigateTo('visualizer'); // Function defined in: graph/ui/sidebar.js

        setTimeout(() => {
            Visualizer.loadGraph(graph); // Function defined in: graph/visualizer.js
            document.getElementById('graph-selector').value = id;
        }, 100);
    }

    /**
     * Function: refreshVisualizerSelector
     * What does it do?: Rebuilds the dropdown list in the large visualizer screen.
     */
    function refreshVisualizerSelector() {
        const selector = document.getElementById('graph-selector');
        const saved = Almacenamiento.obtenerGrafos(); // Function defined in: graph/storage/storage.js

        selector.innerHTML = '<option value="">- Seleccionar grafo -</option>' +
            saved.map(g => `<option value="${g.id}">${g.name}</option>`).join('');

        // Keep the explicit-view page selector in sync after save/delete.
        ExplicitView.refreshSelector(); // Function defined in: graph/explicit-view.js
    }

    // The final object defines which methods other files can call.
    return {
        init, addNode, removeNode, addEdge, removeEdge,
        saveGraph, deleteGraph, loadGraphToEditor, clearForm,
        visualizeGraph, refreshVisualizerSelector,
        loadGraphObject, getCurrentGraph
    };
})();

// Exposes the module for classic browser scripts and inline handlers.
window.Editor = Editor;
