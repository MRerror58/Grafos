/**
 * Editor Module — Permite crear, editar y guardar grafos en localStorage.
 * 
 * Utiliza el Patrón Módulo (IIFE) para mantener sus variables privadas y no mezclar
 * la información del editor con la del visualizador.
 */
const Editor = (() => {
    // Constante para la llave del LocalStorage (no cambia nunca)
    const STORAGE_KEY = 'graphlab_saved_graphs';

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
     * ¿Por qué existe?: Es una buena práctica agrupar todos los eventos en un solo lugar 
     * para que el código sea más ordenado de leer.
     */
    function bindEvents() {
        // Clics en botones principales
        document.getElementById('btn-add-node').addEventListener('click', addNode);
        document.getElementById('btn-add-edge').addEventListener('click', addEdge);
        document.getElementById('btn-save-graph').addEventListener('click', saveGraph);
        document.getElementById('btn-clear-form').addEventListener('click', clearForm);

        // Evento 'change' se activa cuando un menú desplegable (select) cambia su valor.
        // Aquí mostramos u ocultamos la caja para escribir el "peso" según la selección.
        document.getElementById('graph-weighted').addEventListener('change', function () {
            currentGraph.weighted = this.value === 'yes';
            // Modificamos CSS directamente usando JS (.style.display)
            document.getElementById('weight-group').style.display = this.value === 'yes' ? 'flex' : 'none';
        });

        // Evento cuando se cambia el tipo de grafo (dirigido/no dirigido)
        document.getElementById('graph-type').addEventListener('change', function () {
            currentGraph.type = this.value;
            updatePreview(); // Volvemos a dibujar la previsualización porque las líneas cambian
        });

        // Atajos de teclado: Evento 'keydown' se dispara al presionar cualquier tecla.
        // Verificamos si la tecla presionada (e.key) fue 'Enter' para agregar datos rápido.
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

        // Si está vacío, lanzamos alerta y nos detenemos (return)
        if (!label) {
            showToast('Ingresa una etiqueta para el nodo', 'error'); // Función definida en: app.js
            labelInput.focus(); // focus() pone el cursor titilando de nuevo en la caja de texto
            return;
        }

        // El método find() recorre el arreglo de nodos buscando uno que cumpla la condición.
        // Usamos .toLowerCase() para evitar que el usuario agregue "A" y luego "a" pensando que son distintos.
        if (currentGraph.nodes.find(n => n.label.toLowerCase() === label.toLowerCase())) {
            showToast('Ya existe un nodo con esa etiqueta', 'error'); // Función definida en: app.js
            return;
        }

        // Se crea el "Objeto Nodo" que viajará por todo el código
        const node = {
            // ++nodeIdCounter incrementa la variable primero y luego asigna el valor. Resultado: n1, n2, n3...
            id: 'n' + (++nodeIdCounter),
            label: label,
            color: colorInput.value
        };

        // .push() mete este nuevo objeto al final del arreglo
        currentGraph.nodes.push(node);
        labelInput.value = ''; // Limpiamos la cajita de texto para el próximo

        // Como los datos cambiaron, mandamos a actualizar toda la parte visual del HTML
        updateNodeSelectors();
        updateNodesList();
        updateSummary();
        updatePreview();

        showToast(`Nodo "${label}" agregado`, 'success'); // Función definida en: app.js
        labelInput.focus();
    }

    /**
     * Función: removeNode
     * ¿Qué recibe?: id (texto) - El identificador único interno del nodo, por ejemplo 'n2'.
     * ¿Qué hace?: Borra el nodo de la lista, pero también es responsable de borrar las conexiones
     * (aristas) que estaban enganchadas a ese nodo.
     * ¿Qué devuelve?: Nada.
     */
    function removeNode(id) {
        // filter() crea un nuevo arreglo que SOLO contiene los elementos que cumplen la condición.
        // Condición: "Quédate con todos los nodos cuyo id NO sea igual al id que me mandaron borrar".
        currentGraph.nodes = currentGraph.nodes.filter(n => n.id !== id);

        // Hacemos lo mismo con las aristas: eliminamos aquellas donde el origen (from) 
        // o el destino (to) coincidan con el nodo borrado.
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
        // Obtenemos las referencias a las listas desplegables del HTML
        const fromSelect = document.getElementById('edge-from');
        const toSelect = document.getElementById('edge-to');
        const weightInput = document.getElementById('edge-weight');

        // Extraemos sus valores actuales (que son los IDs de los nodos, ej: 'n1')
        const from = fromSelect.value;
        const to = toSelect.value;

        if (!from || !to) {
            showToast('Selecciona origen y destino', 'error'); // Función definida en: app.js
            return;
        }

        // Revisar si el usuario intenta crear una conexión duplicada
        const duplicate = currentGraph.edges.find(e => {
            // En grafos "no dirigidos", una línea de A hacia B es exactamente la misma que de B hacia A
            if (currentGraph.type === 'undirected') {
                return (e.from === from && e.to === to) || (e.from === to && e.to === from);
            }
            // En grafos "dirigidos", las flechas importan. A->B es diferente de B->A.
            return e.from === from && e.to === to;
        });

        if (duplicate) {
            showToast('Esa arista ya existe', 'error'); // Función definida en: app.js
            return;
        }

        // Creamos la nueva conexión
        const edge = { from, to };

        // Si el grafo soporta "pesos" (distancias, costos), lo guardamos también
        if (currentGraph.weighted) {
            // parseFloat convierte un texto (ej: "4.5") en número. Si el usuario escribió letras,
            // parseFloat falla. El "|| 1" asegura que si falla, el peso mínimo por defecto sea 1.
            edge.weight = parseFloat(weightInput.value) || 1;
        }

        currentGraph.edges.push(edge);

        updateEdgesList();
        updateSummary();
        updatePreview();

        // Para el mensaje de éxito, buscamos el nombre (label) del nodo en vez de mostrar 'n1'
        // El símbolo '?.' evita un error fatal si por alguna razón el nodo no se encontrara.
        const fromLabel = currentGraph.nodes.find(n => n.id === from)?.label || from;
        const toLabel = currentGraph.nodes.find(n => n.id === to)?.label || to;
        showToast(`Arista ${fromLabel} → ${toLabel} agregada`, 'success'); // Función definida en: app.js
    }

    /**
     * Función: removeEdge
     * ¿Qué recibe?: index (número) - La posición exacta de la arista en el arreglo (0, 1, 2...).
     * ¿Qué hace?: Elimina esa arista directamente.
     * ¿Qué devuelve?: Nada.
     */
    function removeEdge(index) {
        // splice() modifica el arreglo original eliminando elementos. 
        // Parámetros: splice(desde_dónde, cuántos_elementos)
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
     * que ya existe, pausa todo, abre un panel (modal) preguntando si desea sobreescribir.
     * ¿Qué devuelve?: Nada.
     */
    function saveGraph() {
        const nameInput = document.getElementById('graph-name');
        const name = nameInput.value.trim();

        if (!name) {
            showToast('Ingresa un nombre para el grafo', 'error'); // Función definida en: app.js
            nameInput.focus();
            return;
        }

        if (currentGraph.nodes.length === 0) {
            showToast('Agrega al menos un nodo', 'error'); // Función definida en: app.js
            return;
        }

        const saved = getSavedGraphs();
        // Busca si ya hay un grafo guardado con el mismo nombre
        const existingGraph = saved.find(g => g.name.toLowerCase() === name.toLowerCase());

        // Si ya existe, abrimos la ventana de confirmación (Modal)
        if (existingGraph) {
            const modal = document.getElementById('confirm-modal');
            document.getElementById('confirm-graph-name').textContent = name;
            modal.classList.remove('hidden'); // Hacer visible la ventana

            const btnCancel = document.getElementById('btn-confirm-cancel');
            const btnOverwrite = document.getElementById('btn-confirm-overwrite');

            // --- Funciones temporales exclusivas para estos botones ---
            const onCancel = () => {
                modal.classList.add('hidden'); // Ocultar ventana
                cleanup(); // Limpiar eventos
            };

            const onOverwrite = () => {
                modal.classList.add('hidden');
                cleanup();
                // Llama a performSave indicándole específicamente cuál ID debe sobreescribir
                performSave(name, existingGraph.id);
            };

            // Es crítico limpiar los eventos usando removeEventListener. 
            // Si el usuario cancela 5 veces, tendríamos 5 eventos pegados al botón y fallaría todo.
            const cleanup = () => {
                btnCancel.removeEventListener('click', onCancel);
                btnOverwrite.removeEventListener('click', onOverwrite);
            };

            // Enlazar los botones temporales
            btnCancel.addEventListener('click', onCancel);
            btnOverwrite.addEventListener('click', onOverwrite);
            return; // Se detiene la ejecución aquí. JS esperará el clic del usuario.
        }

        // Si no existía uno igual, se guarda directamente como nuevo
        performSave(name);
    }

    /**
     * Función: performSave
     * ¿Qué recibe?: 
     *  - name (texto): Nombre final del grafo.
     *  - overrideId (texto - opcional): ID a sobreescribir. Si no se manda, es 'null'.
     * ¿Qué hace?: Empaqueta todo el estado actual y lo envía a la base de datos local 
     * del navegador (localStorage).
     * ¿Qué devuelve?: Nada.
     */
    function performSave(name, overrideId = null) {
        // Date.now() nos da la cantidad de milisegundos desde 1970. Es un truco común para generar un ID único.
        const graphId = overrideId || ('g_' + Date.now());

        // Creamos el paquete final que va a la base de datos
        const graphToSave = {
            id: graphId,
            name: name,
            type: document.getElementById('graph-type').value,
            weighted: document.getElementById('graph-weighted').value === 'yes',
            // El operador spread [...] hace copias profundas (clones) de los arreglos.
            // Si no clonamos, errores futuros en la edición podrían afectar lo ya guardado.
            nodes: [...currentGraph.nodes],
            edges: [...currentGraph.edges],
            createdAt: new Date().toISOString() // Estampa de tiempo estándar
        };

        let saved = getSavedGraphs();

        if (overrideId) {
            // Buscamos en qué posición (índice 0, 1, 2) está el grafo viejo
            const idx = saved.findIndex(g => g.id === overrideId);
            if (idx !== -1) {
                saved[idx] = graphToSave; // Reemplazamos la caja vieja por la nueva
            } else {
                saved.push(graphToSave);
            }
        } else {
            saved.push(graphToSave); // Es nuevo, lo ponemos al final de la fila
        }

        // localStorage solo sabe guardar textos simples, no arreglos ni objetos complejos.
        // JSON.stringify() traduce todo el arreglo de objetos a un largo texto (String) comprensible para las máquinas.
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

        // Refrescamos paneles
        loadSavedGraphsList();
        refreshVisualizerSelector();
        showToast(overrideId ? `Grafo "${name}" sobrescrito exitosamente` : `Grafo "${name}" guardado exitosamente`, 'success'); // Función definida en: app.js
    }

    /**
     * Función: getSavedGraphs
     * ¿Qué recibe?: Nada.
     * ¿Qué hace?: Saca los datos del localStorage y los convierte de texto a código JS usable.
     * ¿Qué devuelve?: Un arreglo completo de grafos guardados, o un arreglo vacío [] si no hay nada.
     */
    function getSavedGraphs() {
        // try/catch se usa cuando una operación podría fallar gravemente (ej: archivo corrupto).
        // Si hay error dentro de 'try', en vez de detenerse la app, salta silenciosamente al 'catch'.
        try {
            // JSON.parse() hace el trabajo inverso: convierte un texto JSON en Objetos Reales.
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    /**
     * Función: deleteGraph
     * ¿Qué recibe?: id (texto) - El identificador del grafo a borrar.
     * ¿Qué hace?: Filtra la lista para excluirlo y vuelve a guardar.
     */
    function deleteGraph(id) {
        let saved = getSavedGraphs();
        saved = saved.filter(g => g.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

        loadSavedGraphsList();
        refreshVisualizerSelector();
        showToast('Grafo eliminado', 'info'); // Función definida en: app.js
    }

    /**
     * Función: loadGraphToEditor
     * ¿Qué recibe?: id (texto) - Identificador del grafo.
     * ¿Qué hace?: Trae un grafo viejo desde la memoria hacia las variables en vivo 
     * (`currentGraph`) para poder seguir trabajándolo en pantalla.
     * ¿Qué devuelve?: Nada.
     */
    function loadGraphToEditor(id) {
        const saved = getSavedGraphs();
        const graph = saved.find(g => g.id === id);
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

        // Lógica importante: Tenemos que actualizar el contador interno de IDs.
        // Si el grafo cargado tiene nodos n1, n2, n5... nuestro contador debe empezar desde el 5
        // para que el próximo que se agregue sea n6, previniendo repeticiones fatales.
        nodeIdCounter = 0;
        currentGraph.nodes.forEach(n => {
            const num = parseInt(n.id.replace('n', '')); // Le quita la 'n' y convierte a número
            if (num > nodeIdCounter) nodeIdCounter = num; // Guarda el número mayor encontrado
        });

        // Repintamos la pantalla
        updateNodeSelectors();
        updateNodesList();
        updateEdgesList();
        updateSummary();
        updatePreview();

        showToast(`Grafo "${graph.name}" cargado en el editor`, 'info'); // Función definida en: app.js
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
    // Aquí usamos el DOM para reflejar visualmente los cambios de nuestros arreglos internos.

    /**
     * Función: updateNodeSelectors
     * ¿Qué hace?: Toma la lista de nodos y construye el código HTML `<option>...</option>`
     * necesario para los menús desplegables de conectar aristas.
     */
    function updateNodeSelectors() {
        // El método map() pasa por cada objeto nodo y devuelve una cadena de texto HTML.
        const options = currentGraph.nodes.map(n =>
            `<option value="${n.id}">${n.label}</option>`
        ).join(''); // .join('') concatena (une) todas las cadenas en un solo texto gigante.

        const placeholder = '<option value="">—</option>';
        // .innerHTML toma el HTML y lo inserta en la página en vivo
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

        // El parámetro 'n' representa a cada nodo individual durante el ciclo map()
        container.innerHTML = currentGraph.nodes.map(n => `
            <span class="chip">
                <span class="chip-dot" style="background:${n.color}"></span>
                ${n.label}
                <!-- Usamos 'onclick' para inyectar JavaScript desde el HTML y conectar el botón a la función -->
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

        // Aquí pasamos dos parámetros al map(elemento, índice)
        // La 'e' es la arista actual. La 'i' es la posición (0, 1, 2) fundamental para poder borrarla.
        container.innerHTML = currentGraph.edges.map((e, i) => {
            const fromLabel = currentGraph.nodes.find(n => n.id === e.from)?.label || '?';
            const toLabel = currentGraph.nodes.find(n => n.id === e.to)?.label || '?';
            // Operador ternario (condición ? verdadero : falso)
            const arrow = currentGraph.type === 'directed' ? '→' : '↔';
            const weightStr = currentGraph.weighted && e.weight !== undefined ? ` (${e.weight})` : '';

            return `
                <span class="chip">
                    ${fromLabel} ${arrow} ${toLabel}${weightStr}
                    <!-- Pasamos la posición 'i' a la función removeEdge -->
                    <span class="chip-remove" onclick="Editor.removeEdge(${i})" title="Eliminar">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </span>
                </span>
            `;
        }).join('');
    }

    /**
     * Función: updateSummary
     * ¿Qué hace?: Actualiza el contador inferior de nodos y aristas (usando .length para contar elementos).
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
            emptyState.classList.remove('hidden'); // classList.remove quita la regla CSS que lo ocultaba
        } else {
            emptyState.classList.add('hidden'); // classList.add la pone, haciendo que el letrero desaparezca
        }

        // Delega la responsabilidad de dibujo avanzado al módulo Visualizer
        Visualizer.renderPreview(previewCanvas, currentGraph); // Función definida en: visualizer.js
    }

    /**
     * Función: loadSavedGraphsList
     * ¿Qué hace?: Lee la memoria y dibuja la lista visual de todos los proyectos creados (tarjetas grandes).
     */
    function loadSavedGraphsList() {
        const container = document.getElementById('saved-graphs-list');
        const saved = getSavedGraphs();

        if (saved.length === 0) {
            container.innerHTML = `
                <div class="empty-state small">
                    <p>No hay grafos guardados</p>
                </div>
            `;
            return;
        }

        container.innerHTML = saved.map(g => {
            // Conversión de formato de fecha. Se toma la estampa ISO y se pasa a algo amigable localmente.
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
     * ¿Qué recibe?: id (texto).
     * ¿Qué hace?: Toma un grafo de la memoria, se cambia de pantalla hacia el visualizador
     * y le ordena dibujar la red allí, todo automatizado mediante eventos.
     */
    function visualizeGraph(id) {
        const saved = getSavedGraphs();
        const graph = saved.find(g => g.id === id);
        if (!graph) return;

        Sidebar.navigateTo('visualizer'); // Función definida en: sidebar.js

        // Retrasamos el dibujo 100 milisegundos usando setTimeout, para que el CSS y la pantalla
        // terminen de hacer la transición antes de pedirle a la PC cálculos gráficos pesados.
        setTimeout(() => {
            Visualizer.loadGraph(graph); // Función definida en: visualizer.js
            document.getElementById('graph-selector').value = id;
        }, 100);
    }

    /**
     * Función: refreshVisualizerSelector
     * ¿Qué hace?: Reconstruye la lista de <options> que aparece en la parte de arriba 
     * en la pantalla grande del visualizador.
     */
    function refreshVisualizerSelector() {
        const selector = document.getElementById('graph-selector');
        const saved = getSavedGraphs();

        selector.innerHTML = '<option value="">— Seleccionar grafo —</option>' +
            saved.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    }

    // El objeto final (con llaves {}) que es retornado define qué cosas pueden ver y llamar 
    // archivos externos como app.js. Todas las demás variables arriba quedan secretas e intocables.
    return {
        init, addNode, removeNode, addEdge, removeEdge,
        saveGraph, deleteGraph, loadGraphToEditor, clearForm,
        visualizeGraph, refreshVisualizerSelector, getSavedGraphs
    };
})();
