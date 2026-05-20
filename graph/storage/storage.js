/**
 * Storage Module - Graph data management in localStorage.
 *
 * Uses the Module Pattern (IIFE: Immediately Invoked Function Expression).
 * Why?: To encapsulate the local database read/write logic and keep it separate
 * from the rest of the interface (Editor, Visualizer).
 */
const Almacenamiento = (() => {

    // Key used to save graphs in the browser (localStorage).
    const CLAVE_STORAGE = 'graphlab_saved_graphs';

    /**
     * Function: obtenerGrafos
     * What does it receive?: Nothing.
     * What does it do?: Reads localStorage and converts stored text into usable JS data.
     * What does it return?: A full array of saved graphs, or an empty array [] if nothing exists.
     * Why does it exist?: Because localStorage only stores plain text.
     */
    function obtenerGrafos() {
        try {
            return JSON.parse(localStorage.getItem(CLAVE_STORAGE)) || [];
        } catch {
            return [];
        }
    }

    /**
     * Function: buscarPorId
     * What does it receive?:
     *  - id (text): The graph's unique identifier.
     * What does it do?: Loops through all saved graphs and finds the one with the given ID.
     * What does it return?: The graph object, or 'null' if it is not found.
     */
    function buscarPorId(id) {
        const guardados = obtenerGrafos();
        return guardados.find(g => g.id === id) || null;
    }

    /**
     * Function: buscarPorNombre
     * What does it receive?:
     *  - nombre (text): The graph name to search for.
     * What does it do?: Finds a graph with the same name, ignoring uppercase/lowercase differences.
     * What does it return?: The graph object, or 'null' if it is not found.
     * Why does it exist?: To avoid accidentally saving two different graphs with the same name.
     */
    function buscarPorNombre(nombre) {
        const guardados = obtenerGrafos();
        return guardados.find(g => g.name.toLowerCase() === nombre.toLowerCase()) || null;
    }

    /**
     * Function: guardarGrafo
     * What does it receive?:
     *  - datosGrafo (object): The current graph information (name, nodes, edges, etc.).
     *  - idExistente (text, optional): The ID when overwriting an older graph.
     * What does it do?: Packages the current state, generates a date and ID when needed,
     * then inserts or replaces the graph in browser memory.
     * What does it return?: The final graph object that was saved.
     */
    function guardarGrafo(datosGrafo, idExistente = null) {
        const id = idExistente || ('g_' + Date.now());

        const grafoAGuardar = {
            id: id,
            name: datosGrafo.name,
            type: datosGrafo.type,
            weighted: datosGrafo.weighted,
            nodes: [...datosGrafo.nodes],
            edges: [...datosGrafo.edges],
            createdAt: new Date().toISOString()
        };

        let guardados = obtenerGrafos();

        if (idExistente) {
            // Finds the existing graph and replaces it.
            const indice = guardados.findIndex(g => g.id === idExistente);
            if (indice !== -1) {
                guardados[indice] = grafoAGuardar;
            } else {
                guardados.push(grafoAGuardar);
            }
        } else {
            guardados.push(grafoAGuardar);
        }

        localStorage.setItem(CLAVE_STORAGE, JSON.stringify(guardados));
        return grafoAGuardar;
    }

    /**
     * Function: eliminarGrafo
     * What does it receive?:
     *  - id (text): The unique identifier of the graph to delete.
     * What does it do?: Filters the list to exclude this graph and saves the result again.
     * What does it return?: Nothing.
     */
    function eliminarGrafo(id) {
        let guardados = obtenerGrafos();
        guardados = guardados.filter(g => g.id !== id);
        localStorage.setItem(CLAVE_STORAGE, JSON.stringify(guardados));
    }

    // Exposes the functions that the Editor or other modules need to use.
    return {
        obtenerGrafos,
        buscarPorId,
        buscarPorNombre,
        guardarGrafo,
        eliminarGrafo
    };
})();

// Exposes the module for classic browser scripts.
window.Almacenamiento = Almacenamiento;
