/**
 * ============================================================
 * ALMACENAMIENTO.JS — Manejo de datos de grafos en localStorage
 * ============================================================
 * Este módulo se encarga SOLO de los datos:
 * - Leer grafos guardados
 * - Guardar un grafo nuevo o sobrescribir uno existente
 * - Eliminar un grafo
 * - Buscar grafos por ID o por nombre
 *
 * NO toca la interfaz. Solo trabaja con datos.
 * ============================================================
 */
const Almacenamiento = (function () {

    // Clave que se usa para guardar los grafos en el navegador (localStorage)
    const CLAVE_STORAGE = 'graphlab_saved_graphs';


    // --- LEER ---
    // Devuelve un arreglo con todos los grafos guardados.
    // Si no hay ninguno o hay un error, devuelve un arreglo vacío.
    function obtenerGrafos() {
        try {
            return JSON.parse(localStorage.getItem(CLAVE_STORAGE)) || [];
        } catch {
            return [];
        }
    }


    // --- BUSCAR ---
    // Busca un grafo por su ID único. Devuelve el grafo o null.
    function buscarPorId(id) {
        const guardados = obtenerGrafos();
        return guardados.find(g => g.id === id) || null;
    }

    // Busca un grafo por nombre (ignora mayúsculas/minúsculas).
    // Se usa para detectar si ya existe un grafo con ese nombre antes de guardar.
    function buscarPorNombre(nombre) {
        const guardados = obtenerGrafos();
        return guardados.find(g => g.name.toLowerCase() === nombre.toLowerCase()) || null;
    }


    // --- GUARDAR ---
    // Guarda un grafo. Si se pasa un idExistente, reemplaza ese grafo.
    // Si no, crea uno nuevo con un ID basado en la fecha actual.
    // Devuelve el objeto del grafo que se guardó.
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


    // --- ELIMINAR ---
    // Elimina un grafo por su ID.
    function eliminarGrafo(id) {
        let guardados = obtenerGrafos();
        guardados = guardados.filter(g => g.id !== id);
        localStorage.setItem(CLAVE_STORAGE, JSON.stringify(guardados));
    }


    // Lo que otros archivos pueden usar de este módulo
    return {
        obtenerGrafos,
        buscarPorId,
        buscarPorNombre,
        guardarGrafo,
        eliminarGrafo
    };

})();
