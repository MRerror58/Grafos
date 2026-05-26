**PROMPTS GIVEN TO THE AGENT ARE STORED HERE**

**Prompt 1**
17/05/2026
9:25pm

This prompt was used to add comments and provide useful information for any programmer who reads the code. Afterward, the documentation was reviewed to confirm that everything was clear; large unnecessary comments were summarized, and a few extra notes were added for clarity.

Act as an agent with full project access and work across the whole repository.

Your task is to create clear, complete, highly educational documentation for university students who are beginning to program. The content should be easy to understand for people who already know the basics of structured and object-oriented programming, as well as events, but who do not yet fully understand JavaScript, the DOM, HTML/CSS, or working with multiple files.

MAIN GOAL

1. Document all project code.
2. Explain what every function, method, and important code block does.
3. For every function call, indicate where that function is defined.
   - You must specifically write the file where it is defined.
   - If the function is defined in the same file where it is called, do not add anything extra.
4. Create a `.md` file in the project root, outside every folder, with a guide to the JavaScript concepts needed to understand this code.

CODE DOCUMENTATION REQUIREMENTS

- Document the whole project completely.
- Every function must have a simple, precise, educational explanation.
- Explain:
  - what it receives,
  - what it does,
  - what it returns,
  - why it exists,
  - and how it relates to the rest of the code.
- If a function depends on another one, explain that relationship.
- If a code section uses events, DOM, selectors, attributes, classes, or IDs, explain it educationally.
- When there is a call to a function defined in another file, indicate it like this:
  - `Function defined in: file.js`
- If the function is in the same file, do not add that note.

ROOT `.md` FILE REQUIREMENTS

Create a file named something like `guia-js.md` or `javascript-basico.md` in the project root.

That file must explain, in a simple way and oriented to the real project code, the JavaScript concepts a beginner needs in order to understand it. Include at least:

- Variables and constants
- Data types
- Functions
- Objects
- Arrays
- Conditionals
- Loops
- Events
- DOM
- How to get elements by `id`, `class`, `querySelector`, `querySelectorAll`
- Text, class, and attribute manipulation
- Use of separate files and modules, if applicable
- Difference between HTML, CSS, and JavaScript inside the project
- What it means for JavaScript to interact with a web page

IMPORTANT ABOUT EXPLANATION LEVEL

- Do not assume advanced JavaScript knowledge.
- Do not give complicated explanations if there is a simpler way to say something.
- Use clear, direct, educational language.
- If you use technical terms, explain them immediately.
- The goal is for a beginner university student to understand the code without trouble.

IMPORTANT ABOUT CONTENT

- Do not invent anything that is not in the code.
- Do not omit functions, methods, or important parts.
- Do not summarize vaguely: document with enough detail.
- Keep the explanation consistent with both the code and the `.md` guide.

DELIVERY FORMAT

- Return the result in an organized way.
- If you modify files, preserve the project structure.
- If you create documentation inside the code, make it readable and uniform.
- Prioritize clarity, precision, and educational value.

BEFORE STARTING

Analyze the whole project first to understand its structure, dependencies, and general flow. Then generate the documentation and JavaScript guide based on that analysis.

JavaScript documentation should mainly be created in the JavaScript folder. If there are relationships with `styles.css` or `index.html`, you can document something there too, but that is not the priority.

**Prompt 2**
17/05/2026
9:40pm

Because of conflicts between remote and local Git versions, I asked AI for help resolving them and standardizing comments. Prompt:

The code has been edited. Resolve any errors it may have and adjust the documentation in all files to a standard. The standard is: `@contextScopeItemMention`.

**Prompt 3**
19/05/2026
3:42pm

Because of the latest code separation, many code fragments were accidentally repeated. I asked AI to help unify many of these functions and avoid repeating them several times with this prompt:

It turns out that in `@contextScopeItemMention` we have several `.js` files containing all page functionality, but I noticed that several of them, because of a previous code split, contain large parts that also exist in another file. These are identical functions with the same lines of code. Unify those parts into one file while keeping everything working correctly from `index.html`.

I mention this because `@contextScopeItemMention` and `@contextScopeItemMention` are almost the same code; they only vary slightly and look like copied lines. Create files that unify those parts so repeated functions are avoided throughout the general code.


**Promt 4**
25/05/2026
3:45pm

We needed to create a function so that when the user right-clicks, a lot of information about the selected node is displayed. Because of this, I needed to make a prompt to help me with the task. After creating it and carefully reviewing everything made by the AI line by line, we manually modified the code to improve some specific parts and fix issues in the AI-generated code related to the displayed information. Sometimes the information was unnecessary, so we decided to remove details when the node does not have properties such as weight, direction, inputs, or outputs.

Prompt:
Create a function for the canvas. Remember that ALL functions must be documented the same way as the others so the code can be properly understood and learned from.

This new function must:
Detect if the user right-clicked on a node.
If the user right-clicks on empty space, nothing should be displayed.
If the user right-clicks on a node, extra information about that node must be shown.

The information that must be displayed is:

ID
Degree
Neighbors
Inputs
Outputs
Weight

**Promt 5**
26/05/2026
3:27pm

This prot was created because we did need to see the explicit info of the gapsh in the code
Promt:

