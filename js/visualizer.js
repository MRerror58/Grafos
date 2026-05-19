/**
 * Visualizer Module (visualizer.js) — Renderiza grafos en un canvas usando layout de fuerzas.
 * 
 * Este módulo dibuja físicamente los círculos (nodos) y las líneas (aristas) en pantalla.
 * Usa matemáticas para simular físicas (atracción y repulsión) para que el grafo se organice solo.
 * Utiliza el Patrón Módulo (IIFE) para no chocar con las variables del editor.
 */
const Visualizer = (() => {
    // Variables globales para el dibujo
    let canvas, ctx;    // canvas es el lienzo HTML, ctx es el "pincel" 2D
    let nodes = [];     // Lista de nodos a dibujar
    let edges = [];     // Lista de conexiones a dibujar
    let graphData = null; // Toda la información del grafo cargado

    // Cámara / Vista (Para el Zoom y el Desplazamiento)
    let offsetX = 0, offsetY = 0; // Cuánto se ha movido la cámara en X y Y
    let scale = 1;                // Nivel de zoom (1 = 100%)
    let isPanning = false;        // ¿El usuario está arrastrando el fondo?
    let panStart = { x: 0, y: 0 }; // Coordenada donde el usuario empezó a arrastrar

    // Interacción con los nodos
    let dragNode = null;          // Nodo que el usuario está agarrando en este momento
    let isDragging = false;       // ¿El usuario está arrastrando un nodo?

    // Opciones visuales
    let showLabels = true;        // Mostrar/Ocultar nombres de nodos
    let showWeights = true;       // Mostrar/Ocultar números de las aristas

    // Animación de físicas
    let animFrame = null;         // Referencia a la animación para poder detenerla
    let simulationRunning = false;// ¿Están las físicas calculándose?
    let simulationAlpha = 1;      // "Temperatura" de la simulación. Empieza en 1 y baja a 0.

    // Paleta de colores por defecto para los nodos
    const DEFAULT_COLORS = [
        '#6C63FF', '#00D4AA', '#FF6B9D', '#FFB347',
        '#4ECDC4', '#A78BFA', '#F472B6', '#34D399',
        '#FB923C', '#60A5FA', '#C084FC', '#22D3EE'
    ];

    const NODE_RADIUS = 22; // Tamaño del círculo del nodo

    /**
     * Función: init
     * ¿Qué recibe?: Nada.
     * ¿Qué hace?: Configura el lienzo (canvas) buscando su elemento en el HTML, ajusta 
     * su tamaño para que quepa en la pantalla y le conecta los eventos del ratón.
     * ¿Qué devuelve?: Nada.
     */
    function init() {
        canvas = document.getElementById('graph-canvas'); // Nota: Donde se dibujan los grafos. Incialmente elemento vacio.
        ctx = canvas.getContext('2d'); // guia-js.md | // Pedimos un contexto 2D para poder dibujar formas

        resizeCanvas();
        // Si el usuario cambia el tamaño de la ventana del navegador, reajustamos el canvas
        window.addEventListener('resize', resizeCanvas);

        bindCanvasEvents();
        bindControlEvents();
    }

    /**
     * Función: resizeCanvas
     * ¿Qué hace?: Toma las dimensiones de la caja padre en el HTML y ajusta la 
     * resolución interna del canvas multiplicándola por el "devicePixelRatio" 
     * para que no se vea borroso en pantallas modernas (como las Retina de Mac).
     */
    function resizeCanvas() {
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth * devicePixelRatio;
        canvas.height = parent.clientHeight * devicePixelRatio;
        canvas.style.width = parent.clientWidth + 'px';
        canvas.style.height = parent.clientHeight + 'px';

        // Ajustamos la escala base del dibujo
        ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); // guia-js.md

        // Si ya hay un grafo cargado, lo repintamos
        if (graphData) render();
    }

    /**
     * Función: bindCanvasEvents
     * ¿Qué hace?: "Enchufa" los detectores de ratón directamente sobre el canvas.
     */
    function bindCanvasEvents() {
        canvas.addEventListener('mousedown', onMouseDown);   // Cuando el usuario presiona el clic
        canvas.addEventListener('mousemove', onMouseMove);   // Cuando mueve el ratón
        canvas.addEventListener('mouseup', onMouseUp);       // Cuando suelta el clic
        canvas.addEventListener('mouseleave', onMouseUp);    // Cuando el ratón sale de la zona del canvas
        // wheel es la rueda del ratón (para hacer zoom)
        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('dblclick', onDoubleClick);  // Doble clic para centrar la cámara
    }

    /**
     * Función: bindControlEvents
     * ¿Qué hace?: Conecta los botones de la interfaz de usuario (Zoom In, Out, Mostrar Etiquetas)
     * a las variables de estado que controlan la cámara y vuelve a dibujar el canvas.
     */
    function bindControlEvents() {// Nota: Botones de zoom y mostrar etiquetas
        document.getElementById('btn-zoom-in').addEventListener('click', () => {
            scale = Math.min(scale * 1.25, 5); // Aumenta la escala (máximo 5x)
            render();
        });
        document.getElementById('btn-zoom-out').addEventListener('click', () => {
            scale = Math.max(scale / 1.25, 0.2); // Disminuye la escala (mínimo 0.2x)
            render();
        });
        document.getElementById('btn-reset-view').addEventListener('click', () => {
            scale = 1; offsetX = 0; offsetY = 0; // Resetea cámara
            if (graphData) centerGraph(); // Centra el contenido en pantalla
            render();
        });
        document.getElementById('btn-toggle-labels').addEventListener('click', function () {
            showLabels = !showLabels; // Invierte el valor (true a false y viceversa)
            this.classList.toggle('active', showLabels);
            render();
        });
        document.getElementById('btn-toggle-weights').addEventListener('click', function () {
            showWeights = !showWeights;
            this.classList.toggle('active', showWeights);
            render();
        });
    }

    /**
     * Función: screenToWorld
     * ¿Qué recibe?: 
     *  - sx (número): coordenada X de la pantalla.
     *  - sy (número): coordenada Y de la pantalla.
     * ¿Qué hace?: Las matemáticas necesarias para convertir dónde hiciste clic en la pantalla física,
     * a en qué punto imaginario del "mundo infinito" del canvas estás, considerando el Zoom y la Cámara.
     * ¿Qué devuelve?: Objeto { x, y } con las coordenadas reales.
     */
    function screenToWorld(sx, sy) { // Nota: Entregamos la pos del mouse en el canvas
        const rect = canvas.getBoundingClientRect(); // guia-js.md | // Todos los datos del canvas (posicion)
        // Deshacemos matemáticamente el desplazamiento y luego la escala
        const x = (sx - rect.left - offsetX) / scale;
        const y = (sy - rect.top - offsetY) / scale;
        /**
         * sx/sy = Pos mouse en pantalla
         * rect.left/rect.top = Desfase del canvas con respecto a la pantalla
         * offsetX/offsetY = Posicion de la camara en el canvas
         * scale = Literalmente el zoom
         */
        return { x, y };
    }

    /**
     * Función: findNodeAt
     * ¿Qué recibe?: 
     *  - sx (número): coordenada X de la pantalla.
     *  - sy (número): coordenada Y de la pantalla.
     * ¿Qué hace?: Dado un clic del usuario en pantalla, revisa si las coordenadas 
     * tocan a alguno de los círculos (nodos) dibujados.
     * ¿Qué devuelve?: El objeto del nodo si lo tocó, o null si tocó el fondo vacío.
     */
    function findNodeAt(sx, sy) { // Nota: En resumen, es para saber si tocaste un nodo
        const { x, y } = screenToWorld(sx, sy); //Nota: Coordenadas en bruto
        // Recorremos los nodos al revés (para agarrar el que esté pintado más arriba)
        for (let i = nodes.length - 1; i >= 0; i--) {
            const n = nodes[i];
            // Fórmula de la distancia entre dos puntos (Teorema de Pitágoras)
            const dx = x - n.x;
            const dy = y - n.y;
            // Si la distancia al centro es menor al radio | Nota: Es para agarrar el centro del nodo
            if (dx * dx + dy * dy <= (NODE_RADIUS + 4) * (NODE_RADIUS + 4)) return n;
        }
        return null;
    }

    // ===== EVENTOS DEL RATÓN EN EL CANVAS =====

    function onMouseDown(e) { //Nota: Detecta si tocaste un nodo o el fondo
        const node = findNodeAt(e.clientX, e.clientY);
        if (node) {
            // Si tocó un nodo, lo agarra para arrastrarlo
            dragNode = node;
            isDragging = true;
            node.fixed = true; // Lo anclamos para que las físicas no se lo lleven
            canvas.style.cursor = 'grabbing'; // Cambiamos el cursor a "mano cerrada"
        } else {
            // Si tocó el fondo vacío, empieza a arrastrar la cámara
            isPanning = true;
            panStart = { x: e.clientX - offsetX, y: e.clientY - offsetY };
            canvas.style.cursor = 'grabbing';
        }
    }

    function onMouseMove(e) { //Nota: Mueve el nodo arrastrado o arrastra el fondo
        if (isDragging && dragNode) {
            // Movemos el nodo a las nuevas coordenadas del ratón
            const { x, y } = screenToWorld(e.clientX, e.clientY); //Nota: Bloqueamos la vista para q no se mueva
            dragNode.x = x;
            dragNode.y = y;
            dragNode.vx = 0; // Le quitamos su "velocidad" física
            dragNode.vy = 0;

            // Reactivamos ("calentamos") la simulación para que los demás nodos reaccionen al movimiento
            simulationAlpha = 0.5; // Un valor intermedio para que se mueva suavemente
            if (!simulationRunning) {
                simulationRunning = true;
                runSimulation();
            }

            render();
        } else if (isPanning) {
            // Movemos la cámara
            offsetX = e.clientX - panStart.x;
            offsetY = e.clientY - panStart.y;
            render();
        } else {
            // Solo hover (pasar el ratón por encima sin dar clic)
            const node = findNodeAt(e.clientX, e.clientY); //tocaste un nodo?
            canvas.style.cursor = node ? 'grab' : 'default'; // Si pasa por un nodo, pone la "manito"
        }
    }

    function onMouseUp() {//Nota: Cuando suelta el clic
        // Cuando suelta el clic, soltamos el nodo o la cámara
        if (dragNode) {
            dragNode.fixed = false; // El nodo vuelve a estar sujeto a las físicas
            dragNode = null;

            // Al soltarlo, le damos un último empujón a la física para que se acomode si quedó muy cerca de otros
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

    function onWheel(e) {//Nota: Rueda del raton para hacer zoom
        // guia-js.md | // e.preventDefault() evita que la página web entera haga scroll hacia abajo
        e.preventDefault(); // guia-js.md

        // Si la rueda gira hacia adelante, acerca el zoom. Si no, lo aleja.
        const delta = e.deltaY > 0 ? 0.9 : 1.1;

        const rect = canvas.getBoundingClientRect(); // guia-js.md
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Calculamos la nueva escala manteniéndola entre 0.15 y 5
        const newScale = Math.max(0.15, Math.min(5, scale * delta));

        // Matemáticas para hacer el zoom exactamente donde está el ratón apuntando
        offsetX = mx - (mx - offsetX) * (newScale / scale);
        offsetY = my - (my - offsetY) * (newScale / scale);

        scale = newScale;
        render(); // Repintamos todo con la nueva cámara
    }

    function onDoubleClick() {//Nota: Doble clic para centrar la cámara
        if (graphData) {
            scale = 1; offsetX = 0; offsetY = 0;
            centerGraph();
            render();
        }
    }

    // ===== FÍSICAS Y SIMULACIÓN (FORCE-DIRECTED LAYOUT) =====

    /**
     * Función: initLayout
     * ¿Qué hace?: Cuando cargamos un grafo nuevo, no sabemos dónde poner los nodos 
     * en la pantalla. Esta función los pone a todos en un círculo perfecto y enciende 
     * la "gravedad" para que se reacomoden solos mágicamente.
     */
    function initLayout() {//Nota: Posicion inicial de los notos
        // Nota: Calculamos dimenciones del canvas
        const cw = canvas.width / devicePixelRatio;
        const ch = canvas.height / devicePixelRatio;
        const cx = cw / 2; // Centro X
        const cy = ch / 2; // Centro Y

        // Repartimos los nodos en un círculo matemático
        nodes.forEach((n, i) => {
            const angle = (2 * Math.PI * i) / nodes.length;//genera un circulo
            const radius = Math.min(cw, ch) * 0.05;//tamaño del mismo

            //ubica los nodos en el circulo
            n.x = cx + radius * Math.cos(angle);
            n.y = cy + radius * Math.sin(angle);

            n.vx = 0; // Velocidad X en 0
            n.vy = 0; // Velocidad Y en 0
            n.fixed = false; // Cancelamos temporalmente la simulación
        });

        simulationAlpha = 1;      // Calor inicial al máximo
        simulationRunning = true; // Encendemos el motor
        runSimulation();          // Iniciamos la animación
    }

    /**
     * Función: runSimulation
     * ¿Qué hace?: Un ciclo de animación que se llama a sí mismo constantemente
     * (usando requestAnimationFrame) hasta que la simulación "se enfría".
     */
    function runSimulation() {//Nota: Inicio dela simualcion (No las fisicas)
        if (!simulationRunning) return;

        // Para acelerar la animación, aplicamos las físicas 3 veces por cada fotograma de video
        const ITERATIONS = 2;
        for (let iter = 0; iter < ITERATIONS; iter++) {
            simulateStep();
        }

        // Cada fotograma que pasa, el grafo "se enfría" un 3%. 
        // Cuando llegue casi a 0, detenemos la simulación para no gastar batería de la PC.
        simulationAlpha *= 0.96;
        if (simulationAlpha < 0.005) {
            simulationRunning = false;
        }

        render(); // Dibujamos el nuevo fotograma
        animFrame = requestAnimationFrame(runSimulation); // guia-js.md | // "Navegador, vuelve a llamarme en el siguiente cuadro"
    }

    /**
     * Función: simulateStep
     * ¿Qué hace?: La magia de las físicas.
     * 1. Nodos se rechazan entre sí (como imanes del mismo polo).
     * 2. Las aristas (líneas) actúan como resortes que atraen a los nodos que conectan.
     * 3. Una gravedad central tira de todos los nodos levemente hacia el medio de la pantalla.
     */
    function simulateStep() {//Nota: Fisicas de la simulacion ahora si
        const repulsion = 18000;
        const attraction = 0.004;
        const damping = 0.75; // Fricción, para que no vibren por siempre
        const alpha = simulationAlpha; // Modificador general que va disminuyendo

        // Repulsión: Todos contra todos
        for (let i = 0; i < nodes.length; i++) {//Todos los nodos
            for (let j = i + 1; j < nodes.length; j++) {//El nodo revisa todos los nodos menos a sí mismo
                let dx = nodes[j].x - nodes[i].x; // Distancia en x
                let dy = nodes[j].y - nodes[i].y; // Distancia en y
                let dist = Math.sqrt(dx * dx + dy * dy) || 1; // Distancia euclidiana

                // Entre más cerca estén, más fuerte se repelen
                let force = (repulsion / (dist * dist)) * alpha; // Fuerza de repulsión

                // Aplicamos la fuerza a ambos nodos en direcciones opuestas
                let fx = (dx / dist) * force;
                let fy = (dy / dist) * force;

                // Empujamos a ambos en direcciones opuestas usando sus variables de velocidad (v)
                if (!nodes[i].fixed) { nodes[i].vx -= fx; nodes[i].vy -= fy; }
                if (!nodes[j].fixed) { nodes[j].vx += fx; nodes[j].vy += fy; }
            }
        }

        // Atracción: Solo entre los nodos que están conectados por una línea
        edges.forEach(e => {
            // Busca los nodos reales usando los IDs del edge
            const source = nodes.find(n => n.id === e.from);
            const target = nodes.find(n => n.id === e.to);
            if (!source || !target) return; //Filtramos los que no estan conectados

            let dx = target.x - source.x;
            let dy = target.y - source.y;
            let dist = Math.sqrt(dx * dx + dy * dy) || 1;
            // Entre más estirado esté el "resorte", más fuerte hala para volver a su estado original
            let force = dist * attraction * alpha;
            let fx = (dx / dist) * force;
            let fy = (dy / dist) * force;
            if (!source.fixed) { source.vx += fx; source.vy += fy; }
            if (!target.fixed) { target.vx -= fx; target.vy -= fy; }
        });

        // Gravedad al centro
        const cw = canvas.width / devicePixelRatio;
        const ch = canvas.height / devicePixelRatio;
        const gravity = 0.03 * alpha;
        nodes.forEach(n => {
            if (n.fixed) return; // Nota: Excluye el nodo que tengas agarrado
            n.vx += (cw / 2 - n.x) * gravity; // Aplica fuerza en X hacia el centro (cw = centro de ancho)
            n.vy += (ch / 2 - n.y) * gravity; // Aplica fuerza en Y hacia el centro (ch = centro de alto) 
        });

        // Finalmente, actualizamos la posición XY de cada nodo sumándole la velocidad calculada
        nodes.forEach(n => {//Nota: SI esta agarrado por el mouse, no aplica
            if (n.fixed) return;
            // Aplicar fricción con el aire (damping)
            n.vx *= damping;
            n.vy *= damping;
            n.x += n.vx;
            n.y += n.vy;
        });
    }

    /**
     * Función: centerGraph
     * ¿Qué hace?: Calcula qué tan ancho y alto quedó el dibujo de nodos, 
     * y mueve la cámara para que todo quede perfectamente centrado en pantalla.
     */
    function centerGraph() {//Nota: Centrar la camara con respecto a los nodos
        if (nodes.length === 0) return; //Nota: Si no hay  nodos, no hace nada
        const cw = canvas.width / devicePixelRatio;
        const ch = canvas.height / devicePixelRatio;

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        // Encontramos los bordes extremos del grafo
        nodes.forEach(n => {
            /**
             * Nota: Va remplazando los varloes de el nodo maximo y el nodo minimo de cada direccion
             * para lograr obetener el "cuadrado" que luego usara para centrar la camara.
             */
            minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
            minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
        });

        // Calculamos el centro de todos esos bordes
        const graphCx = (minX + maxX) / 2;
        const graphCy = (minY + maxY) / 2;

        // Movemos la cámara global (offset)
        offsetX = cw / 2 - graphCx * scale;
        offsetY = ch / 2 - graphCy * scale;
    }

    // ===== DIBUJANDO EN EL CANVAS =====

    /**
     * Función: render
     * ¿Qué hace?: Borra la pantalla entera como un pizarrón y vuelve a pintar 
     * todo desde cero. Esto ocurre decenas de veces por segundo en una animación.
     */
    function render() {// Nota: Borra y redibuja todo el canvas. (Solo lo visible)
        /**
         * cw/ch = Ancho/Alto del canvas
         * canvas.width/canvas.height = Tamaño físico del canvas
         * devicePixelRatio = Relación entre píxeles físicos y píxeles lógicos (un pixel a veces puede valer dos pixeles reales)
         */
        const cw = canvas.width / devicePixelRatio;
        const ch = canvas.height / devicePixelRatio;

        // Limpiamos el pizarrón (literalmente se borra)
        ctx.clearRect(0, 0, cw, ch); // guia-js.md

        // Guardamos el estado original del pincel
        // Nota: Guardamo el estado recien borrado
        ctx.save(); // guia-js.md

        // Movemos todo el plano del lienzo según donde esté la cámara (Pan y Zoom)
        ctx.translate(offsetX, offsetY); // guia-js.md
        ctx.scale(scale, scale); // guia-js.md

        // Primero pintamos las líneas (aristas) para que queden por DEBAJO de los círculos
        drawEdges();
        // Luego pintamos los círculos (nodos) por ENCIMA de las líneas
        drawNodes();

        // Restauramos el pincel a su estado normal
        ctx.restore(); // guia-js.md
    }

    /**
     * Función: drawEdges
     * ¿Qué hace?: Dibuja líneas matemáticas entre las coordenadas (X, Y) de los nodos conectados.
     */
    function drawEdges() { //Nota: Dibujamos las aristas.
        const isDirected = graphData && graphData.type === 'directed'; // Si el grafo es dirigido, dibuja una flecha. Si no pues no :v

        edges.forEach(e => { // Por cada arista con variable "e" hacemos esto (forEach funciona como un for pero por elemento)
            const source = nodes.find(n => n.id === e.from); // Busca el nodo de origen
            const target = nodes.find(n => n.id === e.to); // Busca el nodo de destino
            if (!source || !target) return;

            // Empezamos a trazar un nuevo camino
            ctx.beginPath(); // guia-js.md | Nota: Es como levantar el lapiz al escribir otra linea
            ctx.strokeStyle = 'rgba(108, 99, 255, 0.35)'; // Color morado translúcido
            ctx.lineWidth = 2; // Grosor

            // Caso especial: El nodo se conecta consigo mismo
            if (e.from === e.to) {
                const loopR = 22; // Radio del rizo
                // guia-js.md | // ctx.arc() dibuja círculos o arcos. Aquí dibujamos un óvalo encima del nodo.
                ctx.arc(source.x, source.y - loopR, loopR, 0.5 * Math.PI, 2.5 * Math.PI); // guia-js.md
                ctx.stroke(); // guia-js.md | // Dibuja la línea
            } else {
                // Caso normal: línea recta entre nodos
                ctx.moveTo(source.x, source.y); // guia-js.md | // Pone el lápiz en el origen
                ctx.lineTo(target.x, target.y); // guia-js.md | // Traza recta al destino
                ctx.stroke(); // guia-js.md | // Dibuja la línea

                // Si el grafo es dirigido, dibujamos una cabeza de flecha
                if (isDirected) {
                    drawArrow(source, target); // Llama función interna
                }
            }

            // Dibujar la etiqueta numérica (Peso) si está activa
            if (showWeights && graphData && graphData.weighted && e.weight !== undefined) {
                let mx, my;
                if (e.from === e.to) {
                    // Para aristas dirigidas al mismo nodo, colocamos el número en la parte superior del bucle
                    const loopR = 22; // Mismo radio del rizo
                    mx = source.x;
                    my = source.y - 2 * loopR;
                } else {
                    // Calculamos el punto intermedio exacto de la línea
                    mx = (source.x + target.x) / 2;
                    my = (source.y + target.y) / 2;
                }

                ctx.save(); // guia-js.md
                ctx.beginPath(); // Evita que se rellene todo el camino de la arista (especialmente el bucle)
                ctx.fillStyle = '#0a0a0f'; // Color de fondo del letrero
                const tw = ctx.measureText(String(e.weight)).width; // guia-js.md | // Medimos cuánto mide el texto
                // Dibujamos un circulito negro para tapar la línea debajo del número
                ctx.arc(mx, my, NODE_RADIUS * 0.4, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#FFB347'; // Texto naranja
                ctx.font = '500 11px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                // Pintamos el texto
                ctx.fillText(String(e.weight), mx, my);
                ctx.restore(); // guia-js.md
            }
        });
    }

    /**
     * Función: drawArrow
     * ¿Qué hace?: Matemática de trigonometría (atan2, cos, sin) para calcular 
     * el ángulo exacto de la línea y pintar un triángulo en la punta que mire
     * hacia la dirección correcta.
     */
    function drawArrow(source, target) {
        // Obtenemos el ángulo matemático de la línea
        const angle = Math.atan2(target.y - source.y, target.x - source.x);

        // Hacemos que la punta de la flecha termine exactamente en el borde del círculo del nodo, no en el centro
        const tipX = target.x - NODE_RADIUS * Math.cos(angle);
        const tipY = target.y - NODE_RADIUS * Math.sin(angle);

        const arrowLen = 12; // Largo de la flecha

        // Trazamos el triángulo y lo rellenamos
        ctx.beginPath(); // guia-js.md
        ctx.fillStyle = 'rgba(108, 99, 255, 0.6)';
        ctx.moveTo(tipX, tipY); // guia-js.md
        ctx.lineTo( // guia-js.md
            tipX - arrowLen * Math.cos(angle - Math.PI / 7),
            tipY - arrowLen * Math.sin(angle - Math.PI / 7)
        );
        ctx.lineTo( // guia-js.md
            tipX - arrowLen * Math.cos(angle + Math.PI / 7),
            tipY - arrowLen * Math.sin(angle + Math.PI / 7)
        );
        ctx.closePath();
        ctx.fill(); // guia-js.md
    }

    /**
     * Función: drawNodes
     * ¿Qué hace?: Recorre cada nodo y dibuja varias capas encima: el brillo,
     * el círculo sólido, el borde, el punto central y por último su nombre.
     */
    function drawNodes() {
        nodes.forEach(n => {
            // Función definida en: utilidades.js (hexToRgba)
            // Capa 1: Brillo exterior difuminado (Radial Gradient)
            const gradient = ctx.createRadialGradient(n.x, n.y, NODE_RADIUS * 0.5, n.x, n.y, NODE_RADIUS * 2.5);
            gradient.addColorStop(0, hexToRgba(n.color, 0.15));
            gradient.addColorStop(1, 'transparent');
            ctx.beginPath(); // guia-js.md
            ctx.fillStyle = gradient;
            ctx.arc(n.x, n.y, NODE_RADIUS * 2.5, 0, Math.PI * 2); // guia-js.md
            ctx.fill(); // guia-js.md

            // Capa 2: Círculo principal del nodo
            ctx.beginPath(); // guia-js.md
            ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2); // guia-js.md
            ctx.fillStyle = hexToRgba(n.color, 0.15); // Fondo transparente
            ctx.fill(); // guia-js.md

            // Capa 3: Borde sólido del nodo
            ctx.strokeStyle = n.color;
            ctx.lineWidth = 2.5;
            ctx.stroke(); // guia-js.md

            // Capa 4: Punto pequeño sólido en el centro exacto
            ctx.beginPath(); // guia-js.md
            ctx.arc(n.x, n.y, 4, 0, Math.PI * 2); // guia-js.md
            ctx.fillStyle = n.color;
            ctx.fill(); // guia-js.md

            // Capa 5: Nombre del nodo en texto (si el usuario no lo ocultó)
            if (showLabels) {
                ctx.font = '600 12px "Inter", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#e8e8f0'; // Texto claro
                // Pintamos el texto un poco por debajo de la base del nodo (+16px)
                ctx.fillText(n.label, n.x, n.y + NODE_RADIUS + 16);
            }
        });
    }

    // ===== API PÚBLICA (LO QUE OTROS ARCHIVOS PUEDEN USAR) =====

    /**
     * Función: loadGraph
     * ¿Qué recibe?: 
     *  - data (Objeto JSON): Toda la información de un grafo a mostrar.
     * ¿Qué hace?: Limpia las variables anteriores, copia los datos, inicializa la
     * física (initLayout) y cambia la interfaz HTML ocultando el cartel de "pantalla vacía".
     */
    function loadGraph(data) {
        // Detiene cualquier animación de físicas anterior que estuviese corriendo
        if (animFrame) cancelAnimationFrame(animFrame); // guia-js.md
        graphData = data;

        // Construye el arreglo de objetos para la simulación física
        nodes = data.nodes.map((n, i) => ({
            id: n.id,
            label: n.label,
            // Si el nodo no traía color, le asigna uno usando la paleta base cíclicamente (usando módulo %)
            color: n.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
            x: 0, y: 0, vx: 0, vy: 0, fixed: false // Variables físicas en ceros
        }));

        edges = data.edges.map(e => ({
            from: e.from,
            to: e.to,
            weight: e.weight
        }));

        // Actualiza etiquetas de información en el panel flotante de la pantalla
        document.getElementById('canvas-empty-state').classList.add('hidden');
        document.getElementById('canvas-controls').classList.remove('hidden');
        document.getElementById('graph-info-panel').classList.remove('hidden');
        document.getElementById('info-graph-name').textContent = data.name;
        document.getElementById('info-nodes').textContent = nodes.length;
        document.getElementById('info-edges').textContent = edges.length;
        // Operadores ternarios para crear la frase "Dirigido · Ponderado", etc.
        document.getElementById('info-type').textContent =
            (data.type === 'directed' ? 'Dirigido' : 'No dirigido') +
            (data.weighted ? ' · Ponderado' : '');

        // Reiniciamos cámara
        scale = 1;
        offsetX = 0;
        offsetY = 0;

        // Arrancamos simulación
        initLayout();
    }

    /**
     * Función: clear
     * ¿Qué hace?: Vacía por completo la pantalla, mata la animación y restablece
     * el letrero gigante de "Selecciona un grafo".
     */
    function clear() {
        if (animFrame) cancelAnimationFrame(animFrame); // guia-js.md
        nodes = [];
        edges = [];
        graphData = null;
        const cw = canvas.width / devicePixelRatio;
        const ch = canvas.height / devicePixelRatio;
        ctx.clearRect(0, 0, cw, ch); // guia-js.md

        document.getElementById('canvas-empty-state').classList.remove('hidden');
        document.getElementById('canvas-controls').classList.add('hidden');
        document.getElementById('graph-info-panel').classList.add('hidden');
    }

    /**
     * Función: renderPreview
     * ¿Qué recibe?: 
     *  - canvasEl (Elemento HTML): El recuadro pequeño donde dibujar.
     *  - data (Objeto grafo): Los datos a visualizar.
     * ¿Qué hace?: Es una versión "mini" del visualizador. Dibuja un pantallazo 
     * estático y rápido de un grafo en un pequeño recuadro para usarlo dentro del Editor.
     * No tiene físicas ni animaciones, solo distribuye en círculo y pinta.
     * ¿Por qué existe?: Para reciclar código de dibujo en el área del editor.
     */
    function renderPreview(canvasEl, data) {
        // Pedimos contexto al canvas de destino
        const pCtx = canvasEl.getContext('2d'); // guia-js.md
        const parent = canvasEl.parentElement;

        // Ajustamos la escala
        canvasEl.width = parent.clientWidth * devicePixelRatio;
        canvasEl.height = parent.clientHeight * devicePixelRatio;
        canvasEl.style.width = parent.clientWidth + 'px';
        canvasEl.style.height = parent.clientHeight + 'px';
        pCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); // guia-js.md

        const w = parent.clientWidth;
        const h = parent.clientHeight;
        pCtx.clearRect(0, 0, w, h); // guia-js.md | // Limpiamos cuadro

        // Si no mandaron datos, abortamos.
        if (!data || !data.nodes || data.nodes.length === 0) return;

        // Posicionamos matemáticamente en un círculo fijo
        const pNodes = data.nodes.map((n, i) => {
            const angle = (2 * Math.PI * i) / data.nodes.length;
            const r = Math.min(w, h) * 0.3; // Radio del círculo
            return {
                ...n, // Copia todas las propiedades originales
                // Genera coordenadas fijas calculadas con trigonometría básica
                x: w / 2 + r * Math.cos(angle - Math.PI / 2),
                y: h / 2 + r * Math.sin(angle - Math.PI / 2),
                color: n.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
            };
        });

        const isDirected = data.type === 'directed';
        const nr = 12; // Radio más pequeño (porque es una previsualización mini)

        // Pintamos aristas (Mini versión de drawEdges)
        (data.edges || []).forEach(e => {
            const s = pNodes.find(n => n.id === e.from);
            const t = pNodes.find(n => n.id === e.to);
            if (!s || !t) return;

            pCtx.beginPath(); // guia-js.md
            pCtx.strokeStyle = 'rgba(108,99,255,0.35)';
            pCtx.lineWidth = 1.5;
            pCtx.moveTo(s.x, s.y); // guia-js.md
            pCtx.lineTo(t.x, t.y); // guia-js.md
            pCtx.stroke(); // guia-js.md

            // Flechitas miniaturas
            if (isDirected && e.from !== e.to) {
                const angle = Math.atan2(t.y - s.y, t.x - s.x);
                const tipX = t.x - nr * Math.cos(angle);
                const tipY = t.y - nr * Math.sin(angle);
                pCtx.beginPath(); // guia-js.md
                pCtx.fillStyle = 'rgba(108,99,255,0.6)';
                pCtx.moveTo(tipX, tipY); // guia-js.md
                pCtx.lineTo(tipX - 8 * Math.cos(angle - 0.4), tipY - 8 * Math.sin(angle - 0.4)); // guia-js.md
                pCtx.lineTo(tipX - 8 * Math.cos(angle + 0.4), tipY - 8 * Math.sin(angle + 0.4)); // guia-js.md
                pCtx.closePath();
                pCtx.fill(); // guia-js.md
            }
        });

        // Pintamos nodos (Mini versión de drawNodes)
        pNodes.forEach(n => {
            pCtx.beginPath(); // guia-js.md
            pCtx.arc(n.x, n.y, nr, 0, Math.PI * 2); // guia-js.md
            pCtx.fillStyle = hexToRgba(n.color, 0.18); // Función definida en: utilidades.js
            pCtx.fill(); // guia-js.md
            pCtx.strokeStyle = n.color;
            pCtx.lineWidth = 2;
            pCtx.stroke(); // guia-js.md

            pCtx.beginPath(); // guia-js.md
            pCtx.arc(n.x, n.y, 3, 0, Math.PI * 2); // guia-js.md
            pCtx.fillStyle = n.color;
            pCtx.fill(); // guia-js.md

            pCtx.font = '600 10px "Inter", sans-serif';
            pCtx.textAlign = 'center';
            pCtx.fillStyle = '#e8e8f0';
            pCtx.fillText(n.label, n.x, n.y + nr + 12);
        });
    }

    // Retorna (hace públicos) los métodos que se necesitan invocar desde app.js o editor.js
    return { init, loadGraph, clear, renderPreview };
})();
