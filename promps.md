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
