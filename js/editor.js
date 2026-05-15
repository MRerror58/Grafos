/**
 * ============================================================
 * EDITOR.JS — Interfaz del editor de grafos
 * ============================================================
 * Este módulo maneja la página del editor donde el usuario:
 * - Configura un grafo (nombre, tipo, ponderado)
 * - Agrega y elimina nodos
 * - Agrega y elimina aristas
 * - Guarda grafos (usa Almacenamiento para los datos)
 * - Ve la lista de grafos guardados
 * - Puede cargar un grafo guardado para editarlo o visualizarlo
 *
 * Depende de:
 * - Almacenamiento (almacenamiento.js) para guardar/leer datos
 * - Visualizer (dibujarGrafo.js) para la preview y visualización
 * - Sidebar (sidebar.js) para navegar entre páginas
 * - showToast (utilidades.js) para mostrar notificaciones
 * ============================================================
 */
const Editor = (function () {

    // ===================================================================
    // ESTADO DEL EDITOR
    // ===================================================================

    // El grafo que se está editando actualmente
    let currentGraph = {
        name: '',
        type: 'undirected',
        weighted: false,
        nodes: [],
        edges: []
    };

    // Contador para generar IDs únicos para cada nodo (n1, n2, n3...)
    let nodeIdCounter = 0;


    // ===================================================================
    // INICIALIZACIÓN
    // ===================================================================

    function init() {
        bindEvents();
        loadSavedGraphsList();
        updatePreview();
    }

    // Conecta todos los botones y campos del formulario con sus funciones
    function bindEvents() {
        // Botones principales
        document.getElementById('btn-add-node').addEventListener('click', addNode);
        document.getElementById('btn-add-edge').addEventListener('click', addEdge);
        document.getElementById('btn-save-graph').addEventListener('click', saveGraph);
        document.getElementById('btn-clear-form').addEventListener('click', clearForm);

        // Cuando cambia "Ponderado", mostrar/ocultar el campo de peso
        document.getElementById('graph-weighted').addEventListener('change', function () {
            currentGraph.weighted = this.value === 'yes';
            document.getElementById('weight-group').style.display =
                this.value === 'yes' ? 'flex' : 'none';
        });

        // Cuando cambia el tipo de grafo, actualizar la preview
        document.getElementById('graph-type').addEventListener('change', function () {
            currentGraph.type = this.value;
            updatePreview();
        });

        // Atajos de teclado: Enter para agregar rápido
        document.getElementById('node-label').addEventListener('keydown', e => {
            if (e.key === 'Enter') addNode();
        });
        document.getElementById('edge-weight').addEventListener('keydown', e => {
            if (e.key === 'Enter') addEdge();
        });
    }


    // ===================================================================
    // AGREGAR Y ELIMINAR NODOS
    // ===================================================================

    function addNode() {
        const labelInput = document.getElementById('node-label');
        const colorInput = document.getElementById('node-color');
        const label = labelInput.value.trim();

        // Validar que la etiqueta no esté vacía
        if (!label) {
            showToast('Ingresa una etiqueta para el nodo', 'error'); // utilidades.js
            labelInput.focus();
            return;
        }

        // Validar que no exista otro nodo con el mismo nombre
        const exists = currentGraph.nodes.find(
            n => n.label.toLowerCase() === label.toLowerCase()
        );
        if (exists) {
            showToast('Ya existe un nodo con esa etiqueta', 'error'); // utilidades.js
            return;
        }

        // Crear el nodo y agregarlo al grafo
        const node = {
            id: 'n' + (++nodeIdCounter),
            label: label,
            color: colorInput.value
        };
        currentGraph.nodes.push(node);

        // Limpiar el campo y actualizar la interfaz
        labelInput.value = '';
        refreshAllUI();
        showToast(`Nodo "${label}" agregado`, 'success'); // utilidades.js
        labelInput.focus();
    }

    function removeNode(id) {
        // Eliminar el nodo
        currentGraph.nodes = currentGraph.nodes.filter(n => n.id !== id);
        // También eliminar todas las aristas que lo usaban
        currentGraph.edges = currentGraph.edges.filter(e => e.from !== id && e.to !== id);
        refreshAllUI();
    }


    // ===================================================================
    // AGREGAR Y ELIMINAR ARISTAS
    // ===================================================================

    function addEdge() {
        const fromSelect = document.getElementById('edge-from');
        const toSelect = document.getElementById('edge-to');
        const weightInput = document.getElementById('edge-weight');
        const from = fromSelect.value;
        const to = toSelect.value;

        // Validar que se seleccionaron ambos nodos
        if (!from || !to) {
            showToast('Selecciona origen y destino', 'error'); // utilidades.js
            return;
        }

        // Validar que la arista no exista ya
        const duplicate = currentGraph.edges.find(e => {
            if (currentGraph.type === 'undirected') {
                // En grafos no dirigidos, A-B es lo mismo que B-A
                return (e.from === from && e.to === to) ||
                       (e.from === to && e.to === from);
            }
            return e.from === from && e.to === to;
        });
        if (duplicate) {
            showToast('Esa arista ya existe', 'error'); // utilidades.js
            return;
        }

        // Crear la arista
        const edge = { from, to };
        if (currentGraph.weighted) {
            edge.weight = parseFloat(weightInput.value) || 1;
        }
        currentGraph.edges.push(edge);

        // Actualizar interfaz y notificar
        refreshAllUI();
        const fromLabel = currentGraph.nodes.find(n => n.id === from)?.label || from;
        const toLabel = currentGraph.nodes.find(n => n.id === to)?.label || to;
        showToast(`Arista ${fromLabel} → ${toLabel} agregada`, 'success'); // utilidades.js
    }

    function removeEdge(index) {
        currentGraph.edges.splice(index, 1);
        refreshAllUI();
    }


    // ===================================================================
    // GUARDAR GRAFO
    // ===================================================================

    function saveGraph() {
        const nameInput = document.getElementById('graph-name');
        const name = nameInput.value.trim();

        // Validaciones básicas
        if (!name) {
            showToast('Ingresa un nombre para el grafo', 'error'); // utilidades.js
            nameInput.focus();
            return;
        }
        if (currentGraph.nodes.length === 0) {
            showToast('Agrega al menos un nodo', 'error'); // utilidades.js
            return;
        }

        // Verificar si ya existe un grafo con ese nombre
        const existing = Almacenamiento.buscarPorNombre(name); // almacenamiento.js

        if (existing) {
            // Mostrar modal de confirmación para sobrescribir
            showOverwriteModal(name, existing.id);
        } else {
            // Guardar directamente
            doSave(name);
        }
    }

    // Muestra el modal preguntando si quiere sobrescribir
    function showOverwriteModal(name, existingId) {
        const modal = document.getElementById('confirm-modal');
        document.getElementById('confirm-graph-name').textContent = name;
        modal.classList.remove('hidden');

        const btnCancel = document.getElementById('btn-confirm-cancel');
        const btnOverwrite = document.getElementById('btn-confirm-overwrite');

        // Funciones para los botones del modal
        const onCancel = () => {
            modal.classList.add('hidden');
            cleanup();
        };
        const onOverwrite = () => {
            modal.classList.add('hidden');
            cleanup();
            doSave(name, existingId);
        };
        const cleanup = () => {
            btnCancel.removeEventListener('click', onCancel);
            btnOverwrite.removeEventListener('click', onOverwrite);
        };

        btnCancel.addEventListener('click', onCancel);
        btnOverwrite.addEventListener('click', onOverwrite);
    }

    // Ejecuta el guardado real usando Almacenamiento
    function doSave(name, overrideId = null) {
        const graphToSave = {
            name: name,
            type: document.getElementById('graph-type').value,
            weighted: document.getElementById('graph-weighted').value === 'yes',
            nodes: [...currentGraph.nodes],
            edges: [...currentGraph.edges]
        };

        Almacenamiento.guardarGrafo(graphToSave, overrideId); // almacenamiento.js
        loadSavedGraphsList();
        refreshVisualizerSelector();

        const msg = overrideId
            ? `Grafo "${name}" sobrescrito exitosamente`
            : `Grafo "${name}" guardado exitosamente`;
        showToast(msg, 'success'); // utilidades.js
    }


    // ===================================================================
    // ELIMINAR Y CARGAR GRAFOS GUARDADOS
    // ===================================================================

    function deleteGraph(id) {
        Almacenamiento.eliminarGrafo(id); // almacenamiento.js
        loadSavedGraphsList();
        refreshVisualizerSelector();
        showToast('Grafo eliminado', 'info'); // utilidades.js
    }

    // Carga un grafo guardado en el formulario del editor para editarlo
    function loadGraphToEditor(id) {
        const graph = Almacenamiento.buscarPorId(id); // almacenamiento.js
        if (!graph) return;

        // Copiar los datos al estado del editor
        currentGraph = {
            name: graph.name,
            type: graph.type,
            weighted: graph.weighted,
            nodes: [...graph.nodes],
            edges: [...graph.edges]
        };

        // Llenar los campos del formulario
        document.getElementById('graph-name').value = graph.name;
        document.getElementById('graph-type').value = graph.type;
        document.getElementById('graph-weighted').value = graph.weighted ? 'yes' : 'no';
        document.getElementById('weight-group').style.display = graph.weighted ? 'flex' : 'none';

        // Actualizar el contador de IDs para que los nuevos nodos no repitan
        nodeIdCounter = 0;
        currentGraph.nodes.forEach(n => {
            const num = parseInt(n.id.replace('n', ''));
            if (num > nodeIdCounter) nodeIdCounter = num;
        });

        refreshAllUI();
        showToast(`Grafo "${graph.name}" cargado en el editor`, 'info'); // utilidades.js
    }

    // Abre un grafo guardado directamente en el visualizador
    function visualizeGraph(id) {
        const graph = Almacenamiento.buscarPorId(id); // almacenamiento.js
        if (!graph) return;

        // Cambiar a la página del visualizador
        Sidebar.navigateTo('visualizer'); // sidebar.js

        // Esperar un poco para que la página se muestre antes de cargar el grafo
        setTimeout(() => {
            Visualizer.loadGraph(graph); // dibujarGrafo.js
            document.getElementById('graph-selector').value = id;
        }, 100);
    }


    // ===================================================================
    // LIMPIAR FORMULARIO
    // ===================================================================

    function clearForm() {
        currentGraph = {
            name: '', type: 'undirected', weighted: false,
            nodes: [], edges: []
        };
        nodeIdCounter = 0;

        document.getElementById('graph-name').value = '';
        document.getElementById('graph-type').value = 'undirected';
        document.getElementById('graph-weighted').value = 'no';
        document.getElementById('weight-group').style.display = 'none';
        document.getElementById('node-label').value = '';

        refreshAllUI();
    }


    // ===================================================================
    // ACTUALIZACIONES DE LA INTERFAZ
    // ===================================================================

    // Actualiza todo de una vez (útil después de cualquier cambio)
    function refreshAllUI() {
        updateNodeSelectors();
        updateNodesList();
        updateEdgesList();
        updateSummary();
        updatePreview();
    }

    // Actualiza los selectores de "origen" y "destino" para agregar aristas
    function updateNodeSelectors() {
        const options = currentGraph.nodes.map(n =>
            `<option value="${n.id}">${n.label}</option>`
        ).join('');
        const placeholder = '<option value="">—</option>';
        document.getElementById('edge-from').innerHTML = placeholder + options;
        document.getElementById('edge-to').innerHTML = placeholder + options;
    }

    // Actualiza la lista visual de nodos (los chips con colorcito)
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

    // Actualiza la lista visual de aristas
    function updateEdgesList() {
        const container = document.getElementById('edges-list');
        if (currentGraph.edges.length === 0) {
            container.innerHTML = '<span class="empty-chip">Sin aristas</span>';
            return;
        }
        container.innerHTML = currentGraph.edges.map((e, i) => {
            const fromLabel = currentGraph.nodes.find(n => n.id === e.from)?.label || '?';
            const toLabel = currentGraph.nodes.find(n => n.id === e.to)?.label || '?';
            const arrow = currentGraph.type === 'directed' ? '→' : '↔';
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

    // Actualiza los contadores de nodos y aristas
    function updateSummary() {
        document.getElementById('summary-nodes').textContent = currentGraph.nodes.length;
        document.getElementById('summary-edges').textContent = currentGraph.edges.length;
    }

    // Actualiza la mini-preview del grafo
    function updatePreview() {
        const previewCanvas = document.getElementById('preview-canvas');
        const emptyState = document.getElementById('preview-empty');

        if (currentGraph.nodes.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }

        Visualizer.renderPreview(previewCanvas, currentGraph); // dibujarGrafo.js
    }

    // Muestra la lista de grafos guardados en el panel derecho del editor
    function loadSavedGraphsList() {
        const container = document.getElementById('saved-graphs-list');
        const saved = Almacenamiento.obtenerGrafos(); // almacenamiento.js

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
            const dateStr = date.toLocaleDateString('es', {
                day: '2-digit', month: 'short', year: 'numeric'
            });
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

    // Actualiza el selector de grafos en la página del visualizador
    function refreshVisualizerSelector() {
        const selector = document.getElementById('graph-selector');
        const saved = Almacenamiento.obtenerGrafos(); // almacenamiento.js
        selector.innerHTML = '<option value="">— Seleccionar grafo —</option>' +
            saved.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    }


    // Lo que otros archivos pueden usar de este módulo
    return {
        init, addNode, removeNode, addEdge, removeEdge,
        saveGraph, deleteGraph, loadGraphToEditor, clearForm,
        visualizeGraph, refreshVisualizerSelector
    };

})();
