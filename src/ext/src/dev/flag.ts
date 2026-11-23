// Local `DEV` flag. Dev/normal builds follow core's flag; `vite.release.config.ts` swaps this whole
// module for `export const DEV = false;`, so every `DEV ? long : short` and `if (DEV)` in ext is
// dead-code eliminated from the release bundle (importing `DEV` from `@std-ui/core` would not, as
// core is external there).
export { DEV } from '@std-ui/core';
