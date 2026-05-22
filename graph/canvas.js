/**
 * Graph Canvas Module - Shared drawing and canvas helpers.
 *
 * This module contains the canvas logic used by both the main graph visualizer
 * and the editor preview. Keeping these routines here prevents duplicated
 * resizing, circular layout, edge drawing, arrowhead drawing, and node drawing.
 */

//Note: This archive was saw for explain all details in notes and comments.
const GraphCanvas = (() => {
    // Default color palette used when a node does not provide its own color.
    const DEFAULT_COLORS = [
        '#6C63FF', '#00D4AA', '#FF6B9D', '#FFB347',
        '#4ECDC4', '#A78BFA', '#F472B6', '#34D399',
        '#FB923C', '#60A5FA', '#C084FC', '#22D3EE'
    ];

    const NODE_RADIUS = 16; // Standard radius for nodes in the full visualizer.

    /**
     * Function: getPixelRatio
     * What does it do?: Reads the browser pixel ratio with a safe fallback.
     * What does it return?: A number used to keep canvas drawings sharp.
     */
    function getPixelRatio() {// Note: This is the real pixel ratio of the screen.
        return window.devicePixelRatio || 1;
    }

    /**
     * Function: resizeToParent
     * What does it receive?:
     *  - canvasEl (HTML element): The canvas that should match its parent size.
     * What does it do?: Resizes the canvas internal pixel buffer and visual CSS size.
     * What does it return?: The context and the logical width/height of the canvas.
     */
    function resizeToParent(canvasEl) {// Note: This function resizes the canvas to match its parent.
        //Note create bases variables.
        const ctx = canvasEl.getContext('2d'); // guia-js.md
        const parent = canvasEl.parentElement;
        const ratio = getPixelRatio();
        const width = parent.clientWidth;
        const height = parent.clientHeight;

        //Note: Styles changes.
        canvasEl.width = width * ratio;
        canvasEl.height = height * ratio;
        canvasEl.style.width = width + 'px';
        canvasEl.style.height = height + 'px';

        ctx.setTransform(ratio, 0, 0, ratio, 0, 0); // guia-js.md
        return { ctx, width, height };
    }

    /**
     * Function: screenToWorld
     * What does it receive?: Screen coordinates plus the current camera offset and zoom.
     * What does it do?: Converts a physical mouse position into canvas-world coordinates.
     * What does it return?: An object { x, y } with the real graph coordinates.
     */
    function screenToWorld(canvasEl, sx, sy, offsetX, offsetY, scale) { // Note: Gives the raw mouse position inside the canvas.
        const rect = canvasEl.getBoundingClientRect(); // guia-js.md
        const x = (sx - rect.left - offsetX) / scale;
        const y = (sy - rect.top - offsetY) / scale;
        /**
         * sx/sy = Mouse position on the screen.
         * rect.left/rect.top = Canvas offset relative to the screen.
         * offsetX/offsetY = Camera position inside the canvas.
         * scale = The current zoom level.
         */
        return { x, y };
    }

    /**
     * Function: findNodeAt
     * What does it receive?: A node list, world coordinates, and a clickable radius.
     * What does it do?: Checks whether the user touched any rendered node.
     * What does it return?: The touched node object, or null if the background was touched.
     */
    function findNodeAt(nodes, x, y, radius = NODE_RADIUS) { // Note: In short, this detects whether a node was touched.
        // Loops backward so the visually topmost node is selected first.
        for (let i = nodes.length - 1; i >= 0; i--) {
            const n = nodes[i];
            // Distance between two points using the Pythagorean theorem.
            const dx = x - n.x;
            const dy = y - n.y;
            // If the distance to the center is smaller than the radius, the node was touched.
            if (dx * dx + dy * dy <= (radius + 8) * (radius + 8)) return n;
        }
        return null;
    }

    /**
     * Function: createCircularNodes
     * What does it receive?: Raw graph nodes, canvas dimensions, and layout options.
     * What does it do?: Copies nodes and assigns fixed circular coordinates.
     * What does it return?: A node array ready to draw.
     */
    function createCircularNodes(sourceNodes, width, height, options = {}) {
        const radiusFactor = options.radiusFactor ?? 0.3;
        const angleOffset = options.angleOffset ?? -Math.PI / 2;
        const radius = Math.min(width, height) * radiusFactor;

        return sourceNodes.map((n, i) => {
            const angle = (2 * Math.PI * i) / sourceNodes.length;
            return {
                ...n,
                x: width / 2 + radius * Math.cos(angle + angleOffset),
                y: height / 2 + radius * Math.sin(angle + angleOffset),
                color: n.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
            };
        });
    }

    /**
     * Function: drawArrowhead
     * What does it receive?: A drawing context, source node, target node, and arrow options.
     * What does it do?: Uses trigonometry to draw a triangle pointing toward the target node.
     */
    function drawArrowhead(ctx, source, target, options = {}) { // Note: Arrow tip triangle.
        const nodeRadius = options.nodeRadius ?? NODE_RADIUS;
        const arrowLen = options.arrowLength ?? 12;
        const spread = options.spread ?? Math.PI / 7;
        const color = options.color ?? 'rgba(108, 99, 255, 0.7)';

        // Gets the mathematical angle of the edge.
        const angle = Math.atan2(target.y - source.y, target.x - source.x);

        // Places the arrow tip at the node border instead of inside the node center.
        const tipX = target.x - nodeRadius * Math.cos(angle);
        const tipY = target.y - nodeRadius * Math.sin(angle);
        /**
         * Note:
         * target.x/y = Target node coordinates.
         * nodeRadius = Node radius so the arrow does not enter the circle.
         * Math.cos(angle) and Math.sin(angle) = X/Y displacement based on the edge angle.
         */

        // Traces the triangle and fills it.
        ctx.beginPath(); // guia-js.md
        ctx.fillStyle = color;
        ctx.moveTo(tipX, tipY); // guia-js.md
        ctx.lineTo( // guia-js.md
            tipX - arrowLen * Math.cos(angle - spread),
            tipY - arrowLen * Math.sin(angle - spread)
        );
        ctx.lineTo( // guia-js.md
            tipX - arrowLen * Math.cos(angle + spread),
            tipY - arrowLen * Math.sin(angle + spread)
        );
        ctx.closePath();
        ctx.fill(); // guia-js.md
    }

    /**
     * Function: drawEdges
     * What does it receive?: A context, nodes, edges, and rendering options.
     * What does it do?: Draws graph edges, optional arrows, loops, and weight labels.
     */
    function drawEdges(ctx, nodes, edges, options = {}) { // Note: Draws the edges.
        const nodeRadius = options.nodeRadius ?? NODE_RADIUS;
        const isDirected = Boolean(options.isDirected);
        const isWeighted = Boolean(options.isWeighted);
        const showWeights = options.showWeights ?? true;
        const loopRadius = options.loopRadius ?? nodeRadius;

        edges.forEach(e => {
            const source = nodes.find(n => n.id === e.from);
            const target = nodes.find(n => n.id === e.to);
            if (!source || !target) return;

            // Starts a new path.
            ctx.beginPath(); // guia-js.md | Note: Like lifting the pencil before drawing another line.
            ctx.strokeStyle = options.edgeColor ?? 'rgba(108, 99, 255, 0.35)';
            ctx.lineWidth = options.lineWidth ?? 2;

            if (e.from === e.to) {
                // Special case: The node connects to itself.
                ctx.arc(source.x, source.y - loopRadius, loopRadius, 0.5 * Math.PI, 2.5 * Math.PI); // guia-js.md
                ctx.stroke(); // guia-js.md
            } else {
                // Normal case: A straight line between two nodes.
                ctx.moveTo(source.x, source.y); // guia-js.md
                ctx.lineTo(target.x, target.y); // guia-js.md
                ctx.stroke(); // guia-js.md

                if (isDirected) {
                    drawArrowhead(ctx, source, target, {
                        nodeRadius,
                        arrowLength: options.arrowLength,
                        spread: options.arrowSpread,
                        color: options.arrowColor
                    });
                }
            }

            if (showWeights && isWeighted && e.weight !== undefined) {
                let mx, my;
                if (e.from === e.to) {
                    mx = source.x;
                    my = source.y - 2 * loopRadius;
                } else {
                    mx = (source.x + target.x) / 2;
                    my = (source.y + target.y) / 2;
                }

                ctx.save(); // guia-js.md
                ctx.beginPath(); // Prevents the edge path from being filled, especially loops.
                ctx.fillStyle = options.weightBackground ?? '#0a0a0f';
                ctx.arc(mx, my, nodeRadius * 0.4, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = options.weightColor ?? '#FFB347';
                ctx.font = options.weightFont ?? '500 11px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(e.weight), mx, my);
                ctx.restore(); // guia-js.md
            }
        });
    }

    /**
     * Function: drawNodes
     * What does it receive?: A context, nodes, and rendering options.
     * What does it do?: Draws each node body, optional glow, center dot, and label.
     */
    function drawNodes(ctx, nodes, options = {}) { // Note: Draws all node parameters.
        const nodeRadius = options.nodeRadius ?? NODE_RADIUS;
        const showLabels = options.showLabels ?? true;
        const showGlow = options.showGlow ?? true;
        const centerDotRadius = options.centerDotRadius ?? 5;

        nodes.forEach(n => {
            if (showGlow) {
                // Layer 1: Soft outer glow using a radial gradient.
                const gradient = ctx.createRadialGradient(n.x, n.y, nodeRadius * 0.8, n.x, n.y, nodeRadius * 2);
                gradient.addColorStop(0, hexToRgba(n.color, options.glowAlpha ?? 0.25));
                gradient.addColorStop(1, 'transparent');
                ctx.beginPath(); // guia-js.md
                ctx.fillStyle = gradient;
                ctx.arc(n.x, n.y, nodeRadius * 2.5, 0, Math.PI * 2); // guia-js.md
                ctx.fill(); // guia-js.md
            }

            // Layer 2: Main transparent node circle.
            ctx.beginPath(); // guia-js.md
            ctx.arc(n.x, n.y, nodeRadius, 0, Math.PI * 2); // guia-js.md
            ctx.fillStyle = hexToRgba(n.color, options.fillAlpha ?? 0.15);
            ctx.fill(); // guia-js.md

            // Layer 3: Solid node border.
            ctx.strokeStyle = n.color;
            ctx.lineWidth = options.borderWidth ?? 2;
            ctx.stroke(); // guia-js.md

            // Layer 4: Small solid center dot.
            ctx.beginPath(); // guia-js.md
            ctx.arc(n.x, n.y, centerDotRadius, 0, Math.PI * 2); // guia-js.md
            ctx.fillStyle = n.color;
            ctx.fill(); // guia-js.md

            // Layer 5: Node label text.
            if (showLabels) {
                ctx.font = options.labelFont ?? '750 12px "Inter", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = options.labelColor ?? '#e8e8f0';
                ctx.fillText(n.label, n.x, n.y + nodeRadius + (options.labelOffset ?? 16));
            }
        });
    }

    return {
        DEFAULT_COLORS,
        NODE_RADIUS,
        getPixelRatio,
        resizeToParent,
        screenToWorld,
        findNodeAt,
        createCircularNodes,
        drawArrowhead,
        drawEdges,
        drawNodes
    };
})();

// Exposes the module for classic browser scripts and inline handlers.
window.GraphCanvas = GraphCanvas;