New section: Button exactly like the graph editing section and its graphing, where a new screen is generated on the page.
In this new screen you should place a graph selector exactly like the one in the graphing section, but in this case, you must make it so that when selecting it and saying that I want to see it, the ENTIRE graph is displayed EXPLICITLY. Not only the name and the number of nodes, but the connections, the nodes and their IDs, everything exactly, literally and explicitly as they are currently stored in localStorage.

**Promt 6**
26/05/2026
5:46pm

This promt was created for the txt traduction in the proyect.
Promt:

Necesito que me ayudes a implementar la funcionalidad de importar y exportar grafos en archivos .txt para mi proyecto de Matemáticas Discretas II.

Contexto del requisito:
El proyecto necesita una función que tome como entrada una ruta a un archivo de texto, lo lea, y a partir de los valores inicialice el grafo. El formato base del archivo es:

source,target,weight

El separador es coma ",".

Importante:
No inventes arquitectura ni nombres de funciones existentes. Primero revisa el proyecto completo y detecta cómo está representado actualmente el grafo, cómo se crean, guardan, editan y eliminan los grafos, y cómo se conectan los botones en la interfaz.

Objetivo principal:
Implementar importación y exportación de grafos en formato .txt.

Requisitos específicos:

1. Crear o modificar las funciones necesarias en `requirimientos.js`
   - La función de importar debe estar en `requirimientos.js`.
   - La función de exportar debe estar en `requirimientos.js`.
   - Estas funciones deben conectarse con la lógica real del proyecto, sin romper lo existente.

2. Crear un archivo separado llamado `txt.js`
   - Este archivo debe encargarse únicamente de traducir entre texto y grafo.
   - Es decir, `txt.js` debe contener la lógica para:
     - Convertir el contenido de un archivo .txt en una estructura entendible por el grafo.
     - Convertir un grafo existente en un string con formato txt.
   - `requirimientos.js` debe usar/importar las funciones de `txt.js`.

3. Formato mínimo obligatorio del TXT:
   Cada línea debe representar una arista con este formato:

   source,target,weight

   Ejemplo:

   A,B,5
   B,C,2
   C,A,7

   Esto debe crear/inicializar un grafo con los vértices y aristas correspondientes.

4. Tener en cuenta diferentes representaciones posibles del grafo en texto
   Antes de implementar, revisa qué representación usa el proyecto internamente.
   La solución debe ser adaptable a la representación actual del proyecto, por ejemplo:
   - Lista de adyacencia
   - Matriz de adyacencia
   - Lista de aristas
   - Objetos/clases existentes del proyecto
   - Cualquier estructura que ya esté implementada

   No cambies la representación principal del proyecto si no es necesario. Solo traduce desde/hacia ella.

5. Importación
   - El usuario debe poder seleccionar o cargar un archivo `.txt`.
   - Validar que el archivo sea `.txt`.
   - Leer su contenido.
   - Parsear cada línea usando `source,target,weight`.
   - Ignorar líneas vacías.
   - Manejar espacios extra, por ejemplo: `A, B, 5`.
   - Validar que cada línea tenga exactamente 3 valores.
   - Validar que `weight` sea numérico.
   - Inicializar o actualizar el grafo usando la estructura que ya usa el proyecto.
   - Mostrar un mensaje claro si el archivo tiene errores de formato.

6. Exportación
   - El usuario debe poder exportar el grafo actual a un archivo `.txt`.
   - El archivo generado debe tener una línea por cada arista.
   - El formato debe ser:

   source,target,weight

   - Si el grafo no tiene peso en alguna arista, define una solución coherente con el proyecto:
     - usar peso 1 por defecto, o
     - usar el peso guardado si ya existe.
   - No dupliques aristas innecesariamente si el grafo es no dirigido, salvo que el proyecto represente explícitamente ambas direcciones.

7. Ubicación de botones en la interfaz
   Agregar dos botones:
   - Importar grafo .txt
   - Exportar grafo .txt

   Los botones deben ir en la sección de edición de un grafo, justo debajo de donde actualmente se guarda y se elimina el grafo.

   Antes de editar, busca en el proyecto dónde están los botones de guardar y eliminar grafo, y agrega los nuevos botones ahí.

8. Restricciones importantes
   - No inventes archivos, componentes ni nombres si ya existen equivalentes.
   - No rompas la funcionalidad actual de crear, guardar, editar o eliminar grafos.
   - Mantén nombres de variables y funciones en inglés, porque el enunciado lo exige.
   - Si encuentras nombres mal escritos como `requirimientos.js`, respeta el nombre real del archivo si ya existe así.
   - Si el archivo correcto tiene otro nombre parecido, explícame antes de cambiar algo.

9. Entregables esperados
   - Código funcional para importar grafos desde `.txt`.
   - Código funcional para exportar grafos a `.txt`.
   - Archivo `txt.js` separado con las funciones de traducción.
   - Modificación de `requirimientos.js` para conectar import/export.
   - Botones agregados en la interfaz en la sección correcta.
   - Validaciones básicas y mensajes de error claros.
   - Una explicación breve de qué archivos modificaste y por qué.

10. Antes de modificar
   Primero analiza el proyecto y dime:
   - Qué representación de grafo está usando actualmente.
   - En qué archivo está la lógica principal del grafo.
   - Dónde están los botones de guardar y eliminar.
   - Cómo planeas conectar importación/exportación sin romper lo existente.

Luego implementa los cambios.