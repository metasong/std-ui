// std-ui feature demo — each `<demo-*-section>` custom element below is defined by importing it
// (the `@tag()` class decorator in each module calls `customElements.define()` as a side effect),
// so this file only needs to pull every section in; `index.html` places the tags in the page.
import './sections/counter-section.js';
import './sections/attribute-section.js';
import './sections/context-section.js';
import './sections/query-section.js';
import './sections/directives-section.js';
import './sections/todo-section.js';
