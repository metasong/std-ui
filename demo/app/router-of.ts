import type { Router, StdRouter } from '@std-ui/router';

/** The router of the nearest `<std-router>` ancestor. */
export const routerOf = (el: Element): Router => (el.closest('std-router') as StdRouter).router;
