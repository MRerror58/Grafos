# Guía Básica de JavaScript Orientada al Proyecto GraphLab

## 1. Variables y Constantes
En JavaScript moderno (ES6+) dejamos de usar `var` y utilizamos dos palabras clave principales para almacenar datos en memoria: `let` y `const`.
- **`const`**: Se usa para declarar datos que **nunca van a cambiar** o reasignarse. Por ejemplo, la llave para guardar cosas, o las referencias a elementos visuales fijos en la pantalla.
- **`let`**: Se usa para datos cuyo valor **sí va a cambiar**. Por ejemplo, variables de estado, banderas booleanas o contadores.

**En el archivo `editor.js` de nuestro proyecto verás:**
```javascript
let nodeIdCounter = 0; // Usamos let porque cambiará cada vez que agreguemos un nodo
const STORAGE_KEY = 'graphlab_saved_graphs'; // Usamos const porque la llave nunca cambia
```

## 2. Tipos de Datos y Arreglos (Arrays)
JavaScript maneja textos (`Strings`), números (`Numbers`), booleanos (`true`/`false`). Pero en la web trabajamos con montones de datos organizados. Para esto usamos "Arreglos" o **Arrays** (listas de elementos).
```javascript
// Un arreglo vacío listo para recibir nuestros nodos.
let nodes = []; 
```

## 3. Objetos
Los objetos son estructuras poderosas para guardar datos relacionados usando **pares de "clave: valor"**. Son perfectos para representar conceptos de la vida real.
**En nuestro proyecto**, cada nodo (un punto en un grafo) se representa en JS como un objeto que agrupa toda su información:
```javascript
const node = {
    id: 'n1',       // Clave: id, Valor: texto 'n1'
    label: 'A',     // Clave: label, Valor: texto 'A'
    color: '#F00'   // Clave: color, Valor: texto hexadecimal rojo
};
```

## 4. Funciones y Arrow Functions
Las funciones encapsulan bloques de código que queremos usar repetidamente.
La forma clásica:
```javascript
function guardarGrafo() {
    // Código para guardar
}
```
Pero en JavaScript moderno verás a menudo **Arrow Functions** (Funciones Flecha). Son muy utilizadas cuando pasamos una función como parámetro a otra función (los llamados "callbacks").
```javascript
const borrarGrafo = (id) => {
    // Código para borrar
};
```

## 5. El DOM (Document Object Model)
El DOM es el concepto más importante en JavaScript para la web. Es la "traducción" que hace el navegador de tu archivo HTML para convertirlo en "Objetos" manipulables con JavaScript en la memoria del PC.

Para interactuar, usamos "Selectores" que buscan elementos en la página como un motor de búsqueda:
- `document.getElementById('id-del-elemento')`: Busca un *único* elemento específico.
- `document.querySelector('.clase-css')`: Busca el *primer* elemento que contenga la clase indicada.
- `document.querySelectorAll('div')`: Retorna *todos* los elementos encontrados en una especie de arreglo.

**Ejemplo en nuestro proyecto:**
```javascript
// Buscamos la caja de texto (input) donde el usuario escribió el nombre
const labelInput = document.getElementById('node-label');
// Extraemos su valor actual para procesarlo
const texto = labelInput.value; 
```

## 6. Modificar el DOM
JavaScript puede alterar la interfaz del usuario en tiempo real.
- **`elemento.innerHTML = '...'`**: Reemplaza completamente el contenido HTML interno de una etiqueta. En GraphLab lo usamos mucho para dibujar las listas de nodos y aristas dinámicamente.
- **`elemento.classList.add('clase')`**: Añade una clase CSS a un elemento. Por ejemplo, añadiendo una clase llamada `hidden` logramos ocultar páneles sin borrarlos.
- **`elemento.style.color = 'red'`**: Modifica los estilos CSS de forma directa e individual.

## 7. Eventos (Interactividad)
Una página web normal es estática. JavaScript la hace reaccionar. Nuestro código generalmente se queda dormido esperando a que el usuario haga algo (clic, mover el ratón, teclear). Estas acciones se llaman **Eventos**.

La pieza clave es `addEventListener('tipo', función)`.
```javascript
// En app.js o editor.js encontrarás muchos de estos:
document.getElementById('btn-add-node').addEventListener('click', addNode);
```
Traducción al español de esa línea: *"Oye navegador, busca el botón cuyo ID sea 'btn-add-node'. Quédate vigilándolo, y cuando alguien le haga 'click', por favor ejecuta la función llamada `addNode`"*.

## 8. Ciclos y Métodos Avanzados de Arrays
Aunque `for` y `while` siguen siendo útiles, en JS moderno procesamos listas de datos usando métodos integrados en los Arrays (que por detrás son bucles súper optimizados):

- **`array.map()`**: Recorre toda la lista, transforma cada elemento y te devuelve una lista completamente nueva. *Muy usado para tomar datos lógicos y convertirlos en texto HTML.*
- **`array.filter()`**: Recorre la lista y retorna una lista nueva solo con los elementos que pasaron un filtro (condición `true`). *Usado para borrar: "Filtrar todos los nodos excepto el que voy a borrar".*
- **`array.find()`**: Busca y devuelve el primer elemento que cumpla una condición específica.

```javascript
// Ejemplo del proyecto (editor.js) usando filter para "borrar" un nodo de la lista
currentGraph.nodes = currentGraph.nodes.filter(n => n.id !== id);
```

## 9. Archivos Separados y el Patrón Módulo (IIFE)
En un proyecto real, no escribimos 2.000 líneas en un archivo gigante de JavaScript. Dividimos el código por responsabilidades: `app.js` (inicio), `editor.js` (lógica del formulario), `visualizer.js` (lógica del dibujo en el Canvas).

Para que las variables de un archivo no se crucen accidentalmente con las del otro (ej: tener una variable `nodes` en ambos lados), usamos el **Patrón Módulo** o Expresiones de Función Invocadas Inmediatamente (IIFE):

```javascript
// Esto crea una "caja negra" privada.
const Editor = (() => {
    let secreto = "Solo para el editor"; 
    
    function funcionPublica() {
        console.log("Cualquier archivo me puede llamar");
    }

    // Aquí elegimos qué funciones "exportamos" o prestamos hacia el exterior
    return { funcionPublica }; 
})();
```
Es por esto que desde el archivo principal podemos usar comandos tipo: `Editor.funcionPublica()`.

## 10. ¿Cómo es el flujo de interacción?
Para entender el proyecto GraphLab (y cualquier otra app web), debes ver cómo trabajan juntos los lenguajes:

1. **HTML** crea el esqueleto y define qué cosas existen (los botones, las cajas de texto, el lienzo `canvas`).
2. **CSS** las viste (colores, sombras, tamaños responsivos, animaciones).
3. **JavaScript** les inyecta el cerebro:
   - Al cargar la página, JS busca elementos (DOM) y les pone escuchadores (Eventos).
   - Cuando el usuario hace clic en "Agregar Nodo", se dispara una función en JS.
   - Esa función toma los datos, los valida, y los guarda en un arreglo en la memoria.
   - Finalmente, la misma función actualiza el HTML o le dice al `canvas` que dibuje una pelotita nueva en pantalla, dando la sensación de interactividad instantánea.
