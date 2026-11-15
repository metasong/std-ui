import { transformSync } from '@babel/core';
import decorators from '@babel/plugin-proposal-decorators';
window.transformDecorators = (code) => transformSync(code, {
  babelrc: false, configFile: false, sourceType: 'script',
  plugins: [[decorators, { version: '2023-11' }]],
}).code;
