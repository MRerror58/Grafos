/**
 * Almacenamiento Module — Manejo de datos de grafos en localStorage.
 * 
 * Utiliza el Patrón Módulo (IIFE: Immediately Invoked Function Expression).
 * ¿Por qué?: Para encapsular (proteger) la lógica de lectura y escritura de la 
 * base de datos local (localStorage), separándola del resto de la interfaz (Editor, Visualizer).
 */
const Almacenamiento = (() => {

    // Clave que se usa para guardar los grafos en el navegador (localStorage)
    const CLAVE_STORAGE = 'graphlab_saved_graphs';

    /**
     * Función: obtenerGrafos
     * ¿Qué recibe?: Nada.
     * ¿Qué hace?: Saca los datos del localStorage y los convierte de texto a código JS usable.
     * ¿Qué devuelve?: Un arreglo completo de grafos guardados, o un arreglo vacío [] si no hay nada.
     * ¿Por qué existe?: Porque localStorage solo guarda texto puro.
     */
    function obtenerGrafos() {
        try {
            return JSON.parse(localStorage.getItem(CLAVE_STORAGE)) || [];
        } catch {
            return [];
        }
    }

    /**
     * Función: buscarPorId
     * ¿Qué recibe?: 
     *  - id (texto): El identificador único del grafo.
     * ¿Qué hace?: Recorre todos los grafos guardados y busca el que coincida con el ID dado.
     * ¿Qué devuelve?: El objeto grafo, o 'null' si no lo encuentra.
     */
    function buscarPorId(id) {
        const guardados = obtenerGrafos();
        return guardados.find(g => g.id === id) || null;
    }

    /**
     * Función: buscarPorNombre
     * ¿Qué recibe?: 
     *  - nombre (texto): El nombre del grafo a buscar.
     * ¿Qué hace?: Busca un grafo que tenga el mismo nombre, ignorando mayúsculas y minúsculas.
     * ¿Qué devuelve?: El objeto grafo, o 'null' si no lo encuentra.
     * ¿Por qué existe?: Para evitar que el usuario guarde dos grafos diferentes con el mismo nombre accidentalmente.
     */
    function buscarPorNombre(nombre) {
        const guardados = obtenerGrafos();
        return guardados.find(g => g.name.toLowerCase() === nombre.toLowerCase()) || null;
    }

    /**
     * Función: guardarGrafo
     * ¿Qué recibe?: 
     *  - datosGrafo (objeto): La información actual del grafo (nombre, nodos, aristas, etc.).
     *  - idExistente (texto, opcional): El ID si es que estamos sobrescribiendo uno antiguo.
     * ¿Qué hace?: Empaqueta todo el estado actual, le genera una fecha y un ID (si es nuevo),
     * y lo inserta/reemplaza en la memoria del navegador.
     * ¿Qué devuelve?: El objeto del grafo final que se guardó.
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
            // Buscar el grafo existente y reemplazarlo
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
     * Función: eliminarGrafo
     * ¿Qué recibe?: 
     *  - id (texto): El identificador único del grafo a borrar.
     * ¿Qué hace?: Filtra la lista para excluir este grafo y guarda la lista resultante de nuevo.
     * ¿Qué devuelve?: Nada.
     */
    function eliminarGrafo(id) {
        let guardados = obtenerGrafos();
        guardados = guardados.filter(g => g.id !== id);
        localStorage.setItem(CLAVE_STORAGE, JSON.stringify(guardados));
    }

    // Exponemos (hacemos públicas) las funciones que el Editor u otros necesitan usar.
    return {
        obtenerGrafos,
        buscarPorId,
        buscarPorNombre,
        guardarGrafo,
        eliminarGrafo
    };
})();
