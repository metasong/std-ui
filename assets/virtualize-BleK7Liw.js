import{U as e,b as t,m as n,y as r}from"./index-DsT9IMgw.js";import{l as i}from"./src-vkAovAHS.js";import{t as a}from"./virtualize-list-styles-DuOPBH_K.js";import"./code-preview-BoRCt_Z-.js";var o=class{#e;#t;scrollToIndex(e,t={}){this.#e?this.#e.scrollToIndex(e,t):this.#t=[e,t]}_attach(e){if(this.#e=e,e&&this.#t){let[t,n]=this.#t;this.#t=void 0,e.scrollToIndex(t,n)}}},s=Object.create,c=Object.defineProperty,l=Object.getOwnPropertyDescriptor,u=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),d=e=>{throw TypeError(e)},f=(e,t,n)=>t in e?c(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,p=(e,t)=>c(e,`name`,{value:t,configurable:!0}),m=e=>[,,,s(e?.[u(`metadata`)]??null)],h=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],g=e=>e!==void 0&&typeof e!=`function`?d(`Function expected`):e,_=(e,t,n,r,i)=>({kind:h[e],name:t,metadata:r,addInitializer:e=>n._?d(`Already initialized`):i.push(g(e||null))}),v=(e,t)=>f(t,u(`metadata`),e[3]),y=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},b=(e,t,n,r,i,a)=>{var o,s,u,f,m,y=t&7,b=!!(t&8),x=!!(t&16),S=y>3?e.length+1:y?b?1:2:0,C=h[y+5],w=y>3&&(e[S-1]=[]),T=e[S]||(e[S]=[]),E=y&&(!x&&!b&&(i=i.prototype),y<5&&(y>3||!x)&&l(y<4?i:{get[n](){return te(this,a)},set[n](e){return ne(this,a,e)}},n));y?x&&y<4&&p(a,(y>2?`set `:y>1?`get `:``)+n):p(i,n);for(var D=r.length-1;D>=0;D--)f=_(y,n,u={},e[3],T),y&&(f.static=b,f.private=x,m=f.access={has:x?e=>ee(i,e):e=>n in e},y^3&&(m.get=x?e=>(y^1?te:re)(e,i,y^4?a:E.get):e=>e[n]),y>2&&(m.set=x?(e,t)=>ne(e,i,t,y^4?a:E.set):(e,t)=>e[n]=t)),s=(0,r[D])(y?y<4?x?a:E[C]:y>4?void 0:{get:E.get,set:E.set}:i,f),u._=1,y^4||s===void 0?g(s)&&(y>4?w.unshift(s):y?x?a=s:E[C]=s:i=s):typeof s!=`object`||!s?d(`Object expected`):(g(o=s.get)&&(E.get=o),g(o=s.set)&&(E.set=o),g(o=s.init)&&w.unshift(o));return y||v(e,i),E&&c(i,n,E),x?y^4?a:E:i},x=(e,t,n)=>t.has(e)||d(`Cannot `+n),ee=(e,t)=>Object(t)===t?e.has(t):d(`Cannot use the "in" operator on this value`),te=(e,t,n)=>(x(e,t,`read from private field`),n?n.call(e):t.get(e)),ne=(e,t,n,r)=>(x(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),re=(e,t,n)=>(x(e,t,`access private method`),n),S=[r(`demo-virtualize-vertical`)],C,w,T=class extends (w=n){static styles=a;#e=Array.from({length:1e4},(e,t)=>({i:t}));#t=new o;scrollHint=t(`—`);template(){return e`
			<h2 id="vertical">Vertical list (fixed <code>itemSize</code>)</h2>
			<p class="desc">
				10,000 rows; only the viewport window exists in the DOM. Jump by index or scroll — render count stays small.
			</p>
			<p class="demo-v-meta">Rendered nodes: about viewport ÷ itemSize (+ overscan), not 10,000.</p>
			<div class="demo-actions">
				<button type="button" class="tonal" @click=${()=>this.#t.scrollToIndex(0)}>Top</button>
				<button type="button" class="tonal" @click=${()=>this.#t.scrollToIndex(4999)}>Middle</button>
				<button type="button" class="tonal" @click="${()=>this.#t.scrollToIndex(9999,{align:`end`})}">End</button>
				<button type="button" @click=${()=>this.#n()}>Random</button>
			</div>
			<p class="demo-v-meta">Last jump: ${this.scrollHint()}</p>
			<div class="demo-v-scroller demo-v-scroller-y">
				<div>
					${i(this.#e,{itemSize:36,gap:0,overscan:4,controller:this.#t,keyFn:e=>e.i,renderItem:t=>e`
							<div
								class="demo-v-row ${t.i%2==0?`demo-v-row-even`:``}"
								style="height: 36px; box-sizing: border-box"
							>
								<span>Row ${t.i}</span>
							</div>
						`})}
				</div>
			</div>
		`}#n(){let e=Math.floor(Math.random()*this.#e.length);this.#t.scrollToIndex(e,{align:`center`}),this.scrollHint.set(`#${e}`)}};C=m(w),T=b(C,0,`DemoVirtualizeVertical`,S,T),y(C,1,T);var E=Object.create,D=Object.defineProperty,ie=Object.getOwnPropertyDescriptor,ae=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),O=e=>{throw TypeError(e)},oe=(e,t,n)=>t in e?D(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,se=(e,t)=>D(e,`name`,{value:t,configurable:!0}),ce=e=>[,,,E(e?.[ae(`metadata`)]??null)],le=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],k=e=>e!==void 0&&typeof e!=`function`?O(`Function expected`):e,ue=(e,t,n,r,i)=>({kind:le[e],name:t,metadata:r,addInitializer:e=>n._?O(`Already initialized`):i.push(k(e||null))}),de=(e,t)=>oe(t,ae(`metadata`),e[3]),fe=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},pe=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=le[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&ie(d<4?i:{get[n](){return he(this,a)},set[n](e){return ge(this,a,e)}},n));d?p&&d<4&&se(a,(d>2?`set `:d>1?`get `:``)+n):se(i,n);for(var y=r.length-1;y>=0;y--)l=ue(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>me(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?he:_e)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>ge(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?k(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?O(`Object expected`):(k(o=s.get)&&(v.get=o),k(o=s.set)&&(v.set=o),k(o=s.init)&&g.unshift(o));return d||de(e,i),v&&D(i,n,v),p?d^4?a:v:i},A=(e,t,n)=>t.has(e)||O(`Cannot `+n),me=(e,t)=>Object(t)===t?e.has(t):O(`Cannot use the "in" operator on this value`),he=(e,t,n)=>(A(e,t,`read from private field`),n?n.call(e):t.get(e)),ge=(e,t,n,r)=>(A(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),_e=(e,t,n)=>(A(e,t,`access private method`),n),ve,j,ye,be=[`Alpha`,`Beta`,`Gamma`,`Delta`,`Epsilon`,`Zeta`,`Eta`,`Theta`];function M(e){return e.i%25==0}function xe(e){return M(e)?40:28+e.i%5*6}ve=[r(`demo-virtualize-headers`)];var N=class extends (ye=n){static styles=a;#e=Array.from({length:800},(e,t)=>({i:t,section:Math.floor(t/100)}));#t=new o;template(){return e`
			<h2 id="headers">Sticky headers (variable size)</h2>
			<p class="desc">
				<code>isHeader</code> pins the current section title. Row sizes differ; no <code>itemSize</code> — sizes are measured. Give headers an opaque background (here
				<code>demo-v-header</code>).
			</p>
			<div class="demo-actions">
				<button type="button" class="tonal" @click="${()=>this.#t.scrollToIndex(350,{align:`start`})}">Section “Delta”</button>
				<button type="button" class="tonal" @click=${()=>this.#t.scrollToIndex(725)}>Section “Theta”</button>
			</div>
			<div class="demo-v-scroller demo-v-scroller-y">
				<div>
					${i(this.#e,{gap:0,lanes:1,isHeader:M,overscan:3,controller:this.#t,keyFn:e=>e.i,renderItem:t=>{let n=xe(t);if(M(t)){let r=be[t.section]??`Section ${t.section}`;return e`
									<div class="demo-v-header" style="height: ${String(n)}px; box-sizing: border-box">${r} · row ${t.i}</div>
								`}return e`
								<div class="demo-v-row" style="height: ${String(n)}px; box-sizing: border-box">
									<span>Item ${t.i}</span>
								</div>
							`}})}
				</div>
			</div>
		`}};j=ce(ye),N=pe(j,0,`DemoVirtualizeHeaders`,ve,N),fe(j,1,N);var Se=Object.create,P=Object.defineProperty,Ce=Object.getOwnPropertyDescriptor,we=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),F=e=>{throw TypeError(e)},Te=(e,t,n)=>t in e?P(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Ee=(e,t)=>P(e,`name`,{value:t,configurable:!0}),De=e=>[,,,Se(e?.[we(`metadata`)]??null)],Oe=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],I=e=>e!==void 0&&typeof e!=`function`?F(`Function expected`):e,ke=(e,t,n,r,i)=>({kind:Oe[e],name:t,metadata:r,addInitializer:e=>n._?F(`Already initialized`):i.push(I(e||null))}),Ae=(e,t)=>Te(t,we(`metadata`),e[3]),je=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},Me=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=Oe[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&Ce(d<4?i:{get[n](){return Pe(this,a)},set[n](e){return R(this,a,e)}},n));d?p&&d<4&&Ee(a,(d>2?`set `:d>1?`get `:``)+n):Ee(i,n);for(var y=r.length-1;y>=0;y--)l=ke(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>Ne(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Pe:Fe)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>R(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?I(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?F(`Object expected`):(I(o=s.get)&&(v.get=o),I(o=s.set)&&(v.set=o),I(o=s.init)&&g.unshift(o));return d||Ae(e,i),v&&P(i,n,v),p?d^4?a:v:i},L=(e,t,n)=>t.has(e)||F(`Cannot `+n),Ne=(e,t)=>Object(t)===t?e.has(t):F(`Cannot use the "in" operator on this value`),Pe=(e,t,n)=>(L(e,t,`read from private field`),n?n.call(e):t.get(e)),R=(e,t,n,r)=>(L(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Fe=(e,t,n)=>(L(e,t,`access private method`),n),Ie=[r(`demo-virtualize-grid`)],z,Le,B=class extends (Le=n){static styles=a;#e=Array.from({length:4e3},(e,t)=>({i:t}));template(){return e`
			<h2 id="grid">Grid (<code>lanes: 4</code>)</h2>
			<p class="desc">4,000 cells in a 4-column grid. Each virtualized row is one grid row (4 items).</p>
			<div class="demo-v-scroller demo-v-scroller-y">
				<div class="demo-v-grid">
					${i(this.#e,{itemSize:72,gap:8,lanes:4,overscan:2,keyFn:e=>e.i,renderItem:t=>e`
							<div class="demo-v-tile" style="height: 72px">${t.i}</div>
						`})}
				</div>
			</div>
		`}};z=De(Le),B=Me(z,0,`DemoVirtualizeGrid`,Ie,B),je(z,1,B);var Re=Object.create,V=Object.defineProperty,ze=Object.getOwnPropertyDescriptor,Be=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),H=e=>{throw TypeError(e)},Ve=(e,t,n)=>t in e?V(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,He=(e,t)=>V(e,`name`,{value:t,configurable:!0}),Ue=e=>[,,,Re(e?.[Be(`metadata`)]??null)],We=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],U=e=>e!==void 0&&typeof e!=`function`?H(`Function expected`):e,Ge=(e,t,n,r,i)=>({kind:We[e],name:t,metadata:r,addInitializer:e=>n._?H(`Already initialized`):i.push(U(e||null))}),Ke=(e,t)=>Ve(t,Be(`metadata`),e[3]),qe=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},Je=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=We[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&ze(d<4?i:{get[n](){return Xe(this,a)},set[n](e){return Ze(this,a,e)}},n));d?p&&d<4&&He(a,(d>2?`set `:d>1?`get `:``)+n):He(i,n);for(var y=r.length-1;y>=0;y--)l=Ge(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>Ye(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Xe:Qe)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Ze(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?U(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?H(`Object expected`):(U(o=s.get)&&(v.get=o),U(o=s.set)&&(v.set=o),U(o=s.init)&&g.unshift(o));return d||Ke(e,i),v&&V(i,n,v),p?d^4?a:v:i},W=(e,t,n)=>t.has(e)||H(`Cannot `+n),Ye=(e,t)=>Object(t)===t?e.has(t):H(`Cannot use the "in" operator on this value`),Xe=(e,t,n)=>(W(e,t,`read from private field`),n?n.call(e):t.get(e)),Ze=(e,t,n,r)=>(W(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Qe=(e,t,n)=>(W(e,t,`access private method`),n),$e=[r(`demo-virtualize-horizontal`)],G,et,K=class extends (et=n){static styles=a;#e=Array.from({length:2e3},(e,t)=>({i:t}));#t=new o;template(){return e`
			<h2 id="horizontal">Horizontal list</h2>
			<p class="desc"><code>direction: 'horizontal'</code> — window follows <code>scrollLeft</code>. Fixed card width via <code>itemSize</code>.</p>
			<div class="demo-actions">
				<button type="button" class="tonal" @click=${()=>this.#t.scrollToIndex(0)}>Start</button>
				<button type="button" class="tonal" @click="${()=>this.#t.scrollToIndex(1e3,{align:`center`})}">#1000</button>
				<button type="button" class="tonal" @click="${()=>this.#t.scrollToIndex(1999,{align:`end`})}">End</button>
			</div>
			<div class="demo-v-scroller demo-v-scroller-x" style="overflow-x: auto; overflow-y: hidden; padding: 8px">
				<div class="demo-v-h-track">
					${i(this.#e,{direction:`horizontal`,itemSize:148,gap:8,overscan:3,controller:this.#t,keyFn:e=>e.i,renderItem:t=>e`
							<div class="demo-v-card" style="width: 140px">Card ${t.i}</div>
						`})}
				</div>
			</div>
		`}};G=Ue(et),K=Je(G,0,`DemoVirtualizeHorizontal`,$e,K),qe(G,1,K);var tt=`// Fixed-height vertical list (~10k rows) + scrollToIndex.\r
import { tag, t, UIElement, state } from '@std-ui/core';\r
import { virtualize, VirtualizeController } from '@std-ui/ext';\r
import { virtualizeListStyles } from '../../../shared/virtualize-list-styles.js';\r
\r
type Row = { i: number };\r
\r
@tag('demo-virtualize-vertical')\r
export class DemoVirtualizeVertical extends UIElement {\r
	static override styles = virtualizeListStyles;\r
\r
	readonly #items: Row[] = Array.from({ length: 10_000 }, (_, i) => ({ i }));\r
	readonly #list = new VirtualizeController();\r
\r
	private readonly scrollHint = state('—');\r
\r
	protected override template() {\r
		return t\`\r
			<h2 id="vertical">Vertical list (fixed <code>itemSize</code>)</h2>\r
			<p class="desc">\r
				10,000 rows; only the viewport window exists in the DOM. Jump by index or scroll — render count stays small.\r
			</p>\r
			<p class="demo-v-meta">Rendered nodes: about viewport ÷ itemSize (+ overscan), not 10,000.</p>\r
			<div class="demo-actions">\r
				<button type="button" class="tonal" @click=\${() => this.#list.scrollToIndex(0)}>Top</button>\r
				<button type="button" class="tonal" @click=\${() => this.#list.scrollToIndex(4999)}>Middle</button>\r
				<button type="button" class="tonal" @click="\${() => this.#list.scrollToIndex(9999, { align: 'end' })}">End</button>\r
				<button type="button" @click=\${() => this.#jumpRandom()}>Random</button>\r
			</div>\r
			<p class="demo-v-meta">Last jump: \${this.scrollHint()}</p>\r
			<div class="demo-v-scroller demo-v-scroller-y">\r
				<div>\r
					\${virtualize(this.#items, {\r
						itemSize: 36,\r
						gap: 0,\r
						overscan: 4,\r
						controller: this.#list,\r
						keyFn: (r: Row) => r.i,\r
						renderItem: (r: Row) => t\`\r
							<div\r
								class="demo-v-row \${r.i % 2 === 0 ? 'demo-v-row-even' : ''}"\r
								style="height: 36px; box-sizing: border-box"\r
							>\r
								<span>Row \${r.i}</span>\r
							</div>\r
						\`,\r
					})}\r
				</div>\r
			</div>\r
		\`;\r
	}\r
\r
	#jumpRandom(): void {\r
		const i = Math.floor(Math.random() * this.#items.length);\r
		this.#list.scrollToIndex(i, { align: 'center' });\r
		this.scrollHint.set(\`#\${i}\`);\r
	}\r
}\r
`,nt=`// Variable row heights + sticky section headers (\`isHeader\`).\r
import { tag, t, UIElement,  } from '@std-ui/core';\r
import { virtualize, VirtualizeController } from '@std-ui/ext';\r
import { virtualizeListStyles } from '../../../shared/virtualize-list-styles.js';\r
\r
type Entry = { i: number; section: number };\r
\r
const SECTIONS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];\r
\r
function isHeader(e: Entry): boolean {\r
	return e.i % 25 === 0;\r
}\r
\r
function rowSize(e: Entry): number {\r
	if (isHeader(e)) return 40;\r
	return 28 + (e.i % 5) * 6;\r
}\r
\r
@tag('demo-virtualize-headers')\r
export class DemoVirtualizeHeaders extends UIElement {\r
	static override styles = virtualizeListStyles;\r
\r
	readonly #items: Entry[] = Array.from({ length: 800 }, (_, i) => ({\r
		i,\r
		section: Math.floor(i / 100),\r
	}));\r
	readonly #list = new VirtualizeController();\r
\r
	protected override template() {\r
		return t\`\r
			<h2 id="headers">Sticky headers (variable size)</h2>\r
			<p class="desc">\r
				<code>isHeader</code> pins the current section title. Row sizes differ; no <code>itemSize</code> — sizes are measured. Give headers an opaque background (here\r
				<code>demo-v-header</code>).\r
			</p>\r
			<div class="demo-actions">\r
				<button type="button" class="tonal" @click="\${() => this.#list.scrollToIndex(350, { align: 'start' })}">Section “Delta”</button>\r
				<button type="button" class="tonal" @click=\${() => this.#list.scrollToIndex(725)}>Section “Theta”</button>\r
			</div>\r
			<div class="demo-v-scroller demo-v-scroller-y">\r
				<div>\r
					\${virtualize(this.#items, {\r
						gap: 0,\r
						lanes: 1,\r
						isHeader,\r
						overscan: 3,\r
						controller: this.#list,\r
						keyFn: (e: Entry) => e.i,\r
						renderItem: (e: Entry) => {\r
							const h = rowSize(e);\r
							if (isHeader(e)) {\r
								const title = SECTIONS[e.section] ?? \`Section \${e.section}\`;\r
								return t\`\r
									<div class="demo-v-header" style="height: \${String(h)}px; box-sizing: border-box">\${title} · row \${e.i}</div>\r
								\`;\r
							}\r
							return t\`\r
								<div class="demo-v-row" style="height: \${String(h)}px; box-sizing: border-box">\r
									<span>Item \${e.i}</span>\r
								</div>\r
							\`;\r
						},\r
					})}\r
				</div>\r
			</div>\r
		\`;\r
	}\r
}\r
`,rt=`// Multi-lane grid (4 columns).\r
import { tag, t, UIElement } from '@std-ui/core';\r
import { virtualize } from '@std-ui/ext';\r
import { virtualizeListStyles } from '../../../shared/virtualize-list-styles.js';\r
\r
type Cell = { i: number };\r
\r
@tag('demo-virtualize-grid')\r
export class DemoVirtualizeGrid extends UIElement {\r
	static override styles = virtualizeListStyles;\r
\r
	readonly #items: Cell[] = Array.from({ length: 4_000 }, (_, i) => ({ i }));\r
\r
	protected override template() {\r
		return t\`\r
			<h2 id="grid">Grid (<code>lanes: 4</code>)</h2>\r
			<p class="desc">4,000 cells in a 4-column grid. Each virtualized row is one grid row (4 items).</p>\r
			<div class="demo-v-scroller demo-v-scroller-y">\r
				<div class="demo-v-grid">\r
					\${virtualize(this.#items, {\r
						itemSize: 72,\r
						gap: 8,\r
						lanes: 4,\r
						overscan: 2,\r
						keyFn: (c: Cell) => c.i,\r
						renderItem: (c: Cell) => t\`\r
							<div class="demo-v-tile" style="height: 72px">\${c.i}</div>\r
						\`,\r
					})}\r
				</div>\r
			</div>\r
		\`;\r
	}\r
}\r
`,it=`// Horizontal scroll.\r
import { tag, t, UIElement,  } from '@std-ui/core';\r
import { virtualize, VirtualizeController } from '@std-ui/ext';\r
import { virtualizeListStyles } from '../../../shared/virtualize-list-styles.js';\r
\r
type Card = { i: number };\r
\r
@tag('demo-virtualize-horizontal')\r
export class DemoVirtualizeHorizontal extends UIElement {\r
	static override styles = virtualizeListStyles;\r
\r
	readonly #items: Card[] = Array.from({ length: 2_000 }, (_, i) => ({ i }));\r
	readonly #list = new VirtualizeController();\r
\r
	protected override template() {\r
		return t\`\r
			<h2 id="horizontal">Horizontal list</h2>\r
			<p class="desc"><code>direction: 'horizontal'</code> — window follows <code>scrollLeft</code>. Fixed card width via <code>itemSize</code>.</p>\r
			<div class="demo-actions">\r
				<button type="button" class="tonal" @click=\${() => this.#list.scrollToIndex(0)}>Start</button>\r
				<button type="button" class="tonal" @click="\${() => this.#list.scrollToIndex(1000, { align: 'center' })}">#1000</button>\r
				<button type="button" class="tonal" @click="\${() => this.#list.scrollToIndex(1999, { align: 'end' })}">End</button>\r
			</div>\r
			<div class="demo-v-scroller demo-v-scroller-x" style="overflow-x: auto; overflow-y: hidden; padding: 8px">\r
				<div class="demo-v-h-track">\r
					\${virtualize(this.#items, {\r
						direction: 'horizontal',\r
						itemSize: 148,\r
						gap: 8,\r
						overscan: 3,\r
						controller: this.#list,\r
						keyFn: (c: Card) => c.i,\r
						renderItem: (c: Card) => t\`\r
							<div class="demo-v-card" style="width: 140px">Card \${c.i}</div>\r
						\`,\r
					})}\r
				</div>\r
			</div>\r
		\`;\r
	}\r
}\r
`,at=Object.create,q=Object.defineProperty,ot=Object.getOwnPropertyDescriptor,st=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),J=e=>{throw TypeError(e)},ct=(e,t,n)=>t in e?q(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,lt=(e,t)=>q(e,`name`,{value:t,configurable:!0}),ut=e=>[,,,at(e?.[st(`metadata`)]??null)],Y=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],X=e=>e!==void 0&&typeof e!=`function`?J(`Function expected`):e,dt=(e,t,n,r,i)=>({kind:Y[e],name:t,metadata:r,addInitializer:e=>n._?J(`Already initialized`):i.push(X(e||null))}),ft=(e,t)=>ct(t,st(`metadata`),e[3]),pt=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},mt=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=Y[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&ot(d<4?i:{get[n](){return gt(this,a)},set[n](e){return _t(this,a,e)}},n));d?p&&d<4&&lt(a,(d>2?`set `:d>1?`get `:``)+n):lt(i,n);for(var y=r.length-1;y>=0;y--)l=dt(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>ht(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?gt:vt)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>_t(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?X(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?J(`Object expected`):(X(o=s.get)&&(v.get=o),X(o=s.set)&&(v.set=o),X(o=s.init)&&g.unshift(o));return d||ft(e,i),v&&q(i,n,v),p?d^4?a:v:i},Z=(e,t,n)=>t.has(e)||J(`Cannot `+n),ht=(e,t)=>Object(t)===t?e.has(t):J(`Cannot use the "in" operator on this value`),gt=(e,t,n)=>(Z(e,t,`read from private field`),n?n.call(e):t.get(e)),_t=(e,t,n,r)=>(Z(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),vt=(e,t,n)=>(Z(e,t,`access private method`),n),yt,Q,bt,xt={"vertical-section.ts":tt},St={"headers-section.ts":nt},Ct={"grid-section.ts":rt},wt={"horizontal-section.ts":it};yt=[r(`demo-virtualize-page`)];var $=class extends (bt=n){template(){return e`
			<code-preview .files=${xt}><demo-virtualize-vertical></demo-virtualize-vertical></code-preview>
			<code-preview .files=${St}><demo-virtualize-headers></demo-virtualize-headers></code-preview>
			<code-preview .files=${Ct}><demo-virtualize-grid></demo-virtualize-grid></code-preview>
			<code-preview .files=${wt}><demo-virtualize-horizontal></demo-virtualize-horizontal></code-preview>
		`}};Q=ut(bt),$=mt(Q,0,`DemoVirtualizePage`,yt,$),pt(Q,1,$);