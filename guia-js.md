# Basic JavaScript Guide for the GraphLab Project

## 1. Variables and Constants
In modern JavaScript (ES6+), we usually avoid `var` and use two main keywords to store data in memory: `let` and `const`.

- **`const`**: Used for data that should never be reassigned. Examples include storage keys or fixed references to visual elements on the screen.
- **`let`**: Used for data whose value will change. Examples include state variables, boolean flags, and counters.

**In this project you will see examples like:**
```javascript
let nodeIdCounter = 0; // We use let because it changes every time a node is added.
const CLAVE_STORAGE = 'graphlab_saved_graphs'; // We use const because the key never changes.
```

## 2. Data Types and Arrays
JavaScript handles text (`Strings`), numbers (`Numbers`), and booleans (`true`/`false`). On the web, however, we often work with organized collections of data. For that, we use **Arrays**.

```javascript
// An empty array ready to receive graph nodes.
let nodes = [];
```

## 3. Objects
Objects are powerful structures for storing related data through **key: value** pairs. They are perfect for representing real concepts.

**In this project**, each node is represented as an object:
```javascript
const node = {
    id: 'n1',       // Key: id, Value: text 'n1'
    label: 'A',     // Key: label, Value: text 'A'
    color: '#F00'   // Key: color, Value: red hexadecimal text
};
```

## 4. Functions and Arrow Functions
Functions wrap blocks of code that we want to reuse.

Classic form:
```javascript
function guardarGrafo() {
    // Code that saves a graph.
}
```

Modern JavaScript also commonly uses **Arrow Functions**, especially when passing a function as a parameter to another function. Those passed functions are often called callbacks.

```javascript
const borrarGrafo = (id) => {
    // Code that deletes a graph.
};
```

## 5. The DOM (Document Object Model)
The DOM is one of the most important JavaScript concepts for the web. It is the browser's in-memory representation of your HTML file, converted into objects that JavaScript can manipulate.

To interact with the page, we use selectors that search for elements:

- `document.getElementById('element-id')`: Finds one specific element by ID.
- `document.querySelector('.css-class')`: Finds the first element that matches the selector.
- `document.querySelectorAll('div')`: Returns all matching elements in an array-like collection.

**Example from the project:**
```javascript
// Finds the text box where the user typed the node name.
const labelInput = document.getElementById('node-label');
// Reads its current value.
const text = labelInput.value;
```

## 6. Modifying the DOM
JavaScript can change the interface in real time.

- **`element.innerHTML = '...'`**: Replaces the internal HTML of an element. GraphLab uses it to dynamically draw node, edge, and saved graph lists.
- **`element.classList.add('class')`**: Adds a CSS class to an element. For example, adding `hidden` hides panels without deleting them.
- **`element.style.color = 'red'`**: Changes a CSS style directly for one element.

## 7. Events (Interactivity)
A normal web page is static. JavaScript makes it react. The code usually waits for the user to do something: click, move the mouse, or type. These actions are called **events**.

The key method is `addEventListener('type', function)`.

```javascript
// In main.js or graph/editor.js you will find many lines like this:
document.getElementById('btn-add-node').addEventListener('click', addNode);
```

That line means: "Browser, find the button whose ID is `btn-add-node`. Watch it, and when someone clicks it, run the `addNode` function."

## 8. Loops and Advanced Array Methods
Although `for` and `while` are still useful, modern JavaScript often processes data lists with built-in Array methods:

- **`array.map()`**: Walks through the full list, transforms each item, and returns a new list. It is often used to turn logical data into HTML text.
- **`array.filter()`**: Returns a new list containing only the items that pass a condition. It is used for deletion patterns such as "keep every node except the one being removed."
- **`array.find()`**: Finds and returns the first item that matches a condition.

```javascript
// Project example using filter to remove a node from the list.
currentGraph.nodes = currentGraph.nodes.filter(n => n.id !== id);
```

## 9. Separate Files and the Module Pattern (IIFE)
In a real project, we avoid writing every line of JavaScript in one giant file. We split code by responsibility:

- `main.js`: Application startup.
- `graph/editor.js`: Form and graph editing logic.
- `graph/visualizer.js`: Interactive graph canvas logic.
- `graph/canvas.js`: Shared canvas helpers used by the visualizer and preview.
- `graph/storage/storage.js`: localStorage persistence.
- `graph/ui/sidebar.js`: Sidebar navigation.

To prevent variables from different files from accidentally colliding, the project uses the **Module Pattern**, also known as an Immediately Invoked Function Expression (IIFE):

```javascript
// This creates a private "black box".
const Editor = (() => {
    let secret = "Only for the editor";

    function publicFunction() {
        console.log("Any file can call me");
    }

    // Here we choose which functions are exported to the outside.
    return { publicFunction };
})();
```

That is why the main file can call commands such as `Editor.init()`.

## 10. How the Interaction Flow Works
To understand GraphLab, and almost any web app, it helps to see how the languages work together:

