/**
 * ============================================================
 * SIDEBAR.JS — Barra lateral de navegación
 * ============================================================
 * Genera el HTML del sidebar y maneja la navegación entre
 * las páginas de la app (Visualizador y Editor).
 * ============================================================
 */
const Sidebar = (function () {

    // Lista de páginas de la app, cada una con su ID, nombre e icono
    const pages = [
        {
            id: 'visualizer',
            label: 'Visualizador',
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

    let collapsed = false;


    // Genera todo el HTML del sidebar e inserta en el DOM
    function render() {
        const container = document.getElementById('sidebar-container');
        container.innerHTML = `
            <nav class="sidebar" id="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/>
                            <line x1="7" y1="6" x2="17" y2="6"/><line x1="6.5" y1="7.5" x2="10.5" y2="16.5"/><line x1="17.5" y1="7.5" x2="13.5" y2="16.5"/>
                        </svg>
                    </div>
                    <span class="sidebar-brand">GraficatorG</span>
                </div>
                <div class="sidebar-nav">
                    ${pages.map((p, i) => `
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
                        <span class="nav-item-label"></span>
                    </button>
                </div>
            </nav>
        `;

        bindEvents();
    }

    // Conecta los clics en los botones de navegación y colapso
    function bindEvents() {
        // Clic en cada opción del menú → navegar a esa página
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                navigateTo(item.dataset.page);
            });
        });

        // Botón de colapsar/expandir sidebar
        document.getElementById('sidebar-toggle').addEventListener('click', toggleCollapse);
    }

    // Cambia a la página indicada (por ejemplo: 'visualizer' o 'editor')
    function navigateTo(pageId) {
        // Actualizar qué botón del menú está activo
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const navItem = document.getElementById(`nav-${pageId}`);
        if (navItem) navItem.classList.add('active');

        // Mostrar la página correspondiente y ocultar las demás
        document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
        const page = document.getElementById(`page-${pageId}`);
        if (page) page.classList.add('active');

        // Avisar a otros módulos que se cambió de página
        window.dispatchEvent(new CustomEvent('page-change', { detail: { page: pageId } }));
    }

    // Colapsa o expande el sidebar
    function toggleCollapse() {
        const sidebar = document.getElementById('sidebar');
        collapsed = !collapsed;
        sidebar.classList.toggle('collapsed', collapsed);
    }


    // Lo que otros archivos pueden usar de este módulo
    return { render, navigateTo };

})();

// Renderizar el sidebar automáticamente cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    Sidebar.render();
});
