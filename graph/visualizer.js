/**
 * Visualizer Module (visualizer.js) - Renders graphs on a canvas using a force-directed layout.
 *
 * This module physically draws circles (nodes) and lines (edges) on screen.
 * It uses math to simulate physics (attraction and repulsion) so the graph organizes itself.
 * It uses the Module Pattern (IIFE) to avoid collisions with editor variables.
 */
const Visualizer = (() => {
    // Global drawing variables.
    let canvas, ctx;    // canvas is the HTML drawing surface, ctx is the 2D "brush".
    let nodes = [];     // List of nodes to draw.
    let edges = [];     // List of connections to draw.
    let graphData = null; // All data for the loaded graph.

    // Camera / View (zoom and pan).
    let offsetX = 0, offsetY = 0; // How much the camera moved on X and Y.
    let scale = 1;                // Zoom level (1 = 100%).
    let isPanning = false;        // Is the user dragging the background?
    let panStart = { x: 0, y: 0 }; // Coordinate where the user started dragging.

    // Node interaction.
    let dragNode = null;          // Node currently grabbed by the user.
    let isDragging = false;       // Is the user dragging a node?

    // Visual options.
    let showLabels = true;        // Show/hide node names.
    let showWeights = true;       // Show/hide edge numbers.

    // Physics animation.
    let animFrame = null;         // Animation reference so it can be stopped.
    let simulationRunning = false;// Are the physics currently being calculated?
    let simulationAlpha = 1;      // Simulation "temperature". Starts at 1 and moves toward 0.

    /**
     * Function: init
     * What does it receive?: Nothing.
     * What does it do?: Finds the canvas in the HTML, adjusts its size, and connects mouse events.
     * What does it return?: Nothing.
     */
    function init() {
        canvas = document.getElementById('graph-canvas'); // Note: Where graphs are drawn. Initially an empty element.
        ctx = canvas.getContext('2d'); // guia-js.md | Request a 2D context so shapes can be drawn.

        resize();
        // When the browser window changes size, readjust the canvas.
        window.addEventListener('resize', resize);

        bindCanvasEvents();
        bindControlEvents();
    }

    /**
     * Function: resize
     * What does it do?: Matches the canvas size to its parent and keeps high-resolution
     * displays sharp through devicePixelRatio.
     */
    function resize() {
        const prepared = GraphCanvas.resizeToParent(canvas); // Function defined in: graph/canvas.js
        ctx = prepared.ctx;

        // If a graph is already loaded, repaint it.
        if (graphData) render();
    }

    /**
     * Function: bindCanvasEvents
     * What does it do?: Hooks mouse detectors directly onto the canvas.
     */
    function bindCanvasEvents() {
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('mouseleave', onMouseUp);
        // wheel is the mouse wheel event, used for zooming.
        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('dblclick', onDoubleClick);
        // Event to detect right-click on the canvas (Graph Theory)
        canvas.addEventListener('contextmenu', onContextMenu);
    }

    /**
     * Function: bindControlEvents
     * What does it do?: Connects UI buttons (zoom in/out, labels, weights) to the state
     * variables that control the camera and then redraws the canvas.
     */
    function bindControlEvents() { // Note: Zoom buttons and label/weight toggles.
        document.getElementById('btn-zoom-in').addEventListener('click', () => {
            scale = Math.min(scale * 1.25, 5);
            render();
        });
        document.getElementById('btn-zoom-out').addEventListener('click', () => {
            scale = Math.max(scale / 1.25, 0.2);
            render();
        });
        document.getElementById('btn-reset-view').addEventListener('click', () => {
            scale = 1; offsetX = 0; offsetY = 0;
            if (graphData) centerGraph();
            render();
        });
        document.getElementById('btn-toggle-labels').addEventListener('click', function () {
            showLabels = !showLabels;
            this.classList.toggle('active', showLabels);
            render();
        });
        document.getElementById('btn-toggle-weights').addEventListener('click', function () {
            showWeights = !showWeights;
            this.classList.toggle('active', showWeights);
            render();
        });
        // Button to manually close the floating info card
        document.getElementById('btn-close-context').addEventListener('click', hideContextCard);
    }

    /**
     * Function: screenToWorld
     * What does it receive?:
     *  - sx (number): X coordinate on the screen.
     *  - sy (number): Y coordinate on the screen.
     * What does it do?: Converts a physical screen click into the imaginary "world"
     * coordinates of the canvas, considering zoom and camera movement.
     * What does it return?: Object { x, y } with the real coordinates.
     */
    function screenToWorld(sx, sy) {
        return GraphCanvas.screenToWorld(canvas, sx, sy, offsetX, offsetY, scale); // Function defined in: graph/canvas.js
    }

    /**
     * Function: findNodeAt
     * What does it receive?:
     *  - sx (number): X coordinate on the screen.
     *  - sy (number): Y coordinate on the screen.
     * What does it do?: Checks if a screen click touches any drawn node.
     * What does it return?: The node object if touched, or null if the background was touched.
     */
    function findNodeAt(sx, sy) {
        const { x, y } = screenToWorld(sx, sy); // Note: Raw world coordinates.
        return GraphCanvas.findNodeAt(nodes, x, y); // Function defined in: graph/canvas.js
    }

    // ===== CANVAS MOUSE EVENTS =====

    function onMouseDown(e) { // Note: Detects whether the user touched a node or the background.
        hideContextCard(); // Hide the details card when interacting
        const node = findNodeAt(e.clientX, e.clientY);
        if (node) {
            // If a node was touched, grab it for dragging.
            dragNode = node;
            isDragging = true;
            node.fixed = true;
            canvas.style.cursor = 'grabbing';
        } else {
            // If the empty background was touched, start dragging the camera.
            isPanning = true;
            panStart = { x: e.clientX - offsetX, y: e.clientY - offsetY };
            canvas.style.cursor = 'grabbing';
        }
    }

    function onMouseMove(e) { // Note: Moves the dragged node or pans the background.
        if (isDragging && dragNode) {
            // Moves the node to the new mouse coordinates.
            const { x, y } = screenToWorld(e.clientX, e.clientY); // Note: Keeps the view from moving while dragging.
            dragNode.x = x;
            dragNode.y = y;
            dragNode.vx = 0;
            dragNode.vy = 0;

            // Reheats the simulation so the other nodes react smoothly.
            simulationAlpha = 0.5;
            if (!simulationRunning) {
                simulationRunning = true;
                runSimulation();
            }

            render();
        } else if (isPanning) {
            // Moves the camera.
            offsetX = e.clientX - panStart.x;
            offsetY = e.clientY - panStart.y;
            render();
        } else {
            // Hover only.
            const node = findNodeAt(e.clientX, e.clientY);
            canvas.style.cursor = node ? 'grab' : 'default';
        }
    }

    function onMouseUp() { // Note: Runs when the user releases the click.
        // Releases the node or the camera.
        if (dragNode) {
            dragNode.fixed = false;
            dragNode = null;

            // Gives physics one last push so the layout settles if nodes are too close.
            simulationAlpha = 0.5;
            if (!simulationRunning) {
                simulationRunning = true;
                runSimulation();
            }
        }
        isDragging = false;
        isPanning = false;
        canvas.style.cursor = 'default';
    }

    function onWheel(e) { // Note: Mouse wheel zoom.
        hideContextCard(); // Hide the details card when zooming
        // guia-js.md | e.preventDefault() prevents the whole web page from scrolling down.
        e.preventDefault(); // guia-js.md

        // Forward wheel zooms in; the opposite direction zooms out.
        const delta = e.deltaY > 0 ? 0.9 : 1.1;

        const rect = canvas.getBoundingClientRect(); // guia-js.md
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Keeps the new scale between 0.15 and 5.
        const newScale = Math.max(0.15, Math.min(5, scale * delta));

        // Math that keeps the zoom centered exactly where the mouse points.
        offsetX = mx - (mx - offsetX) * (newScale / scale);
        offsetY = my - (my - offsetY) * (newScale / scale);

        scale = newScale;
        render();
    }

    function onDoubleClick() { // Note: Double click centers the camera.
        if (graphData) {
            scale = 1; offsetX = 0; offsetY = 0;
            centerGraph();
            render();
        }
    }

    // ===== PHYSICS AND SIMULATION (FORCE-DIRECTED LAYOUT) =====

    /**
     * Function: initLayout
     * What does it do?: When a new graph loads, nodes start in a small circle and the
     * physics simulation turns on so they can organize themselves.
     */
    function initLayout() { // Note: Initial node position.
        // Note: Calculates canvas dimensions.
        const cw = canvas.width / GraphCanvas.getPixelRatio();
        const ch = canvas.height / GraphCanvas.getPixelRatio();
        const cx = cw / 2;
        const cy = ch / 2;

        // Distributes nodes in a mathematical circle.
        nodes.forEach((n, i) => {
            const angle = (2 * Math.PI * i) / nodes.length;
            const radius = Math.min(cw, ch) * 0.05;

            // Places nodes on the circle.
            n.x = cx + radius * Math.cos(angle);
            n.y = cy + radius * Math.sin(angle);

            n.vx = 0;
            n.vy = 0;
            n.fixed = false;
        });

        simulationAlpha = 1;
        simulationRunning = true;
        runSimulation();
    }

    /**
     * Function: runSimulation
     * What does it do?: Animation loop that keeps calling itself through
     * requestAnimationFrame until the simulation cools down.
     */
    function runSimulation() { // Note: Starts the simulation loop, not the physics math itself.
        if (!simulationRunning) return;

        // Runs physics more than once per video frame to speed up the layout.
        const ITERATIONS = 2;
        for (let iter = 0; iter < ITERATIONS; iter++) {
            simulateStep();
        }

        // Each frame cools the graph down. When almost zero, the simulation stops to save battery.
        simulationAlpha *= 0.96;
        if (simulationAlpha < 0.005) {
            simulationRunning = false;
        }

        render();
        animFrame = requestAnimationFrame(runSimulation); // guia-js.md
    }

    /**
     * Function: simulateStep
     * What does it do?: The physics core.
     * 1. Nodes repel each other.
     * 2. Edges behave like springs pulling connected nodes together.
     * 3. Light central gravity pulls nodes toward the middle of the screen.
     */
    function simulateStep() { // Note: Actual simulation physics.
        const repulsion = 18000;
        const attraction = 0.004;
        const damping = 0.75;
        const alpha = simulationAlpha;

        // Repulsion: every node against every other node.
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                let dx = nodes[j].x - nodes[i].x;
                let dy = nodes[j].y - nodes[i].y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;

                // The closer they are, the harder they repel each other.
                let force = (repulsion / (dist * dist)) * alpha;

                // Applies the force to both nodes in opposite directions.
                let fx = (dx / dist) * force;
                let fy = (dy / dist) * force;

                if (!nodes[i].fixed) { nodes[i].vx -= fx; nodes[i].vy -= fy; }
                if (!nodes[j].fixed) { nodes[j].vx += fx; nodes[j].vy += fy; }
            }
        }

        // Attraction: only between nodes connected by an edge.
        edges.forEach(e => {
            // Finds real nodes using edge IDs.
            const source = nodes.find(n => n.id === e.from);
            const target = nodes.find(n => n.id === e.to);
            if (!source || !target) return;

            let dx = target.x - source.x;
            let dy = target.y - source.y;
            let dist = Math.sqrt(dx * dx + dy * dy) || 1;
            let force = dist * attraction * alpha;
            let fx = (dx / dist) * force;
            let fy = (dy / dist) * force;
            if (!source.fixed) { source.vx += fx; source.vy += fy; }
            if (!target.fixed) { target.vx -= fx; target.vy -= fy; }
        });

        // Gravity toward the center.
        const cw = canvas.width / GraphCanvas.getPixelRatio();
        const ch = canvas.height / GraphCanvas.getPixelRatio();
        const gravity = 0.03 * alpha;
        nodes.forEach(n => {
            if (n.fixed) return; // Note: Excludes the node currently being grabbed.
            n.vx += (cw / 2 - n.x) * gravity;
            n.vy += (ch / 2 - n.y) * gravity;
        });

        // Updates each node's XY position by adding its calculated velocity.
        nodes.forEach(n => { // Note: If the mouse is holding it, physics does not apply.
            if (n.fixed) return;
            n.vx *= damping;
            n.vy *= damping;
            n.x += n.vx;
            n.y += n.vy;
        });
    }

    /**
     * Function: centerGraph
     * What does it do?: Calculates the graph bounding box and moves the camera so
     * everything stays centered on screen.
     */
    function centerGraph() { // Note: Centers the camera relative to the nodes.
        if (nodes.length === 0) return; // Note: If there are no nodes, do nothing.
        const cw = canvas.width / GraphCanvas.getPixelRatio();
        const ch = canvas.height / GraphCanvas.getPixelRatio();

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        // Finds the graph's extreme edges.
        nodes.forEach(n => {
            /**
             * Note: Replaces the maximum and minimum node values for each direction
             * to get the "square" later used to center the camera.
             */
            minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
            minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
        });

        // Calculates the center of those bounds.
        const graphCx = (minX + maxX) / 2;
        const graphCy = (minY + maxY) / 2;

        // Moves the global camera offset.
        offsetX = cw / 2 - graphCx * scale;
        offsetY = ch / 2 - graphCy * scale;
    }

    // ===== DRAWING ON THE CANVAS =====

    /**
     * Function: render
     * What does it do?: Clears the full screen like a board and redraws everything
     * from scratch. This happens many times per second during animation.
     */
    function render() { // Note: Clears and redraws only the visible canvas.
        const cw = canvas.width / GraphCanvas.getPixelRatio();
        const ch = canvas.height / GraphCanvas.getPixelRatio();

        // Clears the board.
        ctx.clearRect(0, 0, cw, ch); // guia-js.md

        // Saves the original brush state.
        // Note: Saves the freshly cleared state.
        ctx.save(); // guia-js.md

        // Moves the canvas plane based on the current camera (pan and zoom).
        ctx.translate(offsetX, offsetY); // guia-js.md
        ctx.scale(scale, scale); // guia-js.md

        // Draws edges first so they stay below nodes.
        GraphCanvas.drawEdges(ctx, nodes, edges, {
            isDirected: graphData && graphData.type === 'directed',
            isWeighted: graphData && graphData.weighted,
            showWeights
        }); // Function defined in: graph/canvas.js
        // Draws nodes above edges.
        GraphCanvas.drawNodes(ctx, nodes, { showLabels }); // Function defined in: graph/canvas.js

        // Restores the brush to its normal state.
        ctx.restore(); // guia-js.md
    }

    // ===== PUBLIC API (WHAT OTHER FILES CAN USE) =====

    /**
     * Function: loadGraph
     * What does it receive?:
     *  - data (JSON object): All graph information to show.
     * What does it do?: Clears previous variables, copies data, initializes physics,
     * and updates the HTML interface to hide the empty state.
     */
    function loadGraph(data) {
        hideContextCard(); // Hide the card when loading a new graph
        // Stops any previous physics animation that may be running.
        if (animFrame) cancelAnimationFrame(animFrame); // guia-js.md
        graphData = data;

        // Builds the object array used by the physics simulation.
        nodes = data.nodes.map((n, i) => ({
            id: n.id,
            label: n.label,
            // If a node has no color, assign one from the base palette cyclically.
            color: n.color || GraphCanvas.DEFAULT_COLORS[i % GraphCanvas.DEFAULT_COLORS.length],
            x: 0, y: 0, vx: 0, vy: 0, fixed: false
        }));

        edges = data.edges.map(e => ({
            from: e.from,
            to: e.to,
            weight: e.weight
        }));

        // Updates information labels in the floating panel.
        document.getElementById('canvas-empty-state').classList.add('hidden');
        document.getElementById('canvas-controls').classList.remove('hidden');
        document.getElementById('graph-info-panel').classList.remove('hidden');
        document.getElementById('info-graph-name').textContent = data.name;
        document.getElementById('info-nodes').textContent = nodes.length;
        document.getElementById('info-edges').textContent = edges.length;
        // Ternary operators create labels such as "Dirigido - Ponderado".
        document.getElementById('info-type').textContent =
            (data.type === 'directed' ? 'Dirigido' : 'No dirigido') +
            (data.weighted ? ' - Ponderado' : '');

        // Resets the camera.
        scale = 1;
        offsetX = 0;
        offsetY = 0;

        // Starts the simulation.
        initLayout();
    }

    /**
     * Function: clear
     * What does it do?: Fully empties the screen, stops animation, and restores
     * the large "Select a graph" empty state.
     */
    function clear() {
        hideContextCard(); // Hide the card when clearing the canvas
        if (animFrame) cancelAnimationFrame(animFrame); // guia-js.md
        nodes = [];
        edges = [];
        graphData = null;
        const cw = canvas.width / GraphCanvas.getPixelRatio();
        const ch = canvas.height / GraphCanvas.getPixelRatio();
        ctx.clearRect(0, 0, cw, ch); // guia-js.md

        document.getElementById('canvas-empty-state').classList.remove('hidden');
        document.getElementById('canvas-controls').classList.add('hidden');
        document.getElementById('graph-info-panel').classList.add('hidden');
    }

    /**
     * Function: renderPreview
     * What does it receive?:
     *  - canvasEl (HTML element): The small preview drawing area.
     *  - data (graph object): The graph data to visualize.
     * What does it do?: Draws a static mini version of a graph in the Editor.
     * It has no physics or animations; it distributes nodes in a circle and draws them.
     * Why does it exist?: To reuse drawing logic in the editor preview area.
     */
    function renderPreview(canvasEl, data) {
        const prepared = GraphCanvas.resizeToParent(canvasEl); // Function defined in: graph/canvas.js
        const pCtx = prepared.ctx;
        const w = prepared.width;
        const h = prepared.height;
        pCtx.clearRect(0, 0, w, h); // guia-js.md

        // If no data was sent, stop.
        if (!data || !data.nodes || data.nodes.length === 0) return;

        // Positions nodes in a fixed mathematical circle.
        const pNodes = GraphCanvas.createCircularNodes(data.nodes, w, h, {
            radiusFactor: 0.3,
            angleOffset: -Math.PI / 2
        }); // Function defined in: graph/canvas.js

        // Draws edges and nodes with smaller preview dimensions.
        GraphCanvas.drawEdges(pCtx, pNodes, data.edges || [], {
            isDirected: data.type === 'directed',
            isWeighted: false,
            showWeights: false,
            nodeRadius: 12,
            lineWidth: 1.5,
            arrowLength: 8,
            arrowSpread: 0.4,
            arrowColor: 'rgba(108,99,255,0.6)',
            edgeColor: 'rgba(108,99,255,0.35)',
            loopRadius: 12
        }); // Function defined in: graph/canvas.js

        GraphCanvas.drawNodes(pCtx, pNodes, {
            nodeRadius: 12,
            showGlow: false,
            centerDotRadius: 3,
            fillAlpha: 0.18,
            labelFont: '600 10px "Inter", sans-serif',
            labelOffset: 12
        }); // Function defined in: graph/canvas.js
    }

    /**
     * Function: onContextMenu
     * What does it receive?:
     *  - e (event): Mouse right-click event.
     * What does it do?: Intercepts the right-click on the canvas. If it happened over a node,
     * calculates its mathematical properties and shows the floating info card. If it happened over
     * empty space, it hides any active card.
     * What does it return?: Nothing (undefined).
     */
    function onContextMenu(e) {//note: only active the card with information of the node.
        // Prevent the browser's default context menu from appearing.
        e.preventDefault();

        // Check if there is an actual node under the cursor position on screen.
        const node = findNodeAt(e.clientX, e.clientY);

        if (node) {
            // If the user right-clicked on a node, show its technical details.
            showNodeDetails(node, e.clientX, e.clientY);
        } else {
            // If the user right-clicked on empty space, hide the floating info card.
            hideContextCard();
        }
    }

    /**
     * Function: showNodeDetails
     * What does it receive?:
     *  - node (object): The selected node object.
     *  - clientX (number): X coordinate of the click on the physical screen.
     *  - clientY (number): Y coordinate of the click on the physical screen.
     * What does it do?: Calculates key graph theory statistics for the given node
     * (degree, direct neighbors, incoming/outgoing connections, and accumulated weight),
     * updates the floating HTML card, and positions it intelligently on screen.
     * What does it return?: Nothing (undefined).
     */
    function showNodeDetails(node, clientX, clientY) {
        const card = document.getElementById('node-context-card');
        if (!card) return; // If the card does not exist in the HTML, stop the function.

        // --- 1. DETERMINE THE GRAPH TYPE ---
        const isDirected = graphData && graphData.type === 'directed';
        const isWeighted = graphData && graphData.weighted;

        // --- 2. FILTER RELATED EDGES ---
        // Find all edges connected to this node (incident edges).
        const incidentEdges = edges.filter(e => e.from === node.id || e.to === node.id);

        // Find incoming edges (pointing to this node).
        const incomingEdges = edges.filter(e => e.to === node.id);

        // Find outgoing edges (originating from this node).
        const outgoingEdges = edges.filter(e => e.from === node.id);

        // --- 3. CALCULATE DEGREE ---
        let degree = 0;
        if (isDirected) {
            // In directed graphs, degree is the sum of incoming and outgoing edges.
            degree = incomingEdges.length + outgoingEdges.length;
        } else {
            // In undirected graphs, count all incident connections.
            // Theoretical note: A self-loop counts as degree 2.
            incidentEdges.forEach(e => {
                if (e.from === e.to) {
                    degree += 2; // The loop enters and exits the same node.
                } else {
                    degree += 1; // Normal edge between two different nodes.
                }
            });
        }

        // --- 4. CALCULATE NEIGHBORS ---
        // Use a Set to avoid duplicates if the same node is connected multiple times.
        const neighborIds = new Set();
        incidentEdges.forEach(e => {
            if (e.from !== node.id) neighborIds.add(e.from);
            if (e.to !== node.id) neighborIds.add(e.to);
        });

        // Convert neighbor IDs to their human-readable names (labels).
        const neighborLabels = [];
        neighborIds.forEach(id => {
            const n = nodes.find(item => item.id === id);
            if (n) neighborLabels.push(n.label);
        });

        // If there are neighbors, join them with commas. If isolated, show 'Ninguno'.
        const neighborsText = neighborLabels.length > 0 ? neighborLabels.join(', ') : 'Ninguno';

        // --- 5. INCOMING AND OUTGOING CONNECTIONS ---
        let inputsText, outputsText;
        if (isDirected) {
            inputsText = String(incomingEdges.length);
            outputsText = String(outgoingEdges.length);
        } else {
            // In an undirected graph, incoming/outgoing does not apply.
            inputsText = 'N/A';
            outputsText = 'N/A';
        }

        // --- 6. CALCULATE ACCUMULATED WEIGHT ---
        let weightText = '';
        let weightTextIn = '';
        let weightTextOut = '';
        if (isWeighted) {
            // Sum the numeric weights of all edges associated with the node.
            const sumOfWeights = incidentEdges.reduce((sum, e) => sum + (parseFloat(e.weight) || 0), 0);
            
            if (isDirected) {
                // If directed, also split the sum into incoming and outgoing weights.
                const incomingWeight = incomingEdges.reduce((sum, e) => sum + (parseFloat(e.weight) || 0), 0);
                const outgoingWeight = outgoingEdges.reduce((sum, e) => sum + (parseFloat(e.weight) || 0), 0);
                weightText = `${sumOfWeights.toFixed(1)}`;
                weightTextIn = `${incomingWeight.toFixed(1)}`;
                weightTextOut = `${outgoingWeight.toFixed(1)}`;
            } else {
                weightText = sumOfWeights.toFixed(1);
            }
        } else {
            // If the graph has no weighted edges.
            weightText = 'N/A';
        }

        // --- 7. UPDATE HTML CARD ELEMENTS ---
        document.getElementById('ctx-node-title').textContent = `Nodo ${node.label}`;
        document.getElementById('ctx-node-id').textContent = node.id;
        document.getElementById('ctx-node-degree').textContent = degree;
        document.getElementById('ctx-node-neighbors').textContent = neighborsText;
        if (isDirected) {
            document.getElementById('ctx-directed-info').style.display = 'flex';
            document.getElementById('ctx-node-inputs').textContent = inputsText;
            document.getElementById('ctx-node-outputs').textContent = outputsText;
        } else {
            document.getElementById('ctx-directed-info').style.display = 'none';
        }
        if (isWeighted) {
            document.querySelectorAll('#ctx-weighted-info').forEach(element => {
                element.style.display = 'flex';
            });
            document.getElementById('ctx-node-weight').textContent = weightText;
            document.getElementById('ctx-node-weight-in').textContent = weightTextIn;
            document.getElementById('ctx-node-weight-out').textContent = weightTextOut;
        } else {
            document.querySelectorAll('#ctx-weighted-info').forEach(element => {
                element.style.display = 'none';
            });
        }

        // Update the card's color dot to match the node's color.
        const colorDot = document.getElementById('ctx-node-color');
        if (colorDot) {
            colorDot.style.backgroundColor = node.color;
            // Add a subtle glow that matches the node color for extra styling.
            colorDot.style.boxShadow = `0 0 8px ${node.color}`;
        }

        // --- 8. POSITION THE CARD WITHOUT LEAVING THE SCREEN ---
        const rect = canvas.getBoundingClientRect();
        let left = clientX - rect.left + 12; // Horizontal position offset to avoid covering the cursor.
        let top = clientY - rect.top + 12;  // Vertical position offset.

        // Estimated card dimensions to calculate screen boundaries.
        const cardWidth = 260;
        const cardHeight = 230;
        const containerWidth = rect.width;
        const containerHeight = rect.height;

        // If the card would overflow to the right, move it to the left of the cursor.
        if (left + cardWidth > containerWidth) {
            left = clientX - rect.left - cardWidth - 12;
        }
        // If the card would overflow to the bottom, move it above the cursor.
        if (top + cardHeight > containerHeight) {
            top = clientY - rect.top - cardHeight - 12;
        }

        // Apply the calculated coordinates in pixels.
        card.style.left = `${Math.max(10, left)}px`;
        card.style.top = `${Math.max(10, top)}px`;

        // Show the card by removing the 'hidden' class.
        card.classList.remove('hidden');
    }

    /**
     * Function: hideContextCard
     * What does it do?: Hides the floating node details card.
     * What does it return?: Nothing (undefined).
     */
    function hideContextCard() {
        const card = document.getElementById('node-context-card');
        if (card) {
            card.classList.add('hidden');
        }
    }

    // Returns the public methods that app files need to invoke.
    return { init, resize, loadGraph, clear, renderPreview };
})();

// Exposes the module for classic browser scripts.
window.Visualizer = Visualizer;
