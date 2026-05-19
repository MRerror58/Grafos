/**
 * Editor Module — Permite crear y editar grafos usando la memoria del navegador.
 * 
 * Utiliza el Patrón Módulo (IIFE: Immediately Invoked Function Expression).
 * ¿Por qué?: Para encapsular (proteger) sus variables internas y no mezclar
 * la información del editor con la del visualizador.
 */
const Editor = (() => {
    // Objeto principal que representa el grafo que se está editando en este momento
    let currentGraph = {
        name: '',
        type: 'undirected', // Puede ser 'undirected' (no dirigido) o 'directed' (dirigido)
        weighted: false,    // Indica si las conexiones tienen un peso/valor numérico
        nodes: [],          // Arreglo vacío que guardará los puntos (nodos)
        edges: []           // Arreglo vacío que guardará las líneas (aristas)
    };

    // Contador que se usa para generar IDs únicos y automáticos para los nodos (ej: n1, n2, n3)
    let nodeIdCounter = 0;

    /**
     * Función: init
     * ¿Qué recibe?: Nada.
     * ¿Qué hace?: Es la función de arranque del editor. Asigna los eventos a los botones, 
     * carga la lista de grafos guardados y muestra la vista previa inicial (vacía).
     * ¿Qué devuelve?: Nada.
     * ¿Por qué existe?: Para preparar la herramienta de edición en cuanto la página carga.
     */
    function init() {
        bindEvents();
        loadSavedGraphsList();
        updatePreview();
    }

    /**
     * Función: bindEvents
     * ¿Qué recibe?: Nada.
     * ¿Qué hace?: Conecta el HTML con JavaScript. Busca elementos por su ID y les 
     * asigna "escuchadores" (event listeners) para saber cuándo el usuario hace clic o teclea.
     * ¿Qué devuelve?: Nada.
     * ¿Por qué existe?: Es una buena práctica agrupar todos los eventos en un solo lugar.
     */
    function bindEvents() {
        // Clics en botones principales
        document.getElementById('btn-add-node').addEventListener('click', addNode);
        document.getElementById('btn-add-edge').addEventListener('click', addEdge);
        document.getElementById('btn-save-graph').addEventListener('click', saveGraph);
        document.getElementById('btn-clear-form').addEventListener('click', clearForm);

        // Evento 'change' se activa cuando un menú desplegable (select) cambia su valor.
        document.getElementById('graph-weighted').addEventListener('change', function() {
            currentGraph.weighted = this.value === 'yes';
            // Modificamos CSS directamente usando JS (.style.display)
            document.getElementById('weight-group').style.display = this.value === 'yes' ? 'flex' : 'none';
        });

        // Evento cuando se cambia el tipo de grafo (dirigido/no dirigido)
        document.getElementById('graph-type').addEventListener('change', function() {
            currentGraph.type = this.value;
            updatePreview(); // Volvemos a dibujar la previsualización porque las líneas cambian
        });

        // Atajos de teclado para agregar con "Enter"
        document.getElementById('node-label').addEventListener('keydown', e => {
            if (e.key === 'Enter') addNode();
        });
        document.getElementById('edge-weight').addEventListener('keydown', e => {
            if (e.key === 'Enter') addEdge();
        });
    }

    // ===== GESTIÓN DE NODOS =====

    /**
     * Función: addNode
     * ¿Qué recibe?: Nada.
     * ¿Qué hace?: Lee lo que el usuario escribió (nombre y color), verifica que no existan errores, 
     * crea un nuevo objeto que representa al nodo y lo guarda en el arreglo global.
     * ¿Qué devuelve?: Nada.
     * ¿Por qué existe?: Es el núcleo de la creación de datos del grafo.
     */
    function addNode() {
        const labelInput = document.getElementById('node-label');
        const colorInput = document.getElementById('node-color');
        
        // .trim() limpia los espacios en blanco accidentales que el usuario haya puesto al principio o final
        const label = labelInput.value.trim();

        if (!label) {
            showToast('Ingresa una etiqueta para el nodo', 'error'); // Función definida en: utilidades.js
            labelInput.focus();
            return;
        }

        // El método find() recorre el arreglo buscando uno con la misma etiqueta
        if (currentGraph.nodes.find(n => n.label.toLowerCase() === label.toLowerCase())) {
            showToast('Ya existe un nodo con esa etiqueta', 'error'); // Función definida en: utilidades.js
            return;
        }

        // Se crea el "Objeto Nodo" que viajará por todo el código
        const node = {
            id: 'n' + (++nodeIdCounter), 
            label: label,
            color: colorInput.value
        };

        // .push() mete este nuevo objeto al final del arreglo
        currentGraph.nodes.push(node);
        labelInput.value = ''; // Limpiamos la cajita de texto para el próximo

        // Mandamos a actualizar la interfaz gráfica
        updateNodeSelectors();
        updateNodesList();
        updateSummary();
        updatePreview();
        
        showToast(`Nodo "${label}" agregado`, 'success'); // Función definida en: utilidades.js
        labelInput.focus();
    }

    /**
     * Función: removeNode
     * ¿Qué recibe?: 
     *  - id (texto): El identificador único interno del nodo (ej: 'n2').
     * ¿Qué hace?: Borra el nodo de la lista, pero también es responsable de borrar las conexiones
     * (aristas) que estaban enganchadas a ese nodo.
     * ¿Qué devuelve?: Nada.
     */
    function removeNode(id) {
        // filter() crea un nuevo arreglo que SOLO contiene los elementos que cumplen la condición.
        currentGraph.nodes = currentGraph.nodes.filter(n => n.id !== id);
        
        // Hacemos lo mismo con las aristas: eliminamos aquellas asociadas al nodo borrado.
        currentGraph.edges = currentGraph.edges.filter(e => e.from !== id && e.to !== id);
        
        // Refrescamos la vista
        updateNodeSelectors();
        updateNodesList();
        updateEdgesList();
        updateSummary();
        updatePreview();
    }

    // ===== GESTIÓN DE ARISTAS =====

    /**
     * Función: addEdge
     * ¿Qué recibe?: Nada.
     * ¿Qué hace?: Toma los dos nodos seleccionados, verifica que la línea entre ellos no se haya 
     * dibujado antes, y añade el objeto a la lista de aristas.
     * ¿Qué devuelve?: Nada.
     */
    function addEdge() {
        const fromSelect = document.getElementById('edge-from');
        const toSelect = document.getElementById('edge-to');
        const weightInput = document.getElementById('edge-weight');

        const from = fromSelect.value;
        const to = toSelect.value;

        if (!from || !to) {
            showToast('Selecciona origen y destino', 'error'); // Función definida en: utilidades.js
            return;
        }

        // Revisar si el usuario intenta crear una conexión duplicada
        const duplicate = currentGraph.edges.find(e => {
            if (currentGraph.type === 'undirected') {
                return (e.from === from && e.to === to) || (e.from === to && e.to === from);
            }
            return e.from === from && e.to === to;
        });

        if (duplicate) {
            showToast('Esa arista ya existe', 'error'); // Función definida en: utilidades.js
            return;
        }

        const edge = { from, to };
        
        // Si el grafo soporta "pesos" (distancias, costos), lo guardamos también
        if (currentGraph.weighted) {
            edge.weight = parseFloat(weightInput.value) || 1;
        }

        currentGraph.edges.push(edge);
        
        updateEdgesList();
        updateSummary();
        updatePreview();

        const fromLabel = currentGraph.nodes.find(n => n.id === from)?.label || from;
        const toLabel = currentGraph.nodes.find(n => n.id === to)?.label || to;
        showToast(`Arista ${fromLabel} → ${toLabel} agregada`, 'success'); // Función definida en: utilidades.js
    }

    /**
     * Función: removeEdge
     * ¿Qué recibe?: 
     *  - index (número): La posición exacta de la arista en el arreglo (0, 1, 2...).
     * ¿Qué hace?: Elimina esa arista directamente.
     * ¿Qué devuelve?: Nada.
     */
    function removeEdge(index) {
        // splice() modifica el arreglo original eliminando elementos.
        currentGraph.edges.splice(index, 1);
        
        updateEdgesList();
        updateSummary();
        updatePreview();
    }

    // ===== GUARDAR / CARGAR =====

    /**
     * Función: saveGraph
     * ¿Qué recibe?: Nada.
     * ¿Qué hace?: Valida los datos antes de guardar. Si el usuario escribe un nombre 
     * que ya existe, pausa todo y abre un panel (modal) preguntando si desea sobreescribir.
     * ¿Qué devuelve?: Nada.
     */
    function saveGraph() {
        const nameInput = document.getElementById('graph-name');
        const name = nameInput.value.trim();

        if (!name) {
            showToast('Ingresa un nombre para el grafo', 'error'); // Función definida en: utilidades.js
            nameInput.focus();
            return;
        }

        if (currentGraph.nodes.length === 0) {
            showToast('Agrega al menos un nodo', 'error'); // Función definida en: utilidades.js
            return;
        }

        currentGraph.name = name; // Guardamos el nombre en el grafo actual

        // Buscar en la base de datos (localStorage) usando el módulo de almacenamiento
        const existingGraph = Almacenamiento.buscarPorNombre(name); // Función definida en: almacenamiento.js

        // Si ya existe, abrimos la ventana de confirmación (Modal)
        if (existingGraph) {
            const modal = document.getElementById('confirm-modal');
            document.getElementById('confirm-graph-name').textContent = name;
            modal.classList.remove('hidden'); // Hacer visible la ventana

            const btnCancel = document.getElementById('btn-confirm-cancel');
            const btnOverwrite = document.getElementById('btn-confirm-overwrite');

            // Funciones temporales para estos botones
            const onCancel = () => {
                modal.classList.add('hidden');
                cleanup();
            };

            const onOverwrite = () => {
                modal.classList.add('hidden');
                cleanup();
                // Llama a performSave indicándole específicamente cuál ID debe sobreescribir
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

        // Si no existía uno igual, se guarda directamente como nuevo
        performSave();
    }

    /**
     * Función: performSave
     * ¿Qué recibe?: 
     *  - overrideId (texto, opcional): ID a sobreescribir. Si no se manda, es 'null'.
     * ¿Qué hace?: Llama al módulo de Almacenamiento para guardar el trabajo.
     * ¿Qué devuelve?: Nada.
     */
    function performSave(overrideId = null) {
        // Guarda en localStorage (Función definida en: almacenamiento.js)
        Almacenamiento.guardarGrafo(currentGraph, overrideId);

        // Refrescamos paneles
        loadSavedGraphsList();
        refreshVisualizerSelector();
        showToast(overrideId ? `Grafo "${currentGraph.name}" sobrescrito exitosamente` : `Grafo "${currentGraph.name}" guardado exitosamente`, 'success'); // Función definida en: utilidades.js
    }

    /**
     * Función: deleteGraph
     * ¿Qué recibe?: 
     *  - id (texto): El identificador del grafo a borrar.
     * ¿Qué hace?: Llama al módulo Almacenamiento para borrarlo y refresca la lista.
     * ¿Qué devuelve?: Nada.
     */
    function deleteGraph(id) {
        Almacenamiento.eliminarGrafo(id); // Función definida en: almacenamiento.js
        
        loadSavedGraphsList();
        refreshVisualizerSelector();
        showToast('Grafo eliminado', 'info'); // Función definida en: utilidades.js
    }

    /**
     * Función: loadGraphToEditor
     * ¿Qué recibe?: 
     *  - id (texto): Identificador del grafo.
     * ¿Qué hace?: Trae un grafo viejo desde la memoria hacia las variables en vivo 
     * (`currentGraph`) para poder seguir trabajándolo en pantalla.
     * ¿Qué devuelve?: Nada.
     */
    function loadGraphToEditor(id) {
        const graph = Almacenamiento.buscarPorId(id); // Función definida en: almacenamiento.js
        if (!graph) return;

        // Clonamos el grafo encontrado hacia nuestra área de trabajo
        currentGraph = {
            name: graph.name,
            type: graph.type,
            weighted: graph.weighted,
            nodes: [...graph.nodes],
            edges: [...graph.edges]
        };

        // Rellenamos el HTML con los valores antiguos
        document.getElementById('graph-name').value = graph.name;
        document.getElementById('graph-type').value = graph.type;
        document.getElementById('graph-weighted').value = graph.weighted ? 'yes' : 'no';
        document.getElementById('weight-group').style.display = graph.weighted ? 'flex' : 'none';

        // Tenemos que actualizar el contador interno de IDs para que siga creciendo bien.
        nodeIdCounter = 0;
        currentGraph.nodes.forEach(n => {
            const num = parseInt(n.id.replace('n', ''));
            if (num > nodeIdCounter) nodeIdCounter = num;
        });

        // Repintamos la pantalla
        updateNodeSelectors();
        updateNodesList();
        updateEdgesList();
        updateSummary();
        updatePreview();
        
        showToast(`Grafo "${graph.name}" cargado en el editor`, 'info'); // Función definida en: utilidades.js
    }

    /**
     * Función: clearForm
     * ¿Qué hace?: Resetea absolutamente todo, dejando la hoja en blanco.
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

    // ===== ACTUALIZACIONES DE INTERFAZ (UI) =====

    /**
     * Función: updateNodeSelectors
     * ¿Qué hace?: Toma la lista de nodos y construye el código HTML `<option>...</option>`
     * necesario para los menús desplegables de conectar aristas.
     */
    function updateNodeSelectors() {
        const options = currentGraph.nodes.map(n =>
            `<option value="${n.id}">${n.label}</option>`
        ).join('');
        
        const placeholder = '<option value="">—</option>';
        document.getElementById('edge-from').innerHTML = placeholder + options;
        document.getElementById('edge-to').innerHTML = placeholder + options;
    }

    /**
     * Función: updateNodesList
     * ¿Qué hace?: Pinta las pequeñas "píldoras" o chips que representan a los nodos creados.
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
     * Función: updateEdgesList
     * ¿Qué hace?: Pinta la lista visual indicando qué nodos están conectados.
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

    /**
     * Función: updateSummary
     * ¿Qué hace?: Actualiza el contador inferior de nodos y aristas.
     */
    function updateSummary() {
        document.getElementById('summary-nodes').textContent = currentGraph.nodes.length;
        document.getElementById('summary-edges').textContent = currentGraph.edges.length;
    }

    /**
     * Función: updatePreview
     * ¿Qué hace?: Administra el pequeño recuadro de previsualización enviándole los 
     * datos del grafo al motor principal del Visualizador.
     */
    function updatePreview() {
        const previewCanvas = document.getElementById('preview-canvas');
        const emptyState = document.getElementById('preview-empty');

        if (currentGraph.nodes.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }

        // Delega la responsabilidad de dibujo avanzado (Función definida en: visualizer.js)
        Visualizer.renderPreview(previewCanvas, currentGraph);
    }

    /**
     * Función: loadSavedGraphsList
     * ¿Qué hace?: Lee la memoria y dibuja la lista visual de todos los proyectos creados.
     */
    function loadSavedGraphsList() {
        const container = document.getElementById('saved-graphs-list');
        const saved = Almacenamiento.obtenerGrafos(); // Función definida en: almacenamiento.js

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
     * Función: visualizeGraph
     * ¿Qué recibe?: 
     *  - id (texto): El identificador del grafo guardado.
     * ¿Qué hace?: Toma un grafo de la memoria, se cambia de pantalla hacia el visualizador
     * y le ordena dibujar la red allí.
     * ¿Qué devuelve?: Nada.
     */
    function visualizeGraph(id) {
        const graph = Almacenamiento.buscarPorId(id); // Función definida en: almacenamiento.js
        if (!graph) return;
        
        Sidebar.navigateTo('visualizer'); // Función definida en: sidebar.js
        
        setTimeout(() => {
            Visualizer.loadGraph(graph); // Función definida en: visualizer.js
            document.getElementById('graph-selector').value = id;
        }, 100);
    }

    /**
     * Función: refreshVisualizerSelector
     * ¿Qué hace?: Reconstruye la lista desplegable en la pantalla grande del visualizador.
     */
    function refreshVisualizerSelector() {
        const selector = document.getElementById('graph-selector');
        const saved = Almacenamiento.obtenerGrafos(); // Función definida en: almacenamiento.js
        
        selector.innerHTML = '<option value="">— Seleccionar grafo —</option>' +
            saved.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    }

    // El objeto final define qué métodos pueden llamar otros archivos (como app.js)
    return {
        init, addNode, removeNode, addEdge, removeEdge,
        saveGraph, deleteGraph, loadGraphToEditor, clearForm,
        visualizeGraph, refreshVisualizerSelector
    };
})();
