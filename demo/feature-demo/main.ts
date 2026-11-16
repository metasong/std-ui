import '../shared/demo-nav.js';
// std-ui feature demo — each `<demo-*-section>` custom element is defined by importing it (the `@tag()`
// class decorator calls `customElements.define()` as a side effect). `feature-page` then places the
// tags in the page, each inside a `<code-preview>`.
import './sections/counter-section.js';
import './sections/attribute-section.js';
import './sections/context-section.js';
import './sections/query-section.js';
import './sections/shadow-section.js';
import './sections/css-section.js';
import './sections/directives-section.js';
import './sections/bindings-section.js';
import './sections/todo-section.js';
import './sections/map-by-key-section.js';
import './feature-page.js';
