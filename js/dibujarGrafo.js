/**
 * ============================================================
 * DIBUJAR GRAFO — Renderiza grafos en canvas
 * ============================================================
 * Este módulo se encarga de TODO lo visual del grafo:
 * - Dibujar nodos (círculos con color y etiqueta)
 * - Dibujar aristas (líneas entre nodos, con flechas si es dirigido)
 * - Layout automático con algoritmo "force-directed" (los nodos se acomodan solos)
 * - Interacción: zoom con rueda, arrastrar nodos, desplazar el canvas
 * - Mini-preview para el editor
 *
 * Usa el nombre "Visualizer" como módulo para que el editor y la app
 * puedan llamar a Visualizer.loadGraph(), Visualizer.renderPreview(), etc.
 * ============================================================
 */
const Visualizer = (function () {

    // ===================================================================
    // CONSTANTES
    // ===================================================================

    const NODE_RADIUS = 22; // Tamaño de cada nodo en pixeles

    // Colores predeterminados para nodos que no tienen color asignado
    const DEFAULT_COLORS = [
        '#6C63FF', '#00D4AA', '#FF6B9D', '#FFB347',
        '#4ECDC4', '#A78BFA', '#F472B6', '#34D399',
        '#FB923C', '#60A5FA', '#C084FC', '#22D3EE'
    ];


    // ===================================================================
    // ESTADO INTERNO (variables que solo usa este módulo)
    // ===================================================================

    let canvas, ctx;           // El canvas HTML y su contexto 2D
    let nodes = [];            // Nodos con posiciones x, y calculadas
    let edges = [];            // Aristas del grafo actual
    let graphData = null;      // Datos originales del grafo cargado

    // Cámara: controla qué parte del canvas se ve
    let offsetX = 0, offsetY = 0; // Desplazamiento (pan)
    let scale = 1;                // Nivel de zoom

    // Control de interacciones del ratón
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    let dragNode = null;
    let isDragging = false;

    // Opciones de visualización (se activan/desactivan con los botones)
    let showLabels = true;
    let showWeights = true;

    // Simulación del layout force-directed
    let animFrame = null;
    let simulationRunning = false;
    let simulationAlpha = 1; // "Energía" de la simulación, se reduce hasta que se detiene


    // ===================================================================
    // INICIALIZACIÓN
    // ===================================================================

    // Prepara el canvas y conecta todos los eventos
    function init() {
        canvas = document.getElementById('graph-canvas');
        ctx = canvas.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        bindCanvasEvents();
        bindControlEvents();
    }

    // Ajusta el tamaño del canvas al tamaño de su contenedor
    // (necesario para que se vea nítido en pantallas de alta resolución)
    function resizeCanvas() {
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth * devicePixelRatio;
        canvas.height = parent.clientHeight * devicePixelRatio;
        canvas.style.width = parent.clientWidth + 'px';
        canvas.style.height = parent.clientHeight + 'px';
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
        if (graphData) render();
    }


    // ===================================================================
    // EVENTOS DEL CANVAS (ratón: clic, arrastrar, rueda)
    // ===================================================================

    function bindCanvasEvents() {
        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        canvas.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('mouseleave', onMouseUp);
        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('dblclick', onDoubleClick);
    }

    // Al hacer clic: si hay un nodo debajo, lo arrastramos; si no, movemos el canvas
    function onMouseDown(e) {
        const node = findNodeAt(e.clientX, e.clientY);
        if (node) {
            dragNode = node;
            isDragging = true;
            node.fixed = true;
            canvas.style.cursor = 'grabbing';
        } else {
            isPanning = true;
            panStart = { x: e.clientX - offsetX, y: e.clientY - offsetY };
            canvas.style.cursor = 'grabbing';
        }
    }

    // Al mover el ratón: arrastra nodo o desplaza canvas
    function onMouseMove(e) {
        if (isDragging && dragNode) {
            const { x, y } = screenToWorld(e.clientX, e.clientY);
            dragNode.x = x;
            dragNode.y = y;
            dragNode.vx = 0;
            dragNode.vy = 0;
            render();
        } else if (isPanning) {
            offsetX = e.clientX - panStart.x;
            offsetY = e.clientY - panStart.y;
            render();
        } else {
            // Cambiar cursor si estamos sobre un nodo
            const node = findNodeAt(e.clientX, e.clientY);
            canvas.style.cursor = node ? 'grab' : 'default';
        }
    }

    // Al soltar el ratón: dejar de arrastrar
    function onMouseUp() {
        if (dragNode) {
            dragNode.fixed = false;
            dragNode = null;
        }
        isDragging = false;
        isPanning = false;
        canvas.style.cursor = 'default';
    }

    // Zoom con la rueda del ratón (hacia el punto donde está el cursor)
    function onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const newScale = Math.max(0.15, Math.min(5, scale * delta));

        // Ajustar desplazamiento para que el zoom se centre en el cursor
        offsetX = mx - (mx - offsetX) * (newScale / scale);
        offsetY = my - (my - offsetY) * (newScale / scale);
        scale = newScale;
        render();
    }

    // Doble clic: centrar y resetear vista
    function onDoubleClick() {
        if (graphData) {
            scale = 1;
            offsetX = 0;
            offsetY = 0;
            centerGraph();
            render();
        }
    }


    // ===================================================================
    // EVENTOS DE LOS BOTONES DE CONTROL (zoom +/-, reset, etiquetas, pesos)
    // ===================================================================

    function bindControlEvents() {
        document.getElementById('btn-zoom-in').addEventListener('click', () => {
            scale = Math.min(scale * 1.25, 5);
            render();
        });

        document.getElementById('btn-zoom-out').addEventListener('click', () => {
            scale = Math.max(scale / 1.25, 0.2);
            render();
        });

        document.getElementById('btn-reset-view').addEventListener('click', () => {
            scale = 1;
            offsetX = 0;
            offsetY = 0;
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
    }


    // ===================================================================
    // FUNCIONES AUXILIARES DE COORDENADAS
    // ===================================================================

    // Convierte coordenadas de pantalla (donde hizo clic el usuario)
    // a coordenadas del "mundo" del grafo (teniendo en cuenta zoom y desplazamiento)
    function screenToWorld(sx, sy) {
        const rect = canvas.getBoundingClientRect();
        const x = (sx - rect.left - offsetX) / scale;
        const y = (sy - rect.top - offsetY) / scale;
        return { x, y };
    }

    // Busca si hay un nodo en la posición donde hizo clic el usuario
    function findNodeAt(sx, sy) {
        const { x, y } = screenToWorld(sx, sy);
        // Recorrer de atrás para adelante (los últimos se dibujan encima)
        for (let i = nodes.length - 1; i >= 0; i--) {
            const n = nodes[i];
            const dx = x - n.x;
            const dy = y - n.y;
            if (dx * dx + dy * dy <= (NODE_RADIUS + 4) * (NODE_RADIUS + 4)) {
                return n;
            }
        }
        return null;
    }

    // Centra el grafo en el canvas
    function centerGraph() {
        if (nodes.length === 0) return;
        const cw = canvas.width / devicePixelRatio;
        const ch = canvas.height / devicePixelRatio;

        // Encontrar los límites del grafo
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        nodes.forEach(n => {
            minX = Math.min(minX, n.x);
            maxX = Math.max(maxX, n.x);
            minY = Math.min(minY, n.y);
            maxY = Math.max(maxY, n.y);
        });

        // Calcular el centro del grafo y ajustar el desplazamiento
        const graphCx = (minX + maxX) / 2;
        const graphCy = (minY + maxY) / 2;
        offsetX = cw / 2 - graphCx * scale;
        offsetY = ch / 2 - graphCy * scale;
    }


    // ===================================================================
    // LAYOUT FORCE-DIRECTED (los nodos se acomodan solos)
    // ===================================================================
    // Este algoritmo simula fuerzas físicas:
    // - Los nodos se REPELEN entre sí (como imanes del mismo polo)
    // - Las aristas ATRAEN a los nodos que conectan (como resortes)
    // - Una fuerza de GRAVEDAD empuja todo al centro
    // El resultado es un layout donde los nodos se distribuyen de forma clara.

    // Coloca los nodos en un círculo inicial y arranca la simulación
    function initLayout() {
        const cw = canvas.width / devicePixelRatio;
        const ch = canvas.height / devicePixelRatio;
        const cx = cw / 2;
        const cy = ch / 2;

        // Posicionar nodos en un círculo como punto de partida
        nodes.forEach((n, i) => {
            const angle = (2 * Math.PI * i) / nodes.length;
            const radius = Math.min(cw, ch) * 0.25;
            n.x = cx + radius * Math.cos(angle);
            n.y = cy + radius * Math.sin(angle);
            n.vx = 0; // Velocidad horizontal
            n.vy = 0; // Velocidad vertical
            n.fixed = false;
        });

        simulationAlpha = 1;
        simulationRunning = true;
        runSimulation();
    }

    // Ejecuta la simulación cuadro a cuadro
    function runSimulation() {
        if (!simulationRunning) return;

        // Hacer 3 pasos de simulación por cuadro (más rápido)
        for (let iter = 0; iter < 3; iter++) {
            simulateStep();
        }

        // Reducir la energía gradualmente hasta que se detenga
        simulationAlpha *= 0.97;
        if (simulationAlpha < 0.005) {
            simulationRunning = false;
        }

        render();
        animFrame = requestAnimationFrame(runSimulation);
    }

    // Un paso de la simulación: calcular fuerzas y mover nodos
    function simulateStep() {
        const repulsion = 5000;      // Fuerza de repulsión entre nodos
        const attraction = 0.008;    // Fuerza de atracción de las aristas
        const damping = 0.85;        // Amortiguación (frena los nodos gradualmente)
        const alpha = simulationAlpha;

        // 1) REPULSIÓN: cada par de nodos se empuja mutuamente
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                let dx = nodes[j].x - nodes[i].x;
                let dy = nodes[j].y - nodes[i].y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                let force = (repulsion / (dist * dist)) * alpha;
                let fx = (dx / dist) * force;
                let fy = (dy / dist) * force;
                if (!nodes[i].fixed) { nodes[i].vx -= fx; nodes[i].vy -= fy; }
                if (!nodes[j].fixed) { nodes[j].vx += fx; nodes[j].vy += fy; }
            }
        }

        // 2) ATRACCIÓN: las aristas jalan a sus nodos conectados
        edges.forEach(e => {
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

        // 3) GRAVEDAD: empuja los nodos suavemente hacia el centro
        const cw = canvas.width / devicePixelRatio;
        const ch = canvas.height / devicePixelRatio;
        const gravity = 0.02 * alpha;
        nodes.forEach(n => {
            if (n.fixed) return;
            n.vx += (cw / 2 - n.x) * gravity;
            n.vy += (ch / 2 - n.y) * gravity;
        });

        // 4) MOVER: aplicar velocidad a cada nodo
        nodes.forEach(n => {
            if (n.fixed) return;
            n.vx *= damping;
            n.vy *= damping;
            n.x += n.vx;
            n.y += n.vy;
        });
    }


    // ===================================================================
    // DIBUJO EN EL CANVAS (render principal)
    // ===================================================================

    // Dibuja todo el grafo: primero aristas, luego nodos
    function render() {
        const cw = canvas.width / devicePixelRatio;
        const ch = canvas.height / devicePixelRatio;
        ctx.clearRect(0, 0, cw, ch);

        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        drawEdges();
        drawNodes();

        ctx.restore();
    }

    // --- Dibujar aristas ---
    function drawEdges() {
        const isDirected = graphData && graphData.type === 'directed';

        edges.forEach(e => {
            const source = nodes.find(n => n.id === e.from);
            const target = nodes.find(n => n.id === e.to);
            if (!source || !target) return;

            ctx.beginPath();
            ctx.strokeStyle = 'rgba(108, 99, 255, 0.35)';
            ctx.lineWidth = 2;

            // Caso especial: arista que conecta un nodo consigo mismo (self-loop)
            if (e.from === e.to) {
                const loopR = 30;
                ctx.arc(source.x, source.y - loopR, loopR, 0.5 * Math.PI, 2.5 * Math.PI);
                ctx.stroke();
            } else {
                ctx.moveTo(source.x, source.y);
                ctx.lineTo(target.x, target.y);
                ctx.stroke();

                // Si el grafo es dirigido, dibujar flecha
                if (isDirected) {
                    drawArrow(source, target);
                }
            }

            // Mostrar el peso de la arista (si aplica)
            if (showWeights && graphData && graphData.weighted && e.weight !== undefined) {
                drawEdgeWeight(source, target, e.weight);
            }
        });
    }

    // Dibuja una flecha en la punta de una arista dirigida
    function drawArrow(source, target) {
        const angle = Math.atan2(target.y - source.y, target.x - source.x);
        const tipX = target.x - NODE_RADIUS * Math.cos(angle);
        const tipY = target.y - NODE_RADIUS * Math.sin(angle);
        const arrowLen = 12;

        ctx.beginPath();
        ctx.fillStyle = 'rgba(108, 99, 255, 0.6)';
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(
            tipX - arrowLen * Math.cos(angle - Math.PI / 7),
            tipY - arrowLen * Math.sin(angle - Math.PI / 7)
        );
        ctx.lineTo(
            tipX - arrowLen * Math.cos(angle + Math.PI / 7),
            tipY - arrowLen * Math.sin(angle + Math.PI / 7)
        );
        ctx.closePath();
        ctx.fill();
    }

    // Dibuja el número del peso en el punto medio de la arista
    function drawEdgeWeight(source, target, weight) {
        const mx = (source.x + target.x) / 2;
        const my = (source.y + target.y) / 2;

        ctx.save();
        ctx.font = '500 11px "JetBrains Mono", monospace';
        const tw = ctx.measureText(String(weight)).width;

        // Fondo oscuro para que el número sea legible
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(mx - tw / 2 - 6, my - 8, tw + 12, 16);

        // El número del peso
        ctx.fillStyle = '#FFB347';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(weight), mx, my);
        ctx.restore();
    }

    // --- Dibujar nodos ---
    function drawNodes() {
        nodes.forEach(n => {
            // Efecto de brillo alrededor del nodo
            const gradient = ctx.createRadialGradient(
                n.x, n.y, NODE_RADIUS * 0.5,
                n.x, n.y, NODE_RADIUS * 2.5
            );
            gradient.addColorStop(0, hexToRgba(n.color, 0.15)); // utilidades.js
            gradient.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.arc(n.x, n.y, NODE_RADIUS * 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Círculo del nodo
            ctx.beginPath();
            ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = hexToRgba(n.color, 0.15); // utilidades.js
            ctx.fill();
            ctx.strokeStyle = n.color;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Punto interior del nodo
            ctx.beginPath();
            ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = n.color;
            ctx.fill();

            // Etiqueta del nodo (debajo del círculo)
            if (showLabels) {
                ctx.font = '600 12px "Inter", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#e8e8f0';
                ctx.fillText(n.label, n.x, n.y + NODE_RADIUS + 16);
            }
        });
    }


    // ===================================================================
    // FUNCIONES PÚBLICAS (las que otros módulos pueden llamar)
    // ===================================================================

    // Carga un grafo y lo muestra en el canvas con animación force-directed
    function loadGraph(data) {
        // Detener cualquier simulación anterior
        if (animFrame) cancelAnimationFrame(animFrame);
        graphData = data;

        // Crear nodos con posiciones iniciales en 0
        nodes = data.nodes.map((n, i) => ({
            id: n.id,
            label: n.label,
            color: n.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
            x: 0, y: 0, vx: 0, vy: 0, fixed: false
        }));

        // Copiar aristas
        edges = data.edges.map(e => ({
            from: e.from,
            to: e.to,
            weight: e.weight
        }));

        // Actualizar la interfaz: ocultar estado vacío, mostrar controles e info
        document.getElementById('canvas-empty-state').classList.add('hidden');
        document.getElementById('canvas-controls').classList.remove('hidden');
        document.getElementById('graph-info-panel').classList.remove('hidden');
        document.getElementById('info-graph-name').textContent = data.name;
        document.getElementById('info-nodes').textContent = nodes.length;
        document.getElementById('info-edges').textContent = edges.length;
        document.getElementById('info-type').textContent =
            (data.type === 'directed' ? 'Dirigido' : 'No dirigido') +
            (data.weighted ? ' · Ponderado' : '');

        // Resetear cámara e iniciar animación
        scale = 1;
        offsetX = 0;
        offsetY = 0;
        initLayout();
    }

    // Limpia el canvas y resetea todo
    function clear() {
        if (animFrame) cancelAnimationFrame(animFrame);
        nodes = [];
        edges = [];
        graphData = null;
        const cw = canvas.width / devicePixelRatio;
        const ch = canvas.height / devicePixelRatio;
        ctx.clearRect(0, 0, cw, ch);
        document.getElementById('canvas-empty-state').classList.remove('hidden');
        document.getElementById('canvas-controls').classList.add('hidden');
        document.getElementById('graph-info-panel').classList.add('hidden');
    }

    // Dibuja una mini-preview del grafo en un canvas pequeño (para el editor)
    // Es una versión simplificada: sin zoom, sin arrastre, sin animación
    function renderPreview(canvasEl, data) {
        const pCtx = canvasEl.getContext('2d');
        const parent = canvasEl.parentElement;

        // Ajustar tamaño del canvas al contenedor
        canvasEl.width = parent.clientWidth * devicePixelRatio;
        canvasEl.height = parent.clientHeight * devicePixelRatio;
        canvasEl.style.width = parent.clientWidth + 'px';
        canvasEl.style.height = parent.clientHeight + 'px';
        pCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

        const w = parent.clientWidth;
        const h = parent.clientHeight;
        pCtx.clearRect(0, 0, w, h);

        if (!data || !data.nodes || data.nodes.length === 0) return;

        // Posicionar nodos en un círculo (layout estático simple)
        const pNodes = data.nodes.map((n, i) => {
            const angle = (2 * Math.PI * i) / data.nodes.length;
            const r = Math.min(w, h) * 0.3;
            return {
                ...n,
                x: w / 2 + r * Math.cos(angle - Math.PI / 2),
                y: h / 2 + r * Math.sin(angle - Math.PI / 2),
                color: n.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
            };
        });

        const isDirected = data.type === 'directed';
        const nr = 12; // Radio de nodo en la preview (más pequeño)

        // Dibujar aristas de la preview
        (data.edges || []).forEach(e => {
            const s = pNodes.find(n => n.id === e.from);
            const t = pNodes.find(n => n.id === e.to);
            if (!s || !t) return;
            pCtx.beginPath();
            pCtx.strokeStyle = 'rgba(108,99,255,0.35)';
            pCtx.lineWidth = 1.5;
            pCtx.moveTo(s.x, s.y);
            pCtx.lineTo(t.x, t.y);
            pCtx.stroke();

            // Flecha para grafos dirigidos
            if (isDirected && e.from !== e.to) {
                const angle = Math.atan2(t.y - s.y, t.x - s.x);
                const tipX = t.x - nr * Math.cos(angle);
                const tipY = t.y - nr * Math.sin(angle);
                pCtx.beginPath();
                pCtx.fillStyle = 'rgba(108,99,255,0.6)';
                pCtx.moveTo(tipX, tipY);
                pCtx.lineTo(tipX - 8 * Math.cos(angle - 0.4), tipY - 8 * Math.sin(angle - 0.4));
                pCtx.lineTo(tipX - 8 * Math.cos(angle + 0.4), tipY - 8 * Math.sin(angle + 0.4));
                pCtx.closePath();
                pCtx.fill();
            }
        });

        // Dibujar nodos de la preview
        pNodes.forEach(n => {
            pCtx.beginPath();
            pCtx.arc(n.x, n.y, nr, 0, Math.PI * 2);
            pCtx.fillStyle = hexToRgba(n.color, 0.18); // utilidades.js
            pCtx.fill();
            pCtx.strokeStyle = n.color;
            pCtx.lineWidth = 2;
            pCtx.stroke();

            // Punto interior
            pCtx.beginPath();
            pCtx.arc(n.x, n.y, 3, 0, Math.PI * 2);
            pCtx.fillStyle = n.color;
            pCtx.fill();

            // Etiqueta
            pCtx.font = '600 10px "Inter", sans-serif';
            pCtx.textAlign = 'center';
            pCtx.fillStyle = '#e8e8f0';
            pCtx.fillText(n.label, n.x, n.y + nr + 12);
        });
    }


    // Lo que otros archivos pueden usar de este módulo
    return { init, loadGraph, clear, renderPreview };

})();
