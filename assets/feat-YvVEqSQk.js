import{U as e,b as t,j as n,m as r,p as i,y as a}from"./index-DsT9IMgw.js";import{o,s}from"./src-vkAovAHS.js";import"./code-preview-BoRCt_Z-.js";var c=Object.create,l=Object.defineProperty,u=Object.getOwnPropertyDescriptor,d=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),f=e=>{throw TypeError(e)},p=(e,t,n)=>t in e?l(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,m=(e,t)=>l(e,`name`,{value:t,configurable:!0}),h=e=>[,,,c(e?.[d(`metadata`)]??null)],g=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],_=e=>e!==void 0&&typeof e!=`function`?f(`Function expected`):e,v=(e,t,n,r,i)=>({kind:g[e],name:t,metadata:r,addInitializer:e=>n._?f(`Already initialized`):i.push(_(e||null))}),y=(e,t)=>p(t,d(`metadata`),e[3]),b=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},x=(e,t,n,r,i,a)=>{var o,s,c,d,p,h=t&7,b=!!(t&8),x=!!(t&16),S=h>3?e.length+1:h?b?1:2:0,T=g[h+5],E=h>3&&(e[S-1]=[]),D=e[S]||(e[S]=[]),O=h&&(!x&&!b&&(i=i.prototype),h<5&&(h>3||!x)&&u(h<4?i:{get[n](){return C(this,a)},set[n](e){return w(this,a,e)}},n));h?x&&h<4&&m(a,(h>2?`set `:h>1?`get `:``)+n):m(i,n);for(var k=r.length-1;k>=0;k--)d=v(h,n,c={},e[3],D),h&&(d.static=b,d.private=x,p=d.access={has:x?e=>ee(i,e):e=>n in e},h^3&&(p.get=x?e=>(h^1?C:te)(e,i,h^4?a:O.get):e=>e[n]),h>2&&(p.set=x?(e,t)=>w(e,i,t,h^4?a:O.set):(e,t)=>e[n]=t)),s=(0,r[k])(h?h<4?x?a:O[T]:h>4?void 0:{get:O.get,set:O.set}:i,d),c._=1,h^4||s===void 0?_(s)&&(h>4?E.unshift(s):h?x?a=s:O[T]=s:i=s):typeof s!=`object`||!s?f(`Object expected`):(_(o=s.get)&&(O.get=o),_(o=s.set)&&(O.set=o),_(o=s.init)&&E.unshift(o));return h||y(e,i),O&&l(i,n,O),x?h^4?a:O:i},S=(e,t,n)=>t.has(e)||f(`Cannot `+n),ee=(e,t)=>Object(t)===t?e.has(t):f(`Cannot use the "in" operator on this value`),C=(e,t,n)=>(S(e,t,`read from private field`),n?n.call(e):t.get(e)),w=(e,t,n,r)=>(S(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),te=(e,t,n)=>(S(e,t,`access private method`),n),T,E,D,O,k,ne,re=class extends i{now=t(Date.now());running=t(!0);connected(){this.effect(e=>{if(!this.running())return;let t=setInterval(()=>this.now.set(Date.now()),1e3);e(()=>clearInterval(t))})}toggle(){this.running.set(!this.running.peek())}};T=[a(`demo-feat-clock`)];var A=class extends (D=r){#e=new re(this);#t=new o(this,{" ":e=>{e.preventDefault(),this.#e.toggle()}});template(){return e`
			<div tabindex="0">
				<time>${new Date(this.#e.now()).toLocaleTimeString()}</time>
				<button type="button" @click=${()=>this.#e.toggle()}>${this.#e.running()?`pause`:`resume`}</button>
				<small>focus here and press Space</small>
			</div>
		`}};E=h(D),A=x(E,0,`DemoFeatClock`,T,A),b(E,1,A),O=[a(`demo-feat-clock-section`)];var j=class extends (ne=r){template(){return e`
			<section id="clock">
				<h2>Feature objects</h2>
				<p class="desc">
					<code>ClockFeat</code> owns its signals, timer and cleanup; <code>HotkeyFeat</code> comes from ext.
					Both are created in field initializers, so the element class only wires them together.
					Remove the element and the interval and key listener are gone.
				</p>
				<demo-feat-clock></demo-feat-clock>
			</section>
		`}};k=h(ne),j=x(k,0,`DemoFeatClockSection`,O,j),b(k,1,j);var ie=Object.create,M=Object.defineProperty,ae=Object.getOwnPropertyDescriptor,oe=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),N=e=>{throw TypeError(e)},se=(e,t,n)=>t in e?M(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,ce=(e,t)=>M(e,`name`,{value:t,configurable:!0}),le=e=>[,,,ie(e?.[oe(`metadata`)]??null)],P=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],F=e=>e!==void 0&&typeof e!=`function`?N(`Function expected`):e,ue=(e,t,n,r,i)=>({kind:P[e],name:t,metadata:r,addInitializer:e=>n._?N(`Already initialized`):i.push(F(e||null))}),de=(e,t)=>se(t,oe(`metadata`),e[3]),I=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},L=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=P[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&ae(d<4?i:{get[n](){return z(this,a)},set[n](e){return B(this,a,e)}},n));d?p&&d<4&&ce(a,(d>2?`set `:d>1?`get `:``)+n):ce(i,n);for(var y=r.length-1;y>=0;y--)l=ue(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>fe(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?z:pe)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>B(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?F(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?N(`Object expected`):(F(o=s.get)&&(v.get=o),F(o=s.set)&&(v.set=o),F(o=s.init)&&g.unshift(o));return d||de(e,i),v&&M(i,n,v),p?d^4?a:v:i},R=(e,t,n)=>t.has(e)||N(`Cannot `+n),fe=(e,t)=>Object(t)===t?e.has(t):N(`Cannot use the "in" operator on this value`),z=(e,t,n)=>(R(e,t,`read from private field`),n?n.call(e):t.get(e)),B=(e,t,n,r)=>(R(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),pe=(e,t,n)=>(R(e,t,`access private method`),n),me=[a(`demo-feat-counter`),s({ArrowUp:e=>e.currentTarget.count.update(e=>e+1),ArrowDown:e=>e.currentTarget.count.update(e=>e-1)})],V,H,U,W,he,G=class extends (H=r){static styles=n`div:focus { outline: 2px solid currentColor; outline-offset: 2px; }`;count=t(0);template(){return e`<div tabindex="0">count: <b>${this.count()}</b> <small>focus, then ArrowUp / ArrowDown</small></div>`}};V=le(H),G=L(V,0,`DemoFeatCounter`,me,G),I(V,1,G),U=[a(`demo-feat-decorator-section`)];var K=class extends (he=r){template(){return e`
			<section id="decorator">
				<h2>Decorator attachment</h2>
				<p class="desc">
					<code>@hotkeys()</code> calls <code>UIFeat.attachTo()</code>: each instance below gets its own feature,
					created on its first connect. The class body has no key-handling code.
				</p>
				<demo-feat-counter></demo-feat-counter>
				<demo-feat-counter></demo-feat-counter>
			</section>
		`}};W=le(he),K=L(W,0,`DemoFeatDecoratorSection`,U,K),I(W,1,K);var ge=`// A custom \`UIFeat\` (clock with timer cleanup) composed with a ready-made one (\`HotkeyFeat\`) in field initializers.\r
import { state, t, tag, UIElement, UIFeat } from '@std-ui/core';\r
import { HotkeyFeat } from '@std-ui/ext';\r
\r
class ClockFeat extends UIFeat {\r
	readonly now = state(Date.now());\r
	readonly running = state(true);\r
\r
	protected override connected() {\r
		// Re-runs on every connect; the effect is disposed on disconnect, and so is the interval via the cleanup.\r
		this.effect((onCleanup) => {\r
			if (!this.running()) return;\r
			const id = setInterval(() => this.now.set(Date.now()), 1000);\r
			onCleanup(() => clearInterval(id));\r
		});\r
	}\r
\r
	toggle(): void {\r
		this.running.set(!this.running.peek());\r
	}\r
}\r
\r
@tag('demo-feat-clock')\r
export class DemoFeatClock extends UIElement {\r
	readonly #clock = new ClockFeat(this);\r
	// Space toggles the clock while this element (or a child) has focus.\r
	readonly #keys = new HotkeyFeat(this, { ' ': (e) => { e.preventDefault(); this.#clock.toggle(); } });\r
\r
	protected override template() {\r
		return t\`\r
			<div tabindex="0">\r
				<time>\${new Date(this.#clock.now()).toLocaleTimeString()}</time>\r
				<button type="button" @click=\${() => this.#clock.toggle()}>\${this.#clock.running() ? 'pause' : 'resume'}</button>\r
				<small>focus here and press Space</small>\r
			</div>\r
		\`;\r
	}\r
}\r
\r
@tag('demo-feat-clock-section')\r
export class DemoFeatClockSection extends UIElement {\r
	protected override template() {\r
		return t\`\r
			<section id="clock">\r
				<h2>Feature objects</h2>\r
				<p class="desc">\r
					<code>ClockFeat</code> owns its signals, timer and cleanup; <code>HotkeyFeat</code> comes from ext.\r
					Both are created in field initializers, so the element class only wires them together.\r
					Remove the element and the interval and key listener are gone.\r
				</p>\r
				<demo-feat-clock></demo-feat-clock>\r
			</section>\r
		\`;\r
	}\r
}\r
`,_e=`// Class-level attachment: \`@hotkeys()\` (built on \`UIFeat.attachTo\`) gives every instance its own feature.
import { css, state, t, tag, UIElement } from '@std-ui/core';
import { hotkeys } from '@std-ui/ext';

@tag('demo-feat-counter')
@hotkeys({
	ArrowUp: (e) => (e.currentTarget as DemoFeatCounter).count.update((n) => n + 1),
	ArrowDown: (e) => (e.currentTarget as DemoFeatCounter).count.update((n) => n - 1),
})
export class DemoFeatCounter extends UIElement {
	static override styles = css\`div:focus { outline: 2px solid currentColor; outline-offset: 2px; }\`;\r
	readonly count = state(0);

	protected override template() {
		return t\`<div tabindex="0">count: <b>\${this.count()}</b> <small>focus, then ArrowUp / ArrowDown</small></div>\`;
	}
}

@tag('demo-feat-decorator-section')
export class DemoFeatDecoratorSection extends UIElement {
	protected override template() {
		return t\`
			<section id="decorator">
				<h2>Decorator attachment</h2>
				<p class="desc">
					<code>@hotkeys()</code> calls <code>UIFeat.attachTo()</code>: each instance below gets its own feature,
					created on its first connect. The class body has no key-handling code.
				</p>
				<demo-feat-counter></demo-feat-counter>
				<demo-feat-counter></demo-feat-counter>
			</section>
		\`;
	}
}
`,ve=Object.create,q=Object.defineProperty,ye=Object.getOwnPropertyDescriptor,be=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),J=e=>{throw TypeError(e)},xe=(e,t,n)=>t in e?q(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Se=(e,t)=>q(e,`name`,{value:t,configurable:!0}),Ce=e=>[,,,ve(e?.[be(`metadata`)]??null)],we=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],Y=e=>e!==void 0&&typeof e!=`function`?J(`Function expected`):e,Te=(e,t,n,r,i)=>({kind:we[e],name:t,metadata:r,addInitializer:e=>n._?J(`Already initialized`):i.push(Y(e||null))}),Ee=(e,t)=>xe(t,be(`metadata`),e[3]),De=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},Oe=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=we[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&ye(d<4?i:{get[n](){return Z(this,a)},set[n](e){return Ae(this,a,e)}},n));d?p&&d<4&&Se(a,(d>2?`set `:d>1?`get `:``)+n):Se(i,n);for(var y=r.length-1;y>=0;y--)l=Te(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>ke(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Z:je)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Ae(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?Y(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?J(`Object expected`):(Y(o=s.get)&&(v.get=o),Y(o=s.set)&&(v.set=o),Y(o=s.init)&&g.unshift(o));return d||Ee(e,i),v&&q(i,n,v),p?d^4?a:v:i},X=(e,t,n)=>t.has(e)||J(`Cannot `+n),ke=(e,t)=>Object(t)===t?e.has(t):J(`Cannot use the "in" operator on this value`),Z=(e,t,n)=>(X(e,t,`read from private field`),n?n.call(e):t.get(e)),Ae=(e,t,n,r)=>(X(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),je=(e,t,n)=>(X(e,t,`access private method`),n),Me,Q,Ne,Pe={"clock-section.ts":ge},Fe={"decorator-section.ts":_e};Me=[a(`demo-feat-page`)];var $=class extends (Ne=r){template(){return e`
			<code-preview .files=${Pe}><demo-feat-clock-section></demo-feat-clock-section></code-preview>
			<code-preview .files=${Fe}><demo-feat-decorator-section></demo-feat-decorator-section></code-preview>
		`}};Q=Ce(Ne),$=Oe(Q,0,`DemoFeatPage`,Me,$),De(Q,1,$);