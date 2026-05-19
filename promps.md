**ACA SE GUARDAN LOS PROMTS QUE LE DI AL AGENTE**

**Promt 1**
17/05/2026
9:25pm
Este promt fue para comentar y dar info al programador que vaya a leer el codigo de forma apropiada (Luego se le hizo un prosceso de reviscion para confirmar que todo estaba bien documentado y se resumieron grandes parte de comentario debido a ser insesarias. Ademas de le agregaron algunas otras para mayor claridad)
Actúa en modo agente con acceso completo al proyecto y trabaja sobre todo el código del repositorio.

Tu tarea es crear documentación clara, completa y extremadamente didáctica para estudiantes universitarios que están empezando en programación. El contenido debe ser fácil de entender para personas que ya conocen las bases de programación estructurada y orientada a objetos, así como eventos, pero que aún no dominan JavaScript, DOM, HTML/CSS ni el trabajo con múltiples archivos.

OBJETIVO PRINCIPAL

1. Documenta todo el código del proyecto.
2. Explica qué hace cada función, método y bloque importante de código.
3. En cada llamada a una función, indica dónde está definida.
   - Debes escribir específicamente el archivo donde se define.
   - Si la función está definida en el mismo archivo donde se llama, no pongas nada extra.
4. Crea un archivo `.md` en la raíz del proyecto, fuera de todas las carpetas, con una guía de conceptos de JavaScript necesarios para entender este código.

REQUISITOS DE LA DOCUMENTACIÓN DEL CÓDIGO

- Debes documentar todo el proyecto de forma completa.
- Cada función debe tener una explicación simple, precisa y pedagógica.
- Explica:
  - qué recibe,
  - qué hace,
  - qué devuelve,
  - por qué existe,
  - y cómo se relaciona con el resto del código.
- Si una función depende de otra, acláralo.
- Si una parte del código usa eventos, DOM, selectores, atributos, clases o IDs, explícalo de forma didáctica.
- Cuando aparezca una llamada a una función definida en otro archivo, indícalo así:
  - `Función definida en: archivo.js`
- Si la función está en el mismo archivo, no añadas esa nota.

REQUISITOS DEL ARCHIVO `.md` EN LA RAÍZ

Crea un archivo llamado algo como `guia-js.md` o `javascript-basico.md` en la raíz del proyecto.

Ese archivo debe explicar, de forma sencilla y orientada al código real del proyecto, los conceptos de JavaScript que un principiante necesita saber para entenderlo. Incluye, como mínimo:

- Variables y constantes
- Tipos de datos
- Funciones
- Objetos
- Arrays
- Condicionales
- Ciclos
- Eventos
- DOM
- Cómo obtener elementos por `id`, `class`, `querySelector`, `querySelectorAll`
- Manipulación de texto, clases y atributos
- Uso de archivos separados y módulos, si aplica
- Diferencia entre HTML, CSS y JavaScript dentro del proyecto
- Qué significa que JavaScript interactúe con una página web

IMPORTANTE SOBRE EL NIVEL DE EXPLICACIÓN

- No asumas conocimientos avanzados de JavaScript.
- No des explicaciones complicadas si existe una forma más simple de decirlo.
- Usa lenguaje claro, directo y pedagógico.
- Si usas términos técnicos, explícalos inmediatamente.
- El objetivo es que un estudiante universitario principiante pueda entender el código sin problemas.

IMPORTANTE SOBRE EL CONTENIDO

- No inventes cosas que no estén en el código.
- No omitas funciones, métodos ni partes importantes.
- No resumas de forma vaga: documenta con suficiente detalle.
- Mantén coherencia entre la explicación del código y la guía del archivo `.md`.

FORMATO DE ENTREGA

- Devuelve el resultado de forma ordenada.
- Si modificas archivos, conserva la estructura del proyecto.
- Si creas documentación dentro del código, hazla legible y uniforme.
- Prioriza claridad, precisión y utilidad educativa.

ANTES DE EMPEZAR

Analiza todo el proyecto primero para entender su estructura, dependencias y flujo general. Luego genera la documentación y la guía de JavaScript con base en ese análisis.


js
la documentacion debe ser echa unicamente en esta carpeta. En dado caso de q hallan relaciones, puedes documentar algo en 

styles.css
o 

index.html
 pero no es la prioridad para nada.

**Promt 2**
17/05/2026
9:40pm
Por motivos de conflictos con verciones del codigo en el git remoto y local, le pdi ayuda a la AI para resolverlo (ademas de estandarizar los comentarios). Promt:

El codigo ha sido editado, resuelve los errores que pueda tener y austa la documentacion de todos lor achivos a un estandar (El estandar es de: @contextScopeItemMention)

**Pormt 3**
19/05/26
3:42pm
Debido a la ultima separacion de codigos, se provoco una repeticion accidental de muchas podedazos del codigo, por lo que le dije a la AI que me ayudara a unificar muchas de estas funciones para evitar repetirlas tantas veces con este promt:

Resulta que en @contextScopeItemMention tenemos varios archivos .js con toda la funcionalidad de la pagina, pero me e percadao de que existen varios que, por una diviscion anterior del codigo, poseen gran parte de si mismos en otro codigo, funciones identicas que son solo las mismas lineas de codigo. Unifica estas partes en un archivo, pero que en el index.html todo siga funcionando bien.
Menciono esto porque @contextScopeItemMention  y @contextScopeItemMention  son casi el mismo codigo, varian en muy poquito y parecen lineas de codigo copias de la otra. Por lo que debes crear archivos que los unifiquen para avitar repetir funciones en el codigo general tantas veces