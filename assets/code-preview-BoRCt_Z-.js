import{H as e,U as t,b as n,d as r,j as i,m as a,u as o,y as s}from"./index-DsT9IMgw.js";var c=new Set(`abstract as async await break case catch class const continue debugger default delete do else enum export extends false finally for from function get if implements import in instanceof interface let new null of override private protected public readonly return set static super switch this throw true try type typeof undefined var void while yield declare keyof satisfies unknown never any string number boolean object`.split(` `)),l=/[A-Za-z_$][\w$]*/y,u=/\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?n?/iy;function d(e,t){let n=e[t++];for(;t<e.length&&e[t]!==n&&e[t]!==`
`;)t+=e[t]===`\\`?2:1;return Math.min(t+1,e.length)}function f(e,t){for(t++;t<e.length;){let n=e[t];if(n===`\\`)t+=2;else if(n==="`")return t+1;else n===`$`&&e[t+1]===`{`?t=p(e,t+2):t++}return e.length}function p(e,t){let n=1;for(;t<e.length;){let r=e[t];if(r==="`")t=f(e,t);else if(r===`'`||r===`"`)t=d(e,t);else if(r===`{`)n++,t++;else if(r===`}`){if(--n===0)return t+1;t++}else t++}return e.length}function m(e,t,n){return e.lastIndex=n,e.exec(t)?.[0]}function h(e){let t=[],n=0,r=0,i=(i,a)=>{n<r&&t.push({kind:`plain`,text:e.slice(n,r)}),t.push({kind:i,text:e.slice(r,a)}),r=n=a};for(;r<e.length;){let t=e[r],n=e[r+1];if(t===`/`&&n===`/`){let t=e.indexOf(`
`,r);i(`comment`,t<0?e.length:t)}else if(t===`/`&&n===`*`){let t=e.indexOf(`*/`,r+2);i(`comment`,t<0?e.length:t+2)}else if(t===`'`||t===`"`)i(`string`,d(e,r));else if(t==="`")i(`string`,f(e,r));else if(t===`@`&&/[A-Za-z_]/.test(n??``))i(`decorator`,r+1+m(l,e,r+1).length);else if(/\d/.test(t))i(`number`,r+m(u,e,r).length);else if(/[A-Za-z_$]/.test(t)){let t=m(l,e,r);c.has(t)?i(`keyword`,r+t.length):r+=t.length}else r++}return n<e.length&&t.push({kind:`plain`,text:e.slice(n)}),t}var g=Object.create,_=Object.defineProperty,v=Object.getOwnPropertyDescriptor,y=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),b=e=>{throw TypeError(e)},x=(e,t,n)=>t in e?_(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,S=(e,t)=>_(e,`name`,{value:t,configurable:!0}),C=e=>[,,,g(e?.[y(`metadata`)]??null)],w=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],T=e=>e!==void 0&&typeof e!=`function`?b(`Function expected`):e,E=(e,t,n,r,i)=>({kind:w[e],name:t,metadata:r,addInitializer:e=>n._?b(`Already initialized`):i.push(T(e||null))}),D=(e,t)=>x(t,y(`metadata`),e[3]),O=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},k=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=w[d+5],g=d>3&&(e[m-1]=[]),y=e[m]||(e[m]=[]),x=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&v(d<4?i:{get[n](){return M(this,a)},set[n](e){return N(this,a,e)}},n));d?p&&d<4&&S(a,(d>2?`set `:d>1?`get `:``)+n):S(i,n);for(var C=r.length-1;C>=0;C--)l=E(d,n,c={},e[3],y),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>j(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?M:P)(e,i,d^4?a:x.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>N(e,i,t,d^4?a:x.set):(e,t)=>e[n]=t)),s=(0,r[C])(d?d<4?p?a:x[h]:d>4?void 0:{get:x.get,set:x.set}:i,l),c._=1,d^4||s===void 0?T(s)&&(d>4?g.unshift(s):d?p?a=s:x[h]=s:i=s):typeof s!=`object`||!s?b(`Object expected`):(T(o=s.get)&&(x.get=o),T(o=s.set)&&(x.set=o),T(o=s.init)&&g.unshift(o));return d||D(e,i),x&&_(i,n,x),p?d^4?a:x:i},A=(e,t,n)=>t.has(e)||b(`Cannot `+n),j=(e,t)=>Object(t)===t?e.has(t):b(`Cannot use the "in" operator on this value`),M=(e,t,n)=>(A(e,t,`read from private field`),n?n.call(e):t.get(e)),N=(e,t,n,r)=>(A(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),P=(e,t,n)=>(A(e,t,`access private method`),n),F=[s(`code-preview`)],I,L,R=class extends (L=a){static shadowRootOptions={mode:`open`};static styles=i`
		:host {
			display: block; margin-block: 0 1.25rem; overflow: hidden; container-type: inline-size; scroll-margin-top: 4rem;
			background: var(--std-sys-color-surface-container-lowest, #fff); box-shadow: var(--std-elevation-1);
			border: 1px solid var(--std-sys-color-outline-variant, #cac4d0); border-radius: var(--std-shape-corner-medium, 12px);
		}
		.bar { display: flex; align-items: center; border-bottom: 1px solid var(--std-sys-color-outline-variant, #cac4d0); }
		.tabs { display: flex; flex: 1; min-width: 0; gap: 2px; overflow-x: auto; }
		.icon-btn {
			position: relative; display: inline-flex; flex: none; align-items: center; justify-content: center; width: 2rem; height: 2rem;
			margin-inline: 0.25rem; padding: 0; border: 0; border-radius: 50%; background: none; cursor: pointer;
			color: var(--std-sys-color-on-surface-variant, #49454f);
		}
		.icon-btn:hover { background: var(--std-sys-color-surface-container, #f3edf7); }
		.icon-btn input { position: absolute; opacity: 0; pointer-events: none; }
		.icon-btn:has(input:checked) { color: var(--std-sys-color-primary, #6750a4); background: var(--std-sys-color-secondary-container, #e8def8); }
		.icon-btn:has(input:focus-visible) { outline: 2px solid var(--std-sys-color-primary, #6750a4); outline-offset: 2px; }
		.icon-btn svg { width: 1.25rem; height: 1.25rem; fill: currentColor; }
		pre.wrap { white-space: pre-wrap; overflow-wrap: anywhere; }
		.tab {
			font: 500 0.8125rem/1 var(--std-ref-typeface-plain, Roboto, sans-serif);
			position: relative; padding: 0.6rem 0.9rem; cursor: pointer; white-space: nowrap;
			color: var(--std-sys-color-on-surface-variant, #49454f); border-bottom: 2px solid transparent;
		}
		/* Native radio group does the selection and arrow-key navigation; the input itself is hidden. */
		.tab input { position: absolute; opacity: 0; pointer-events: none; }
		.tab:has(input:checked) { color: var(--std-sys-color-primary, #6750a4); border-bottom-color: currentColor; }
		.tab:has(input:focus-visible) { outline: 2px solid var(--std-sys-color-primary, #6750a4); outline-offset: -2px; }
		pre {
			margin: 0; padding: 0.75rem 1rem; height: 18rem; min-height: 5rem; overflow: auto; resize: vertical; tab-size: 4;
			font: 400 0.8125rem/1.5 var(--std-ref-typeface-mono, 'Roboto Mono', monospace);
			background: var(--std-sys-color-surface-container, #f3edf7);
		}
		.comment { color: #6b6b76; font-style: italic; }
		.string { color: #0b6e4f; }
		.keyword { color: #7a2fbf; }
		.number { color: #b3261e; }
		.decorator { color: #9c4a00; }
		::slotted(*) { display: block; }
		.demo { padding: 1.25rem 1.5rem; border-top: 1px solid var(--std-sys-color-outline-variant, #cac4d0); min-width: 0; }
		/* Wide enough: code on the left, the rendered demo on the right. */
		@container (min-width: 56rem) {
			.layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
			/* The code column stretches to the row; its panel grows past the default height when the demo is taller. */
			.code { display: flex; flex-direction: column; min-height: 0; }
			pre { flex: 1 1 auto; height: 0; min-height: 18rem; resize: vertical; }
			.demo { border-top: 0; border-left: 1px solid var(--std-sys-color-outline-variant, #cac4d0); }
		}
	`;files=n({});active=n(``);wrap=n(!1);template(){let n=this.files(),i=Object.keys(n),a=this.active()in n?this.active():i[0]??``;return t`
			<div class="layout">
				<div class="code">
					<div class="bar">
						<div class="tabs" role="radiogroup" aria-label="Source files">
							${i.map(e=>t`
								<label class="tab">
									<input type="radio" name="file"
										.checked=${r({get:()=>e===a,set:t=>t&&this.active.set(e)})} />
									${e}
								</label>
							`)}
						</div>
						<label class="icon-btn" title="Toggle line wrap">
							<input type="checkbox" aria-label="Toggle line wrap" .checked=${r(this.wrap)} />
							${e`<svg viewBox="0 -960 960 960" aria-hidden="true"><path d="M120-200v-80h720v80H120Zm0-240v-80h560q50 0 85 35t35 85q0 50-35 85t-85 35H560v80l-120-120 120-120v80h120q17 0 28.500-11.500T720-400q0-17-11.500-28.500T680-440H120Zm0-240v-80h720v80H120Z"/></svg>`}
						</label>
					</div>
					<pre role="tabpanel" class="${o({wrap:this.wrap()})}"><code>${h(n[a]??``).map(e=>t`<span class="${e.kind}">${e.text}</span>`)}</code></pre>
				</div>
				<div class="demo"><slot></slot></div>
			</div>
		`}};I=C(L),R=k(I,0,`CodePreview`,F,R),O(I,1,R);