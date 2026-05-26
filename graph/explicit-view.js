/**
 * Explicit View Module (explicit-view.js)
 *
 * New page: pick a saved graph and show EVERY field stored in localStorage
 * (nodes, edges, IDs, connections, weights, etc.) in a clear, explicit layout.
 */
const ExplicitView = (() => {

    /**
     * Function: init
     * What does it do?: Connects the selector and button on the explicit-view page.
     */
    function init() {
        const selector = document.getElementById('explicit-graph-selector');
        const btn = document.getElementById('btn-show-explicit-graph');

        if (!selector || !btn) return;

        selector.addEventListener('change', () => {
            btn.disabled = !selector.value;
        });

        btn.addEventListener('click', () => {
            const id = selector.value;
            if (id) showGraph(id);
        });

        refreshSelector();
    }

    /**
     * Function: refreshSelector
     * What does it do?: Fills the dropdown with graph names from localStorage.
     * Same idea as the visualizer selector.
     */
    function refreshSelector() {
        const selector = document.getElementById('explicit-graph-selector');
        if (!selector) return;

        const saved = Almacenamiento.obtenerGrafos();
        selector.innerHTML = '<option value="">— Seleccionar grafo —</option>' +
            saved.map(g => `<option value="${g.id}">${g.name}</option>`).join('');

        const btn = document.getElementById('btn-show-explicit-graph');
        if (btn) btn.disabled = !selector.value;
    }

    /**
     * Function: showGraph
     * What does it receive?: id (string) — graph ID in localStorage.
     * What does it do?: Reads the graph and renders all stored data on screen.
     */
    function showGraph(id) {
        const graph = Almacenamiento.buscarPorId(id);
        if (!graph) {
            showToast('No se encontró el grafo en localStorage', 'error');
            refreshSelector();
            return;
        }

        // Exact copy of what is stored (no changes to the original object).
        const data = JSON.parse(JSON.stringify(graph));

        document.getElementById('explicit-empty').classList.add('hidden');
        document.getElementById('explicit-content').classList.remove('hidden');

        renderMetadata(data);
        renderNodes(data.nodes || []);
        renderEdges(data.edges || [], data);
        renderConnectionsList(data);
        document.getElementById('explicit-json').textContent =
            JSON.stringify(data, null, 2);

        showToast(`Mostrando datos completos de "${data.name}"`, 'success');
    }

    /**
     * Function: renderMetadata
     * What does it do?: Shows general graph fields (id, name, type, weighted, date).
     */
    function renderMetadata(graph) {
        const container = document.getElementById('explicit-metadata');
        const rows = [
            { label: 'ID del grafo', value: graph.id },
            { label: 'Nombre', value: graph.name },
            { label: 'Tipo', value: graph.type === 'directed' ? 'directed (dirigido)' : 'undirected (no dirigido)' },
            { label: 'Ponderado (weighted)', value: String(graph.weighted) },
            { label: 'Fecha de guardado (createdAt)', value: graph.createdAt || '—' }
        ];

        container.innerHTML = rows.map(r => `
            <div class="explicit-meta-row">
                <span class="explicit-meta-label">${r.label}:</span>
                <span class="explicit-meta-value font-mono">${escapeHtml(String(r.value))}</span>
            </div>
        `).join('');
    }

    /**
     * Function: renderNodes
     * What does it do?: Lists every node with all its stored properties.
     */
    function renderNodes(nodes) {
        const container = document.getElementById('explicit-nodes-list');
        document.getElementById('explicit-nodes-count').textContent = nodes.length;

        if (nodes.length === 0) {
            container.innerHTML = '<p class="explicit-empty-msg">No hay nodos guardados.</p>';
            return;
        }

        container.innerHTML = nodes.map((node, index) => {
            const props = Object.keys(node).map(key => `
                <div class="explicit-prop-row">
                    <span class="explicit-prop-key">${escapeHtml(key)}:</span>
                    <span class="explicit-prop-val font-mono">${escapeHtml(formatValue(node[key]))}</span>
                </div>
            `).join('');

            return `
                <article class="explicit-card">
                    <h4 class="explicit-card-title">Nodo #${index + 1}</h4>
                    <div class="explicit-card-body">${props}</div>
                </article>
            `;
        }).join('');
    }

    /**
     * Function: renderEdges
     * What does it do?: Lists every edge with from, to, weight and any other field.
     */
    function renderEdges(edges, graph) {
        const container = document.getElementById('explicit-edges-list');
        document.getElementById('explicit-edges-count').textContent = edges.length;
        const nodes = graph.nodes || [];

        if (edges.length === 0) {
            container.innerHTML = '<p class="explicit-empty-msg">No hay aristas guardadas.</p>';
            return;
        }

        container.innerHTML = edges.map((edge, index) => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            const fromLabel = fromNode ? fromNode.label : '?';
            const toLabel = toNode ? toNode.label : '?';
            const arrow = graph.type === 'directed' ? '→' : '↔';

            const props = Object.keys(edge).map(key => `
                <div class="explicit-prop-row">
                    <span class="explicit-prop-key">${escapeHtml(key)}:</span>
                    <span class="explicit-prop-val font-mono">${escapeHtml(formatValue(edge[key]))}</span>
                </div>
            `).join('');

            return `
                <article class="explicit-card">
                    <h4 class="explicit-card-title">Arista #${index + 1}</h4>
                    <p class="explicit-connection-line font-mono">
                        ${escapeHtml(fromLabel)} (${escapeHtml(edge.from)}) ${arrow}
                        ${escapeHtml(toLabel)} (${escapeHtml(edge.to)})
                    </p>
                    <div class="explicit-card-body">${props}</div>
                </article>
            `;
        }).join('');
    }

    /**
     * Function: renderConnectionsList
     * What does it do?: Plain list of every connection as stored (easy to read at a glance).
     */
    function renderConnectionsList(graph) {
        const container = document.getElementById('explicit-connections-list');
        const nodes = graph.nodes || [];
        const edges = graph.edges || [];

        if (edges.length === 0) {
            container.innerHTML = '<p class="explicit-empty-msg">Sin conexiones.</p>';
            return;
        }

        container.innerHTML = '<ul class="explicit-connections-ul">' + edges.map((e, i) => {
            const fromNode = nodes.find(n => n.id === e.from);
            const toNode = nodes.find(n => n.id === e.to);
            const weightPart = graph.weighted && e.weight !== undefined
                ? ` | peso (weight): ${escapeHtml(String(e.weight))}`
                : '';
            return `<li class="explicit-connections-li font-mono">
                <span class="explicit-conn-index">${i + 1}.</span>
                from: "${escapeHtml(e.from)}" (${escapeHtml(fromNode?.label || '?')})
                → to: "${escapeHtml(e.to)}" (${escapeHtml(toNode?.label || '?')})${weightPart}
            </li>`;
        }).join('') + '</ul>';
    }

    /** Turns any value into readable text for the UI. */
    function formatValue(value) {
        if (value === null || value === undefined) return '—';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }

    /** Prevents HTML injection when showing user data. */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    return { init, refreshSelector, showGraph };
})();

window.ExplicitView = ExplicitView;
