/**
 * Sidebar Module - Builds and controls the navigation sidebar.
 *
 * This file uses the Module Pattern (IIFE: Immediately Invoked Function Expression).
 * Why?: To encapsulate internal variables such as 'pages' or 'collapsed' so they do
 * not interfere with the rest of the project, while revealing only public functions.
 */
const Sidebar = (() => {
    // Array of objects. Each object defines one of the available screens in the app.
    const pages = [
        {
            id: 'visualizer',
            label: 'Visualizador',
            // icon is a text string containing the icon drawing in vector format (SVG).
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
        },
        {
            id: 'explicit',
            label: 'Vista explícita',
            icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <line x1="10" y1="9" x2="8" y2="9"/>
            </svg>`
        }
    ];

    // Boolean variable that stores the sidebar state (expanded or collapsed).
    let collapsed = false;

    /**
     * Function: render
     * What does it receive?: Nothing.
     * What does it do?: Builds the sidebar HTML from JavaScript and injects it into the page.
     * Then it calls bindEvents() to connect the created buttons.
     * What does it return?: Nothing.
     * Why does it exist?: To generate the interface dynamically and make future page additions
     * easier by editing only the 'pages' array.
     */
    function render() {
        const container = document.getElementById('sidebar-container');

        // Template strings (`...`) allow multi-line HTML and dynamic ${} values.
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
                        <!-- If this is the first item (i === 0), it receives the 'active' class by default. -->
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

        // Calls the local function to assign interactivity to the new markup.
        bindEvents();
    }

    /**
     * Function: bindEvents
     * What does it receive?: Nothing.
     * What does it do?: Finds the buttons created by render() and adds click events.
     * What does it return?: Nothing.
     * Why does it exist?: Dynamically injected HTML needs JS to define what happens
     * when the user interacts with it.
     */
    function bindEvents() {
        // Selects every '.nav-item' element and loops through them with forEach.
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                // Gets the page identifier stored in the HTML 'data-page' attribute.
                const pageId = item.dataset.page;
                // Calls the function that changes the view.
                navigateTo(pageId);
            });
        });

        // Assigns the collapse event to the toggle button.
        document.getElementById('sidebar-toggle').addEventListener('click', toggleCollapse);
    }

    /**
     * Function: navigateTo
     * What does it receive?:
     *  - pageId (text): Internal name of the target page (example: 'editor').
     * What does it do?: Visually disables the current menu/page, enables the new menu/page,
     * and notifies the rest of the application about the screen change.
     * What does it return?: Nothing.
     * Why does it exist?: To create a Single Page Application (SPA) effect.
     */
    function navigateTo(pageId) {
        // 1. Removes the 'active' class from every menu button.
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        // Adds the 'active' class only to the clicked button so it is highlighted.
        const navItem = document.getElementById(`nav-${pageId}`);
        if (navItem) navItem.classList.add('active');

        // 2. Removes the 'active' class from all main content areas (pages).
        document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
        // Shows only the requested page.
        const page = document.getElementById(`page-${pageId}`);
        if (page) page.classList.add('active');

        // 3. Dispatches a global event to announce the page change.
        // main.js listens for it to resize graph canvases when needed.
        window.dispatchEvent(new CustomEvent('page-change', { detail: { page: pageId } }));
    }

    /**
     * Function: toggleCollapse
     * What does it receive?: Nothing.
     * What does it do?: Flips the `collapsed` variable and changes the CSS class.
     * What does it return?: Nothing.
     * Why does it exist?: To partially hide the side menu and provide more workspace.
     */
    function toggleCollapse() {
        const sidebar = document.getElementById('sidebar');
        // The ! operator flips a boolean: true becomes false, and false becomes true.
        collapsed = !collapsed;

        // classList.toggle adds the class when the second parameter is true, or removes it when false.
        sidebar.classList.toggle('collapsed', collapsed);
    }

    /**
     * Function: getActivePage
     * What does it receive?: Nothing.
     * What does it do?: Finds which menu item has the 'active' class.
     * What does it return?: A string with the current page ID (defaults to 'visualizer').
     * Why does it exist?: Allows other files to ask where the app currently is.
     */
    function getActivePage() {
        // querySelector finds the first element that matches the CSS rule.
        const active = document.querySelector('.nav-item.active');
        // If 'active' exists, returns its data-page attribute; otherwise returns a default.
        return active ? active.dataset.page : 'visualizer';
    }

    // Exposes only the functions the rest of the program needs.
    return { render, navigateTo, getActivePage };
})();

// Exposes the module for classic browser scripts.
window.Sidebar = Sidebar;
