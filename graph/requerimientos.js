/**
 * Requerimientos Module (requerimientos.js) - Required functions for the discrete mathematics course.
 *
 * This file contains:
 * 1. A node search function that centers the camera on a found node.
 * 2. A function that detects if a graph is Simple or a Multigraph.
 * 3. A function that detects if a graph is Complete or Not complete.
 *
 * All functions are documented in plain English so they are easy to understand
 * for university students.
 */
const Requerimientos = (() => { //Note: this search the nothe what u wrote.

    // ===== 1. NODE SEARCH =====

    /**
     * Function: searchAndFocusNode
     * What does it receive?:
     *  - label (string): The label (name) the user typed in the search box.
     * What does it do?:
     *  1. Gets the current nodes and graph data from the Visualizer.
     *  2. Searches for a node whose label matches the input (case-insensitive).
     *  3. If found, moves the camera so the node is centered on screen.
     *  4. Shows the node details card positioned next to the search box.
     *  5. If not found, shows an error toast message.
     * What does it return?: Nothing.
     */
    function searchAndFocusNode(label) {//Note: this is for search a node and center the camera in it.
        // Get current state from the Visualizer module.
        const state = Visualizer.getState();
        if (!state.graphData) {
            showToast('No hay ningún grafo cargado', 'error');
            return;
        }

        // Clean up the search text (remove extra spaces, convert to lowercase).
        const searchLabel = label.trim().toLowerCase();
        if (searchLabel === '') {
            showToast('Escribe el nombre de un nodo', 'error');
            return;
        }

        // Search through all nodes for one whose label matches.
        // .find() returns the first match, or undefined if nothing matches.
        const foundNode = state.nodes.find(
            n => n.label.toLowerCase() === searchLabel
        );

        if (!foundNode) {
            showToast(`No se encontró el nodo "${label.trim()}"`, 'error');
            return;
        }

        // --- CENTER THE CAMERA ON THE FOUND NODE ---
        // To center a node on screen, we need to calculate the camera offset
        // so that the node's world coordinates appear at the middle of the canvas.
        const canvas = state.canvas;
        const ratio = GraphCanvas.getPixelRatio();
        const canvasWidth = canvas.width / ratio;
        const canvasHeight = canvas.height / ratio;

        // The formula: offset = (canvas center) - (node position * zoom level)
        // This places the node exactly in the center of the visible area.
        const newOffsetX = canvasWidth / 2 - foundNode.x * state.scale;
        const newOffsetY = canvasHeight / 2 - foundNode.y * state.scale;

        // Apply the new camera position through the Visualizer.
        Visualizer.setCamera(newOffsetX, newOffsetY, state.scale);

        // --- SHOW THE NODE DETAILS CARD NEXT TO THE SEARCH BOX ---
        // We position the card right next to the search box (top-left area),
        // because the professor asked for the information menu to appear beside it.
        const searchBox = document.getElementById('node-search-box');
        const canvasRect = canvas.getBoundingClientRect();

        let cardX, cardY;
        if (searchBox) {
            const searchRect = searchBox.getBoundingClientRect();
            // Place the card to the right of the search box.
            cardX = searchRect.right + 8;
            cardY = searchRect.top;
        } else {
            // Fallback: place near top-left of canvas.
            cardX = canvasRect.left + 20;
            cardY = canvasRect.top + 80;
        }

        // Call the existing showNodeDetails function from the Visualizer.
        Visualizer.showNodeDetails(foundNode, cardX, cardY);

        showToast(`Nodo "${foundNode.label}" encontrado`, 'success');
    }

    /**
     * Function: initSearchEvents
     * What does it do?: Connects the search input and button to the search logic.
     * This is called once during app initialization.
     * What does it return?: Nothing.
     */
    function initSearchEvents() {//Note: ejecute the search.
        const searchInput = document.getElementById('search-node-input');
        const searchBtn = document.getElementById('btn-search-node');

        if (!searchInput || !searchBtn) return;

        // When the user clicks the search button, run the search.
        searchBtn.addEventListener('click', () => {
            searchAndFocusNode(searchInput.value);
        });

        // When the user presses Enter in the search input, run the search too.
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                searchAndFocusNode(searchInput.value);
            }
        });
    }

    // ===== 2. SIMPLE vs MULTIGRAPH DETECTION =====

    /**
     * Function: detectGraphSimplicity
     *
     * What does it receive?
     *  - nodes (array): List of node objects in the graph.
     *  - edges (array): List of edge objects in the graph.
     *  - graphType (string): Either 'directed' or 'undirected'.
     *
     * What does it do?
     *  Checks whether a graph is SIMPLE or NOT SIMPLE by detecting:
     *    1. Self-loops: an edge whose source and destination are the same node.
     *       Example: A -> A
     *    2. Parallel edges (also called duplicate or multiple edges):
     *       two or more edges that connect the same pair of nodes.
     *
     *  Rules:
     *    - In directed graphs, A -> B and B -> A are different edges.
     *    - In undirected graphs, A-B and B-A are the same edge.
     *
     *  If no self-loops and no parallel edges are found, the graph is simple.
     *
     * What does it return?
     *  A boolean:
     *    - true:  The graph is simple (no self-loops, no parallel edges).
     *    - false: The graph is not simple (has self-loops or parallel edges).
     *
     * Discrete Math Definition:
     *  - A simple graph has no self-loops and no parallel edges.
     *  - A multigraph allows self-loops or parallel edges (or both).
     */
    function detectGraphSimplicity(nodes, edges, graphType) {

        // --- EDGE MEMORY ---
        // Stores previously seen connections
        // so duplicate edges can be detected.
        const seenEdges = new Set();

        // --- SCAN EVERY EDGE ---
        for (const edge of edges) {
            //basic definition
            const from = String(edge.from);
            const to = String(edge.to);

            // --- CHECK 1: SELF-LOOPS ---
            // Example A -> A
            if (from === to) {return false;}

            let edgeKey;
            // --- DIRECTED GRAPH ---
            if (graphType === 'directed') {

                // Direction matters:
                // A->B != B->A
                edgeKey = `${from}->${to}`;

            }
            // --- UNDIRECTED GRAPH ---
            else {

                // Direction does NOT matter:
                // A-B == B-A
                //
                // Normalize the order so both
                // representations generate
                // the exact same key.
                if (from < to) {// Note: javascript can detect the minor and major string per alphabetic. XD, crazy
                    edgeKey = `${from}-${to}`;
                } else {
                    edgeKey = `${to}-${from}`;
                }
            }

            // --- CHECK 2: PARALLEL EDGES ---
            // If this connection already exists,
            // the graph is NOT simple.
            if (seenEdges.has(edgeKey)) {
                return false;
            }

            // Store the connection for future checks.
            seenEdges.add(edgeKey);
    }

    // If no invalid structures were found,
    // the graph is simple.
    return true;

    }    // ===== 3. COMPLETE GRAPH DETECTION =====

    /**
     * Function: detectGraphCompleteness
     * What does it receive?:
     *  - nodes (array): List of node objects in the graph.
     *  - edges (array): List of edge objects in the graph.
     *  - graphType (string): Either 'directed' or 'undirected'.
     *
     * What does it do?:
     *  Determines if a graph is COMPLETE or NOT COMPLETE following strict rules:
     *
     *  STEP 1 — BASIC VALIDATION:
     *    - If 0 or 1 nodes: return "Complete graph" (trivially complete).
     *
     *  STEP 2 — REJECT INVALID STRUCTURES:
     *    - If self-loops or parallel edges exist: return "Not complete graph"
     *    - A complete graph must be simple (no self-loops, no parallel edges).
     *
     *  STEP 3 — UNDIRECTED GRAPHS:
     *    - A-B and B-A represent the SAME edge.
     *    - Expected edge count: n*(n-1)/2
     *    - Every pair of distinct nodes must be connected exactly once.
     *
     *  STEP 4 — DIRECTED GRAPHS:
     *    - A->B and B->A are DIFFERENT edges.
     *    - Expected edge count: n*(n-1)
     *    - For every pair of distinct nodes, both A->B and B->A must exist.
     *
     * What does it return?:
     *  A string: "Complete graph" or "Not complete graph".
     *
     * Discrete Math Definition:
     *  - A complete graph (Kn) is a simple graph where every pair of distinct
     *    vertices is connected by exactly one edge.
     */
    function detectGraphCompleteness(nodes, edges, graphType) {

        const n = nodes.length;

        // --- STEP 1: TRIVIAL CASES ---
        // A graph with 0 or 1 node is trivially complete.
        if (n <= 1) {
            return true;
        }

        // --- STEP 3: COLLECT NODE IDS ---
        // We store all valid node IDs in a Set for fast lookup.
        const nodeIds = new Set();
        for (const node of nodes) {
            nodeIds.add(String(node.id));
        }

        // --- STEP 4: SCAN EDGES AND CHECK BASIC VALIDITY ---
        // We use a Set to detect duplicate edges.
        const seenEdges = new Set();

        for (const edge of edges) {
            const from = String(edge.from);
            const to = String(edge.to);

            // An edge must connect existing nodes only.
            if (!nodeIds.has(from) || !nodeIds.has(to)) {
                return false;
            }

            // A complete graph cannot contain self-loops.
            if (from === to) {return false;}

            // Build a normalized edge key.
            let edgeKey;

            if (graphType === 'directed') {
                // In directed graphs, direction matters.
                // A->B and B->A are different edges.
                edgeKey = `${from}->${to}`;
            } else {
                // In undirected graphs, direction does not matter.
                // A-B and B-A must generate the same key.
                if (from < to) {// Note: javascript can detect the minor and major string per alphabetic. XD, crazy
                    edgeKey = `${from}-${to}`;
                } else {
                    edgeKey = `${to}-${from}`;
                }
            }

            // Duplicate edge = parallel edge = not complete.
            if (seenEdges.has(edgeKey)) {
                return false;
            }

            seenEdges.add(edgeKey);
        }

        // --- STEP 5: VERIFY ALL REQUIRED CONNECTIONS ---
        // Count-based checks are not enough.
        // We must confirm that every required pair actually exists.

        const ids = [...nodeIds];

        if (graphType === 'directed') {
            // Every ordered pair of distinct nodes must exist.
            for (const from of ids) {
                for (const to of ids) {
                    if (from === to) {
                        continue;
                    }

                    const requiredKey = `${from}->${to}`;

                    if (!seenEdges.has(requiredKey)) {
                        return false;
                    }
                }
            }
        } else {
            // Every unordered pair of distinct nodes must exist.
            for (let i = 0; i < ids.length; i++) {
                for (let j = i + 1; j < ids.length; j++) {
                    const a = ids[i];
                    const b = ids[j];

                    const requiredKey = a < b ? `${a}-${b}` : `${b}-${a}`;

                    if (!seenEdges.has(requiredKey)) {
                        return false;
                    }
                }
            }
        }

        // If every required connection exists, the graph is complete.
        return 'Complete graph';
    }
    // Expose public functions for other modules to use.
    return {
        searchAndFocusNode,
        initSearchEvents,
        detectGraphSimplicity,
        detectGraphCompleteness
    };
})();

// Make the module available globally for browser scripts.
window.Requerimientos = Requerimientos;
