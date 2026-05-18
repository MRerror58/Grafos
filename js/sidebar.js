/**
 * Sidebar Module — Genera y controla la barra lateral de navegación.
 * 
 * Este archivo usa el "Patrón Módulo" (IIFE: Immediately Invoked Function Expression).
 * ¿Por qué?: Para encapsular (proteger) las variables internas como 'pages' o 'collapsed' 
 * y que no interfieran con el resto del proyecto, revelando solo las funciones públicas.
 */
const Sidebar = (() => {
    // Array (lista) de objetos. Cada objeto define una de las pantallas disponibles en la app.
    const pages = [
        {
            id: 'visualizer',
            label: 'Visualizador',
            // icon es un string de texto que contiene el dibujo del icono en formato vectorial (SVG)
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="12" cy="19" r="2.5"/>
                <line x1="7.2" y1="7" x2="10.3" y2="17.2"/><line x1="16.8" y1="7" x2="13.7" y2="17.2"/><line x1="7.5" y1="6" x2="16.5" y2="6"/>
            </svg>`
        },
        {
            id: 'editor',
            label: 'Editor de Grafos',
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>`
        }
    ];

    // Variable booleana (verdadero/falso) que guarda el estado de la barra (abierta o minimizada)
    let collapsed = false;

    /**
     * Función: render
     * ¿Qué recibe?: Nada.
     * ¿Qué hace?: Construye todo el código HTML de la barra lateral desde JavaScript y lo 
     * inyecta en la página. Luego, llama a bindEvents() para conectar los botones creados.
     * ¿Qué devuelve?: Nada.
     * ¿Por qué existe?: Para generar la interfaz dinámicamente y hacer más fácil 
     * agregar nuevas páginas en el futuro solo modificando el array 'pages'.
     */
    function render() {
        const container = document.getElementById('sidebar-container');

        // Usamos template strings (`...`) para poder escribir en múltiples líneas
        // e insertar variables dinámicamente usando ${}.
        container.innerHTML = `
            <nav class="sidebar" id="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/>
                            <line x1="7" y1="6" x2="17" y2="6"/><line x1="6.5" y1="7.5" x2="10.5" y2="16.5"/><line x1="17.5" y1="7.5" x2="13.5" y2="16.5"/>
                        </svg>
                    </div>
                    <span class="sidebar-brand">GraphLab</span>
                </div>
                <div class="sidebar-nav">
                    ${pages.map((p, i) => `
                        <!-- Si es el primer elemento (i === 0), le añade la clase 'active' para que se vea seleccionado por defecto -->
                        <div class="nav-item ${i === 0 ? 'active' : ''}" data-page="${p.id}" id="nav-${p.id}">
                            ${p.icon}
                            <span class="nav-item-label">${p.label}</span>
                        </div>
                    `).join('')} 
                </div>
                <div class="sidebar-footer">
                    <button class="sidebar-toggle" id="sidebar-toggle">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                        <span class="nav-item-label">Colapsar</span>
                    </button>
                </div>
            </nav>
        `;

        // Llama a la función local para asignar interactividad a lo que acabamos de dibujar
        bindEvents();
    }

    /**
     * Función: bindEvents
     * ¿Qué recibe?: Nada.
     * ¿Qué hace?: Busca los botones creados en la función render() y les añade eventos de clic.
     * ¿Qué devuelve?: Nada.
     * ¿Por qué existe?: Porque el HTML inyectado dinámicamente necesita que JS le diga qué 
     * hacer cuando el usuario interactúe con él.
     */
    function bindEvents() {
        // Selecciona todos los elementos con la clase '.nav-item' y los recorre con un bucle forEach
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                // Obtiene el identificador de la página almacenado en el atributo HTML 'data-page'
                const pageId = item.dataset.page;
                // Llama a la función para cambiar la vista (Función definida más abajo en este archivo)
                navigateTo(pageId);
            });
        });

        // Asigna el evento al botón de colapsar
        document.getElementById('sidebar-toggle').addEventListener('click', toggleCollapse);
    }

    /**
     * Función: navigateTo
     * ¿Qué recibe?: 
     *  - pageId (texto): El nombre interno de la página destino (ej: 'editor').
     * ¿Qué hace?: Apaga visualmente el menú y la vista actual, enciende el nuevo menú 
     * y la nueva vista, y avisa al resto de la aplicación del cambio de pantalla.
     * ¿Qué devuelve?: Nada.
     * ¿Por qué existe?: Para crear el efecto de "Single Page Application" (SPA), es decir, 
     * cambiar de pantalla sin que el navegador web tenga que recargar o refrescar la página.
     */
    function navigateTo(pageId) {
        // 1. Quitar la clase 'active' de todos los botones de menú
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        // Poner la clase 'active' solo al botón clickeado para que se resalte
        const navItem = document.getElementById(`nav-${pageId}`);
        if (navItem) navItem.classList.add('active');

        // 2. Quitar la clase 'active' (y ocultar) todas las áreas de contenido principales (pages)
        document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
        // Mostrar únicamente la página solicitada
        const page = document.getElementById(`page-${pageId}`);
        if (page) page.classList.add('active');

        // 3. Lanzar un evento global avisando que cambiamos de página
        // Esto lo escucha app.js para reajustar tamaños de gráficos si es necesario.
        window.dispatchEvent(new CustomEvent('page-change', { detail: { page: pageId } }));
    }

    /**
     * Función: toggleCollapse
     * ¿Qué recibe?: Nada.
     * ¿Qué hace?: Invierte el estado de la variable `collapsed` y altera la clase CSS.
     * ¿Qué devuelve?: Nada.
     * ¿Por qué existe?: Para ocultar parcialmente el menú lateral permitiendo más área de trabajo.
     */
    function toggleCollapse() {
        const sidebar = document.getElementById('sidebar');
        // El operador ! invierte el booleano: si es true pasa a false, y viceversa
        collapsed = !collapsed;

        // El método 'toggle' en classList añade la clase si el segundo parámetro es true, o la quita si es false.
        sidebar.classList.toggle('collapsed', collapsed);
    }

    /**
     * Función: getActivePage
     * ¿Qué recibe?: Nada.
     * ¿Qué hace?: Busca cuál menú tiene la clase 'active'.
     * ¿Qué devuelve?: Un string con el ID de la página actual (por defecto 'visualizer').
     * ¿Por qué existe?: Permite a otros archivos preguntar en qué parte de la app estamos.
     */
    function getActivePage() {
        // querySelector busca el primer elemento que cumpla con la regla CSS
        const active = document.querySelector('.nav-item.active');
        // Si existe 'active', devuelve su atributo data-page, sino devuelve un valor predeterminado
        return active ? active.dataset.page : 'visualizer';
    }

    // Exponemos (hacemos públicas) solo las funciones que el resto del programa necesita usar.
    return { render, navigateTo, getActivePage };
})();

/**
 * Evento: DOMContentLoaded
 * ¿Qué hace?: Arranca todo el proceso de dibujo de la barra una vez que la página carga.
 * ¿Por qué existe?: Si llamamos a Sidebar.render() muy pronto, los contenedores HTML no 
 * existirán y dará un error de JavaScript.
 */
document.addEventListener('DOMContentLoaded', () => {
    Sidebar.render();
});