1. **HTML** creates the structure and defines what exists: buttons, text inputs, and the `canvas`.
2. **CSS** dresses the interface: colors, shadows, responsive sizes, and animations.
3. **JavaScript** gives the page its behavior:
   - When the page loads, JS finds DOM elements and adds event listeners.
   - When the user clicks "Agregar Nodo", a JS function runs.
   - That function reads the data, validates it, and stores it in an array in memory.
   - Finally, the same function updates the HTML or asks the `canvas` to draw a new node, creating the feeling of instant interaction.

## Notes From Juan David Vasquez Canas

Much of the code was documented with AI help. For extra clarity and to show that the code was reviewed carefully, some sections include comments such as `// Note: ...`. These notes are manual reminders intended to make each function easier to understand when the code is reviewed later.

## Native JavaScript Functions Used by the Project

These functions already exist in JavaScript, in the browser, or in the Canvas API. They are not defined inside this project.

- **`getBoundingClientRect()`**
  - **What it does:** Gets the physical position and size of an HTML element, such as a `<canvas>`, relative to the visible browser area.
  - **What it returns:** A `DOMRect` object with numeric properties such as `top`, `bottom`, `left`, `right`, `width`, `height`, `x`, and `y`.
  - **Example return:** `{ x: 250, y: 80, width: 800, height: 600, top: 80, right: 1050, bottom: 680, left: 250 }`

- **`getContext('2d')`**
  - **What it does:** Asks a `<canvas>` element for its two-dimensional drawing context.
  - **What it returns:** A `CanvasRenderingContext2D` object with drawing functions and properties.
  - **Example return:** `CanvasRenderingContext2D { canvas: canvasElement, globalAlpha: 1, strokeStyle: '#000000', ... }`

- **`setTransform(a, b, c, d, e, f)`**
  - **What it does:** Resets and applies a mathematical transform matrix for scale, rotation, or translation. This project uses it to keep canvas graphics sharp on high-resolution screens.
  - **What it returns:** Nothing (`undefined`).

- **`save()`**
  - **What it does:** Saves a backup of the current canvas brush state, including colors, shadows, scale, and translation.
  - **What it returns:** Nothing (`undefined`).

- **`restore()`**
  - **What it does:** Restores the brush state to the last state saved with `save()`.
  - **What it returns:** Nothing (`undefined`).

- **`translate(x, y)`**
  - **What it does:** Moves the imaginary `(0, 0)` coordinate origin of the canvas. It is used for camera panning.
  - **What it returns:** Nothing (`undefined`).

- **`scale(x, y)`**
  - **What it does:** Applies a zoom transform by multiplying future drawing coordinates by the given factors.
  - **What it returns:** Nothing (`undefined`).

- **`clearRect(x, y, width, height)`**
  - **What it does:** Clears a rectangular canvas area, making those pixels transparent.
  - **What it returns:** Nothing (`undefined`).

- **`beginPath()`**
  - **What it does:** Starts or clears the active drawing path so the next drawing commands belong to a new shape.
  - **What it returns:** Nothing (`undefined`).

- **`moveTo(x, y)`**
  - **What it does:** Moves the virtual pencil to the given coordinates without drawing a line.
  - **What it returns:** Nothing (`undefined`).

- **`lineTo(x, y)`**
  - **What it does:** Defines a straight line from the current position to the given coordinates.
  - **What it returns:** Nothing (`undefined`).

- **`stroke()`**
  - **What it does:** Physically draws the outline of the current path using the active stroke color.
  - **What it returns:** Nothing (`undefined`).

- **`fill()`**
  - **What it does:** Fills the inside of the current geometric path with the active color or gradient.
  - **What it returns:** Nothing (`undefined`).

- **`arc(x, y, radius, startAngle, endAngle)`**
  - **What it does:** Defines a circular arc or full circle centered on `(x, y)`.
  - **What it returns:** Nothing (`undefined`).

- **`measureText(text)`**
  - **What it does:** Calculates the width and metrics a specific text will use before it is drawn.
  - **What it returns:** A `TextMetrics` object with measurable text properties.
  - **Example return:** `TextMetrics { width: 42.68, actualBoundingBoxAscent: 9, ... }`

- **`preventDefault()`**
  - **What it does:** Cancels the browser's default behavior for some events, such as stopping page scroll when the mouse wheel is used inside the canvas.
  - **What it returns:** Nothing (`undefined`).

- **`requestAnimationFrame(callbackFunction)`**
  - **What it does:** Asks the browser to run a function on the next screen refresh, which helps create smooth animations.
  - **What it returns:** An integer ID that can be used to cancel the request later.
  - **Example return:** `125`

- **`cancelAnimationFrame(animationId)`**
  - **What it does:** Cancels a queued animation request that was previously registered with `requestAnimationFrame`.
  - **What it returns:** Nothing (`undefined`).

- **`fillText(text, x, y)`**
  - **What it does:** Draws filled text on the canvas using the current font, size, alignment, and fill color.
  - **What it returns:** Nothing (`undefined`).
