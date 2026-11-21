import{U as e,b as t,m as n,o as r,v as i,y as a}from"./index-DsT9IMgw.js";import"./code-preview-BoRCt_Z-.js";var o=Object.create,s=Object.defineProperty,c=Object.getOwnPropertyDescriptor,l=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),u=e=>{throw TypeError(e)},d=(e,t,n)=>t in e?s(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,f=(e,t)=>s(e,`name`,{value:t,configurable:!0}),p=e=>[,,,o(e?.[l(`metadata`)]??null)],m=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],h=e=>e!==void 0&&typeof e!=`function`?u(`Function expected`):e,g=(e,t,n,r,i)=>({kind:m[e],name:t,metadata:r,addInitializer:e=>n._?u(`Already initialized`):i.push(h(e||null))}),_=(e,t)=>d(t,l(`metadata`),e[3]),v=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},y=(e,t,n,r,i,a)=>{var o,l,d,p,v,y=t&7,b=!!(t&8),x=!!(t&16),C=y>3?e.length+1:y?b?1:2:0,w=m[y+5],T=y>3&&(e[C-1]=[]),re=e[C]||(e[C]=[]),E=y&&(!x&&!b&&(i=i.prototype),y<5&&(y>3||!x)&&c(y<4?i:{get[n](){return te(this,a)},set[n](e){return S(this,a,e)}},n));y?x&&y<4&&f(a,(y>2?`set `:y>1?`get `:``)+n):f(i,n);for(var D=r.length-1;D>=0;D--)p=g(y,n,d={},e[3],re),y&&(p.static=b,p.private=x,v=p.access={has:x?e=>ee(i,e):e=>n in e},y^3&&(v.get=x?e=>(y^1?te:ne)(e,i,y^4?a:E.get):e=>e[n]),y>2&&(v.set=x?(e,t)=>S(e,i,t,y^4?a:E.set):(e,t)=>e[n]=t)),l=(0,r[D])(y?y<4?x?a:E[w]:y>4?void 0:{get:E.get,set:E.set}:i,p),d._=1,y^4||l===void 0?h(l)&&(y>4?T.unshift(l):y?x?a=l:E[w]=l:i=l):typeof l!=`object`||!l?u(`Object expected`):(h(o=l.get)&&(E.get=o),h(o=l.set)&&(E.set=o),h(o=l.init)&&T.unshift(o));return y||_(e,i),E&&s(i,n,E),x?y^4?a:E:i},b=(e,t,n)=>d(e,typeof t==`symbol`?t:t+``,n),x=(e,t,n)=>t.has(e)||u(`Cannot `+n),ee=(e,t)=>Object(t)===t?e.has(t):u(`Cannot use the "in" operator on this value`),te=(e,t,n)=>(x(e,t,`read from private field`),n?n.call(e):t.get(e)),S=(e,t,n,r)=>(x(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),ne=(e,t,n)=>(x(e,t,`access private method`),n),C,w,T,re=[a(`demo-light-card`)],E,D,O,ie,k=class extends (T=n,w=[i({selector:`*`})],C=[i({slot:`title`,selector:`*`})],T){constructor(){super(...arguments),b(this,`slotted`,t(``)),b(this,`defaultChildren`,v(E,8,this)),v(E,11,this),b(this,`titleChildren`,v(E,12,this)),v(E,15,this)}template(){return e`
			<article class="demo-slot-card">
				<header>${r(`title`,e`<em>(no title)</em>`)}</header>
				<div class="body">${r()}</div>
				<footer>${r(`footer`,e`<small>default footer (fallback)</small>`)}</footer>
				<button type="button" @click=${()=>this.slotted.set(`title: ${this.titleChildren.length}, default elements: ${this.defaultChildren.length}`)}>count slotted</button>
				<small>${this.slotted()}</small>
			</article>
		`}};E=p(T),y(E,5,`defaultChildren`,w,k),y(E,5,`titleChildren`,C,k),k=y(E,0,`DemoLightCard`,re,k),v(E,1,k),D=[a(`demo-slot-light-section`)];var A=class extends (ie=n){template(){return e`
			<section class="demo-slot-block" id="light">
				<h2>Light DOM <code>slot()</code></h2>
				<p class="desc">
					Default <code>UIElement</code> (no shadow root). The parent's children are snapshotted on
					connect and moved into the <code>slot()</code> positions. Global page styles still apply.
				</p>
				<demo-light-card>
					<h3 slot="title">Card with title</h3>
					<p>Default-slot paragraph.</p>
					<p>Second paragraph.</p>
					<small slot="footer">Custom footer</small>
				</demo-light-card>
				<demo-light-card>
					<p>No title, no footer: fallbacks render.</p>
				</demo-light-card>
			</section>
		`}};O=p(ie),A=y(O,0,`DemoSlotLightSection`,D,A),v(O,1,A);var ae=Object.create,j=Object.defineProperty,oe=Object.getOwnPropertyDescriptor,M=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),N=e=>{throw TypeError(e)},se=(e,t,n)=>t in e?j(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,ce=(e,t)=>j(e,`name`,{value:t,configurable:!0}),le=e=>[,,,ae(e?.[M(`metadata`)]??null)],ue=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],P=e=>e!==void 0&&typeof e!=`function`?N(`Function expected`):e,de=(e,t,n,r,i)=>({kind:ue[e],name:t,metadata:r,addInitializer:e=>n._?N(`Already initialized`):i.push(P(e||null))}),fe=(e,t)=>se(t,M(`metadata`),e[3]),F=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},I=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=ue[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&oe(d<4?i:{get[n](){return z(this,a)},set[n](e){return B(this,a,e)}},n));d?p&&d<4&&ce(a,(d>2?`set `:d>1?`get `:``)+n):ce(i,n);for(var y=r.length-1;y>=0;y--)l=de(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>pe(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?z:me)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>B(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?P(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?N(`Object expected`):(P(o=s.get)&&(v.get=o),P(o=s.set)&&(v.set=o),P(o=s.init)&&g.unshift(o));return d||fe(e,i),v&&j(i,n,v),p?d^4?a:v:i},L=(e,t,n)=>se(e,typeof t==`symbol`?t:t+``,n),R=(e,t,n)=>t.has(e)||N(`Cannot `+n),pe=(e,t)=>Object(t)===t?e.has(t):N(`Cannot use the "in" operator on this value`),z=(e,t,n)=>(R(e,t,`read from private field`),n?n.call(e):t.get(e)),B=(e,t,n,r)=>(R(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),me=(e,t,n)=>(R(e,t,`access private method`),n),V,H,U,he=[a(`demo-shadow-card`)],W,ge,G,_e,K=class extends (U=n,H=[i({selector:`*`})],V=[i({slot:`title`,selector:`*`})],U){constructor(){super(...arguments),L(this,`slotted`,t(``)),L(this,`defaultChildren`,F(W,8,this)),F(W,11,this),L(this,`titleChildren`,F(W,12,this)),F(W,15,this)}template(){return e`
			<style>
				:host { display: block; margin-block: 1rem; }
				article { border: 2px solid var(--std-sys-color-tertiary, #7d5260); border-radius: 12px; padding: 1rem; }
				::slotted([slot='title']) { color: var(--std-sys-color-tertiary, #7d5260); margin: 0 0 0.5rem; }
				button { font: inherit; }
			</style>
			<article>
				<header><slot name="title"><em>(no title)</em></slot></header>
				<div><slot></slot></div>
				<footer><slot name="footer"><small>default footer (fallback)</small></slot></footer>
				<button type="button" @click=${()=>this.slotted.set(`title: ${this.titleChildren.length}, default elements: ${this.defaultChildren.length}`)}>count slotted</button>
				<small>${this.slotted()}</small>
			</article>
		`}};W=le(U),I(W,5,`defaultChildren`,H,K),I(W,5,`titleChildren`,V,K),K=I(W,0,`DemoShadowCard`,he,K),L(K,`shadowRootOptions`,{mode:`open`}),F(W,1,K),ge=[a(`demo-slot-shadow-section`)];var q=class extends (_e=n){template(){return e`
			<section class="demo-slot-block" id="shadow">
				<h2>Shadow DOM native <code>&lt;slot&gt;</code></h2>
				<p class="desc">
					Same markup, but the component sets <code>static shadowRootOptions</code> and uses native
					<code>&lt;slot&gt;</code> (so <code>::slotted()</code> styling works). Do not use the
					<code>slot()</code> directive here; dev builds throw.
				</p>
				<demo-shadow-card>
					<h3 slot="title">Card with title</h3>
					<p>Default-slot paragraph.</p>
					<p>Second paragraph.</p>
					<small slot="footer">Custom footer</small>
				</demo-shadow-card>
				<demo-shadow-card>
					<p>No title, no footer: fallbacks render.</p>
				</demo-shadow-card>
			</section>
		`}};G=le(_e),q=I(G,0,`DemoSlotShadowSection`,ge,q),F(G,1,q);var ve=`// Light-DOM slots: \`slot()\` directive + \`@queryAssignedNodes\` reading the same content.\r
import { slot, t, tag, UIElement, state, queryAssignedNodes } from '@std-ui/core';
\r
@tag('demo-light-card')\r
export class DemoLightCard extends UIElement {\r
	readonly slotted = state('');\r
\r
	@queryAssignedNodes<HTMLElement>({ selector: '*' }) defaultChildren!: HTMLElement[];\r
	@queryAssignedNodes<HTMLElement>({ slot: 'title', selector: '*' }) titleChildren!: HTMLElement[];\r
\r
	protected override template() {\r
		return t\`\r
			<article class="demo-slot-card">\r
				<header>\${slot('title', t\`<em>(no title)</em>\`)}</header>\r
				<div class="body">\${slot()}</div>\r
				<footer>\${slot('footer', t\`<small>default footer (fallback)</small>\`)}</footer>\r
				<button type="button" @click=\${() => this.slotted.set(\r
					\`title: \${this.titleChildren.length}, default elements: \${this.defaultChildren.length}\`,\r
				)}>count slotted</button>\r
				<small>\${this.slotted()}</small>\r
			</article>\r
		\`;\r
	}\r
}\r
\r
@tag('demo-slot-light-section')\r
export class DemoSlotLightSection extends UIElement {\r
	protected override template() {\r
		return t\`\r
			<section class="demo-slot-block" id="light">\r
				<h2>Light DOM <code>slot()</code></h2>\r
				<p class="desc">\r
					Default <code>UIElement</code> (no shadow root). The parent's children are snapshotted on\r
					connect and moved into the <code>slot()</code> positions. Global page styles still apply.\r
				</p>\r
				<demo-light-card>\r
					<h3 slot="title">Card with title</h3>\r
					<p>Default-slot paragraph.</p>\r
					<p>Second paragraph.</p>\r
					<small slot="footer">Custom footer</small>\r
				</demo-light-card>\r
				<demo-light-card>\r
					<p>No title, no footer: fallbacks render.</p>\r
				</demo-light-card>\r
			</section>\r
		\`;\r
	}\r
}\r
`,ye=`// Shadow-DOM slots: native \`<slot>\` + \`@queryAssignedNodes\` (delegates to \`slot.assignedNodes()\`).\r
import { t, tag, UIElement, state, queryAssignedNodes } from '@std-ui/core';
\r
@tag('demo-shadow-card')\r
export class DemoShadowCard extends UIElement {\r
	static override shadowRootOptions = { mode: 'open' } as const;\r
\r
	readonly slotted = state('');\r
\r
	@queryAssignedNodes<HTMLElement>({ selector: '*' }) defaultChildren!: HTMLElement[];\r
	@queryAssignedNodes<HTMLElement>({ slot: 'title', selector: '*' }) titleChildren!: HTMLElement[];\r
\r
	protected override template() {\r
		return t\`\r
			<style>\r
				:host { display: block; margin-block: 1rem; }\r
				article { border: 2px solid var(--std-sys-color-tertiary, #7d5260); border-radius: 12px; padding: 1rem; }\r
				::slotted([slot='title']) { color: var(--std-sys-color-tertiary, #7d5260); margin: 0 0 0.5rem; }\r
				button { font: inherit; }\r
			</style>\r
			<article>\r
				<header><slot name="title"><em>(no title)</em></slot></header>\r
				<div><slot></slot></div>\r
				<footer><slot name="footer"><small>default footer (fallback)</small></slot></footer>\r
				<button type="button" @click=\${() => this.slotted.set(\r
					\`title: \${this.titleChildren.length}, default elements: \${this.defaultChildren.length}\`,\r
				)}>count slotted</button>\r
				<small>\${this.slotted()}</small>\r
			</article>\r
		\`;\r
	}\r
}\r
\r
@tag('demo-slot-shadow-section')\r
export class DemoSlotShadowSection extends UIElement {\r
	protected override template() {\r
		return t\`\r
			<section class="demo-slot-block" id="shadow">\r
				<h2>Shadow DOM native <code>&lt;slot&gt;</code></h2>\r
				<p class="desc">\r
					Same markup, but the component sets <code>static shadowRootOptions</code> and uses native\r
					<code>&lt;slot&gt;</code> (so <code>::slotted()</code> styling works). Do not use the\r
					<code>slot()</code> directive here; dev builds throw.\r
				</p>\r
				<demo-shadow-card>\r
					<h3 slot="title">Card with title</h3>\r
					<p>Default-slot paragraph.</p>\r
					<p>Second paragraph.</p>\r
					<small slot="footer">Custom footer</small>\r
				</demo-shadow-card>\r
				<demo-shadow-card>\r
					<p>No title, no footer: fallbacks render.</p>\r
				</demo-shadow-card>\r
			</section>\r
		\`;\r
	}\r
}\r
`,be=Object.create,J=Object.defineProperty,xe=Object.getOwnPropertyDescriptor,Se=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),Y=e=>{throw TypeError(e)},Ce=(e,t,n)=>t in e?J(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,we=(e,t)=>J(e,`name`,{value:t,configurable:!0}),Te=e=>[,,,be(e?.[Se(`metadata`)]??null)],Ee=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],X=e=>e!==void 0&&typeof e!=`function`?Y(`Function expected`):e,De=(e,t,n,r,i)=>({kind:Ee[e],name:t,metadata:r,addInitializer:e=>n._?Y(`Already initialized`):i.push(X(e||null))}),Oe=(e,t)=>Ce(t,Se(`metadata`),e[3]),ke=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},Ae=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=Ee[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&xe(d<4?i:{get[n](){return Me(this,a)},set[n](e){return Ne(this,a,e)}},n));d?p&&d<4&&we(a,(d>2?`set `:d>1?`get `:``)+n):we(i,n);for(var y=r.length-1;y>=0;y--)l=De(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>je(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Me:Pe)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Ne(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?X(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?Y(`Object expected`):(X(o=s.get)&&(v.get=o),X(o=s.set)&&(v.set=o),X(o=s.init)&&g.unshift(o));return d||Oe(e,i),v&&J(i,n,v),p?d^4?a:v:i},Z=(e,t,n)=>t.has(e)||Y(`Cannot `+n),je=(e,t)=>Object(t)===t?e.has(t):Y(`Cannot use the "in" operator on this value`),Me=(e,t,n)=>(Z(e,t,`read from private field`),n?n.call(e):t.get(e)),Ne=(e,t,n,r)=>(Z(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Pe=(e,t,n)=>(Z(e,t,`access private method`),n),Fe,Q,Ie,Le={"light-section.ts":ve},Re={"shadow-section.ts":ye};Fe=[a(`demo-slot-page`)];var $=class extends (Ie=n){template(){return e`
			<code-preview .files=${Le}><demo-slot-light-section></demo-slot-light-section></code-preview>
			<code-preview .files=${Re}><demo-slot-shadow-section></demo-slot-shadow-section></code-preview>
		`}};Q=Te(Ie),$=Ae(Q,0,`DemoSlotPage`,Fe,$),ke(Q,1,$);