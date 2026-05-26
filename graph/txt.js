/**
 * TxtTranslator Module (txt.js) - Handles bidirectional translation between text files (.txt) and Graph objects.
 *
 * Pattern: Module Pattern (IIFE - Immediately Invoked Function Expression).
 * Why?: To keep parsing helper methods hidden and only expose the main translator functions.
 */
const TxtTranslator = (() => {

    /**
     * Function: parseTxtToGraph
     * What does it receive?:
     *  - text (string): Raw contents of the uploaded .txt file.
     *  - type (string): Graph type, either 'directed' or 'undirected'.
     *  - weighted (boolean): Whether the graph is weighted.
     *  - name (string): The default name for the imported graph.
     * What does it do?:
     *  1. Splits the file content into lines, trims whitespace, and ignores empty lines.
     *  2. Validates that each line contains exactly three values separated by commas (source, target, weight).
     *  3. Validates that the weight value is a valid numeric float.
     *  4. Collects all unique node labels and generates unique internal IDs (n1, n2, n3, etc.).
     *  5. Maps each connection to its corresponding generated node IDs.
     * What does it return?: A complete Graph object structure.
     * Throws: An Error with a detailed, line-specific message if validation fails.
     */
    function parseTxtToGraph(text, type, weighted, name) {
        if (!text) {
            throw new Error('El archivo seleccionado está vacío.');
        }

        const lines = text.split(/\r?\n/);
        const parsedEdges = [];
        const uniqueNodeLabels = new Set();

        for (let i = 0; i < lines.length; i++) {
            const rawLine = lines[i];
            const line = rawLine.trim();

            // Skip empty lines
            if (line === '') continue;

            const parts = line.split(',');
            if (parts.length !== 3) {
                throw new Error(`Línea ${i + 1} inválida: "${rawLine}". Cada línea debe contener exactamente 3 valores separados por coma (origen,destino,peso).`);
            }

            const fromLabel = parts[0].trim();
            const toLabel = parts[1].trim();
            const weightVal = parts[2].trim();

            if (fromLabel === '' || toLabel === '') {
                throw new Error(`Línea ${i + 1} inválida: Los nombres de los nodos origen y destino no pueden estar vacíos.`);
            }

            const weight = parseFloat(weightVal);
            if (isNaN(weight)) {
                throw new Error(`Línea ${i + 1} inválida: El peso "${weightVal}" debe ser un número válido.`);
            }

            uniqueNodeLabels.add(fromLabel);
            uniqueNodeLabels.add(toLabel);
            parsedEdges.push({ fromLabel, toLabel, weight });
        }

        if (uniqueNodeLabels.size === 0) {
            throw new Error('No se encontraron conexiones válidas en el archivo.');
        }

        // Generate nodes array and create mapping from labels to internal IDs (n1, n2, etc.)
        const nodes = [];
        const labelToIdMap = {};
        let nodeCounter = 1;

        // Sort labels to ensure consistent ID assignment
        const sortedLabels = Array.from(uniqueNodeLabels).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

        sortedLabels.forEach(label => {
            const id = 'n' + nodeCounter++;
            labelToIdMap[label] = id;
            nodes.push({
                id: id,
                label: label,
                color: '#6C63FF' // Default modern accent color matching the visual system
            });
        });

        // Translate parsed edges into internal ID connections
        const edges = parsedEdges.map(pe => {
            const edge = {
                from: labelToIdMap[pe.fromLabel],
                to: labelToIdMap[pe.toLabel]
            };
            if (weighted) {
                edge.weight = pe.weight;
            }
            return edge;
        });

        return {
            name: name || 'Grafo Importado',
            type: type || 'undirected',
            weighted: weighted || false,
            nodes: nodes,
            edges: edges
        };
    }

    /**
     * Function: exportGraphToTxt
     * What does it receive?:
     *  - graph (object): A complete graph object from the Editor.
     * What does it do?:
     *  1. Map node IDs to their user-friendly labels.
     *  2. Constructs comma-separated source,target,weight lines for each edge.
     *  3. Avoids duplicate aristas if the graph is undirected by normalising (A-B is identical to B-A).
     * What does it return?: A string formatted as a .txt file.
     */
    function exportGraphToTxt(graph) {
        if (!graph || !graph.nodes || graph.nodes.length === 0) {
            return '';
        }

        // Create reverse lookup map (ID -> Label)
        const idToLabelMap = {};
        graph.nodes.forEach(n => {
            idToLabelMap[n.id] = n.label;
        });

        const lines = [];
        const seenConnections = new Set();

        graph.edges.forEach(e => {
            const fromLabel = idToLabelMap[e.from] || e.from;
            const toLabel = idToLabelMap[e.to] || e.to;
            
            // Default to weight 1 if not present (as requested)
            const weight = (e.weight !== undefined && e.weight !== null) ? e.weight : 1;

            if (graph.type === 'undirected') {
                // Normalise undirected edges so (A, B) and (B, A) generate the same key
                const key = fromLabel < toLabel ? `${fromLabel}-${toLabel}` : `${toLabel}-${fromLabel}`;
                if (seenConnections.has(key)) {
                    return; // Avoid duplicating the edge in TXT
                }
                seenConnections.add(key);
                lines.push(`${fromLabel},${toLabel},${weight}`);
            } else {
                // Directed edges: direction matters, but avoid exact duplicates of the same connection
                const key = `${fromLabel}->${toLabel}`;
                if (seenConnections.has(key)) {
                    return;
                }
                seenConnections.add(key);
                lines.push(`${fromLabel},${toLabel},${weight}`);
            }
        });

        return lines.join('\n');
    }

    // Expose translation functions
    return {
        parseTxtToGraph,
        exportGraphToTxt
    };
})();

// Expose module globally for browser environments
window.TxtTranslator = TxtTranslator;
