import{U as e,b as t,h as n,j as r,m as i,y as a}from"./index-DsT9IMgw.js";import{t as o}from"./key-DzqtW87o.js";import{f as s,p as c}from"./src-vkAovAHS.js";import"./code-preview-BoRCt_Z-.js";var l=Object.create,u=Object.defineProperty,d=Object.getOwnPropertyDescriptor,f=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),p=e=>{throw TypeError(e)},m=(e,t,n)=>t in e?u(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,h=(e,t)=>u(e,`name`,{value:t,configurable:!0}),g=e=>[,,,l(e?.[f(`metadata`)]??null)],_=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],v=e=>e!==void 0&&typeof e!=`function`?p(`Function expected`):e,y=(e,t,n,r,i)=>({kind:_[e],name:t,metadata:r,addInitializer:e=>n._?p(`Already initialized`):i.push(v(e||null))}),ee=(e,t)=>m(t,f(`metadata`),e[3]),b=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},x=(e,t,n,r,i,a)=>{var o,s,c,l,f,m=t&7,g=!!(t&8),b=!!(t&16),x=m>3?e.length+1:m?g?1:2:0,S=_[m+5],C=m>3&&(e[x-1]=[]),E=e[x]||(e[x]=[]),D=m&&(!b&&!g&&(i=i.prototype),m<5&&(m>3||!b)&&d(m<4?i:{get[n](){return w(this,a)},set[n](e){return T(this,a,e)}},n));m?b&&m<4&&h(a,(m>2?`set `:m>1?`get `:``)+n):h(i,n);for(var O=r.length-1;O>=0;O--)l=y(m,n,c={},e[3],E),m&&(l.static=g,l.private=b,f=l.access={has:b?e=>te(i,e):e=>n in e},m^3&&(f.get=b?e=>(m^1?w:ne)(e,i,m^4?a:D.get):e=>e[n]),m>2&&(f.set=b?(e,t)=>T(e,i,t,m^4?a:D.set):(e,t)=>e[n]=t)),s=(0,r[O])(m?m<4?b?a:D[S]:m>4?void 0:{get:D.get,set:D.set}:i,l),c._=1,m^4||s===void 0?v(s)&&(m>4?C.unshift(s):m?b?a=s:D[S]=s:i=s):typeof s!=`object`||!s?p(`Object expected`):(v(o=s.get)&&(D.get=o),v(o=s.set)&&(D.set=o),v(o=s.init)&&C.unshift(o));return m||ee(e,i),D&&u(i,n,D),b?m^4?a:D:i},S=(e,t,n)=>m(e,typeof t==`symbol`?t:t+``,n),C=(e,t,n)=>t.has(e)||p(`Cannot `+n),te=(e,t)=>Object(t)===t?e.has(t):p(`Cannot use the "in" operator on this value`),w=(e,t,n)=>(C(e,t,`read from private field`),n?n.call(e):t.get(e)),T=(e,t,n,r)=>(C(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),ne=(e,t,n)=>(C(e,t,`access private method`),n),E,D,O,k,A,j,M,N,P,F,I,re,L=o(`home-theme`);O=[a(`demo-home-root`)];var R=class extends (D=i,E=[c(L)],D){constructor(){super(...arguments),S(this,`theme`,b(k,8,this,t({mode:`dark`}))),b(k,11,this)}template(){return e`<slot></slot>`}};k=g(D),x(k,5,`theme`,E,R),R=x(k,0,`DemoHomeRoot`,O,R),S(R,`shadowRootOptions`,{mode:`open`}),b(k,1,R),N=[a(`demo-home-counter`)];var z=class extends (M=i,j=[n({type:Number,reflect:!0})],A=[s(L)],M){constructor(){super(...arguments),S(this,`count`,b(P,8,this,t(0))),b(P,11,this),S(this,`theme`,b(P,12,this)),b(P,15,this)}template(){return e`<button class=${this.theme.mode} @click=${()=>this.count.set(this.count()+1)}>Clicked ${this.count()} times</button>`}};P=g(M),x(P,5,`count`,j,z),x(P,5,`theme`,A,z),z=x(P,0,`DemoHomeCounter`,N,z),S(z,`styles`,r`
		button { padding: .5rem 1rem; border-radius: 999px; border: 0; cursor: pointer; background: #e8def8; color: #1d192b; }
		button.dark { background: #222; color: #fff; }
	`),b(P,1,z),F=[a(`demo-home-key-section`)];var B=class extends (re=i){template(){return e`
			<section id="key-feature" style="scroll-margin-top: 4rem">
				<h2>A taste</h2>
				<p class="desc">Real custom elements: <code>@attribute</code> mirrors a signal to an HTML attribute, <code>@provide</code> / <code>@consume</code> pass state down the tree, and the button re-renders in place when the count changes.</p>
				<demo-home-root><demo-home-counter count="3"></demo-home-counter></demo-home-root>
			</section>
		`}};I=g(re),B=x(I,0,`DemoHomeKeySection`,F,B),b(I,1,B);var ie=`// "A taste" (from the README): signals, an HTML attribute mirrored to state, and context passed down the tree.
import { attribute, css, state, t, tag, UIElement } from '@std-ui/core';
import { consume, createContextKey, provide } from '@std-ui/ext';

interface Theme { mode: 'light' | 'dark'; }
const ThemeKey = createContextKey<Theme>('home-theme');

@tag('demo-home-root')
export class DemoHomeRoot extends UIElement {
	@provide(ThemeKey) readonly theme = state<Theme>({ mode: 'dark' }); // shared with every descendant
	static override shadowRootOptions = { mode: 'open' } as const; // so <slot> projects children
	protected override template() { return t\`<slot></slot>\`; }
}

@tag('demo-home-counter')
export class DemoHomeCounter extends UIElement {
	static override styles = css\`
		button { padding: .5rem 1rem; border-radius: 999px; border: 0; cursor: pointer; background: #e8def8; color: #1d192b; }
		button.dark { background: #222; color: #fff; }
	\`;
	@attribute({ type: Number, reflect: true }) readonly count = state(0); // <demo-home-counter count="3">
	@consume(ThemeKey) readonly theme!: Theme; // nearest ancestor's value

	protected override template() {
		return t\`<button class=\${this.theme.mode} @click=\${() => this.count.set(this.count() + 1)}>Clicked \${this.count()} times</button>\`;
	}
}

@tag('demo-home-key-section')
export class DemoHomeKeySection extends UIElement {
	protected override template() {
		return t\`
			<section id="key-feature" style="scroll-margin-top: 4rem">
				<h2>A taste</h2>
				<p class="desc">Real custom elements: <code>@attribute</code> mirrors a signal to an HTML attribute, <code>@provide</code> / <code>@consume</code> pass state down the tree, and the button re-renders in place when the count changes.</p>
				<demo-home-root><demo-home-counter count="3"></demo-home-counter></demo-home-root>
			</section>
		\`;
	}
}\r
`,ae=Object.create,V=Object.defineProperty,oe=Object.getOwnPropertyDescriptor,H=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),U=e=>{throw TypeError(e)},se=(e,t,n)=>t in e?V(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,W=(e,t)=>V(e,`name`,{value:t,configurable:!0}),ce=e=>[,,,ae(e?.[H(`metadata`)]??null)],G=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],K=e=>e!==void 0&&typeof e!=`function`?U(`Function expected`):e,le=(e,t,n,r,i)=>({kind:G[e],name:t,metadata:r,addInitializer:e=>n._?U(`Already initialized`):i.push(K(e||null))}),ue=(e,t)=>se(t,H(`metadata`),e[3]),de=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},fe=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=G[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&oe(d<4?i:{get[n](){return J(this,a)},set[n](e){return Y(this,a,e)}},n));d?p&&d<4&&W(a,(d>2?`set `:d>1?`get `:``)+n):W(i,n);for(var y=r.length-1;y>=0;y--)l=le(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>pe(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?J:me)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Y(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?K(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?U(`Object expected`):(K(o=s.get)&&(v.get=o),K(o=s.set)&&(v.set=o),K(o=s.init)&&g.unshift(o));return d||ue(e,i),v&&V(i,n,v),p?d^4?a:v:i},q=(e,t,n)=>t.has(e)||U(`Cannot `+n),pe=(e,t)=>Object(t)===t?e.has(t):U(`Cannot use the "in" operator on this value`),J=(e,t,n)=>(q(e,t,`read from private field`),n?n.call(e):t.get(e)),Y=(e,t,n,r)=>(q(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),me=(e,t,n)=>(q(e,t,`access private method`),n),X,Z,Q,he={"key-feature-section.ts":ie},ge=[[14,` kB`,`core, gzip`],[10,` kB`,`add-ons, gzip`],[0,``,`virtual DOM`],[0,``,`build steps required`]],_e=[[`Real Web Components`,`Extend <code>UIElement</code> and it works anywhere HTML works.`],[`Fine-grained reactivity`,`<code>signal</code>, <code>computed</code> and <code>effect</code> update exactly the DOM that changed. No diffing, no change-detection loop.`],[`No compiler, no runtime`,`Load one <code>&lt;script&gt;</code> and build. Decorators are optional; <code>defineElement</code> needs no compiler.`],[`Reactive state trees`,`Wrap objects and arrays in <code>state(...)</code> for deeply reactive, typed stores.`],[`Type-safe by design`,`Fields are the store itself, so there are no decorator type lies and IntelliSense just works.`],[`Fully extensible`,`Hooks, registries and tree extensions. <code>@std-ui/ext</code> (context, forms, change tracking) is built only on them.`]];X=[a(`demo-home-page`)];var $=class extends (Q=i){static styles=r`
		.home-hero h2 {
			font-size: clamp(2.2rem, 6vw, 4rem); line-height: 1.05; letter-spacing: -0.03em; font-weight: 700; margin: 0.5rem 0 1rem;
			background: linear-gradient(120deg, var(--std-sys-color-on-surface) 20%, var(--std-sys-color-primary) 50%, var(--std-sys-color-tertiary) 80%);
			background-size: 200% auto; -webkit-background-clip: text; background-clip: text; color: transparent;
			animation: home-shine 8s linear infinite;
		}
		.home-hero .tagline { font-size: clamp(1.1rem, 2.4vw, 1.6rem); font-weight: 500; }
		.home-stat b { display: block; font-size: clamp(2rem, 4vw, 3rem); font-weight: 700; letter-spacing: -0.02em; color: var(--std-sys-color-primary); }
		.home-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1.25rem; perspective: 1000px; }
		.home-card {
			position: relative; overflow: hidden; padding: 1.5rem 1.5rem 1.75rem; border-radius: 24px;
			border: 1px solid var(--std-sys-color-outline-variant); background: var(--std-sys-color-surface-container-low);
			transform-style: preserve-3d;
		}
		.home-card h3 { margin: 0 0 0.5rem; font-size: 1.2rem; letter-spacing: -0.01em; }
		.home-card p { margin: 0; }
		/* Spotlight that follows the pointer. */
		.home-card::before {
			content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 0.4s;
			background: radial-gradient(22rem circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--std-sys-color-primary) 22%, transparent), transparent 60%);
		}
		.reveal.home-card.in {
			transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale(var(--s, 1));
			transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s, opacity 0.5s, filter 0.5s;
		}
		.home-card.tracking { transition-duration: 0.12s, 0.5s, 0.5s, 0.5s; }
		.home-card:hover { --s: 1.08; box-shadow: 0 24px 48px -12px rgb(0 0 0 / 0.35); z-index: 1; }
		.home-card:hover::before { opacity: 1; }
		/* The card under the pointer is the centre of attention; its neighbours step back. */
		.home-cards:has(.home-card:hover) .home-card:not(:hover) { --s: 0.95; opacity: 0.55; filter: blur(0.5px); }
		
		.reveal { opacity: 0; transform: translateY(2.5rem) scale(0.97); filter: blur(6px); transition: opacity 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) var(--d, 0s), transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) var(--d, 0s), filter 0.9s var(--d, 0s); }
		.reveal.in { opacity: 1; transform: none; filter: none; }
		
		@keyframes home-shine { to { background-position: -200% center; } }
		@media (prefers-reduced-motion: reduce) {
			.reveal { opacity: 1; transform: none; filter: none; transition: none; }
			.home-hero h2 { animation: none; }
		}
	`;firstUpdated(){let e=this.querySelectorAll(`.reveal`),t=new IntersectionObserver(e=>{for(let n of e)n.isIntersecting&&(n.target.classList.add(`in`),t.unobserve(n.target))},{threshold:.15});e.forEach(e=>t.observe(e)),matchMedia(`(prefers-reduced-motion: reduce)`).matches||this.querySelectorAll(`.home-card`).forEach(e=>{e.addEventListener(`pointermove`,t=>{let n=e.getBoundingClientRect(),r=(t.clientX-n.left)/n.width,i=(t.clientY-n.top)/n.height;e.classList.add(`tracking`),e.style.setProperty(`--ry`,`${(r-.5)*16}deg`),e.style.setProperty(`--rx`,`${(.5-i)*16}deg`),e.style.setProperty(`--mx`,`${r*100}%`),e.style.setProperty(`--my`,`${i*100}%`)}),e.addEventListener(`pointerleave`,()=>{e.classList.remove(`tracking`),e.style.removeProperty(`--rx`),e.style.removeProperty(`--ry`)})}),this.querySelectorAll(`[data-count]`).forEach(e=>{let t=Number(e.dataset.count),n=e.dataset.suffix??``;matchMedia(`(prefers-reduced-motion: reduce)`).matches||new IntersectionObserver(([r],i)=>{if(!r.isIntersecting)return;i.disconnect();let a=performance.now(),o=r=>{let i=Math.min(1,(r-a)/1400);e.textContent=Math.round(t*(1-(1-i)**3))+n,i<1&&requestAnimationFrame(o)};requestAnimationFrame(o)}).observe(e)})}template(){return e`
			<div style="min-height: 130vh">
			<section id="purpose" style="scroll-margin-top: 4rem" class="home-hero">
				<h2 class="reveal">Build UI with the platform. Not around it.</h2>
				<p class="desc tagline reveal" style="--d:.15s"><strong>Signals. Tagged templates. Custom Elements.</strong> No virtual DOM. No framework runtime. No lock-in.</p>
				<p class="desc reveal" style="--d:.3s">std-ui is a tiny, standards-first UI toolkit: your components are real Web Components, your reactivity is fine-grained signals, and your templates are plain tagged template literals.</p>
				<div style="display:flex;flex-wrap:wrap;gap:2rem;margin:2rem 0">
					${ge.map(([t,n,r],i)=>e`<div class="home-stat reveal" style="--d:${.4+i*.1}s;min-width:8rem;text-align:center"><b data-count="${t}" data-suffix="${n}">${t}${n}</b><small>${r}</small></div>`)}
				</div>
				<div class="demo-actions reveal" style="--d:.8s">
					<a href="#key-feature"><button type="button">Get a taste</button></a>
					<a href="/tour"><button type="button" class="tonal">Take the tour</button></a>
				</div>
			</section>
			<section id="goals" style="scroll-margin-top: 4rem">
				<h2 class="reveal">Why std-ui?</h2>
				<div class="home-cards">
					${_e.map(([t,n],r)=>e`<div class="home-card reveal" style="--d:${r*.08}s"><h3>${t}</h3><p class="desc" .innerHTML=${n}></p></div>`)}
				</div>
			</section>
			<div class="reveal"><code-preview .files=${he}><demo-home-key-section></demo-home-key-section></code-preview></div>
			</div>
		`}};Z=ce(Q),$=fe(Z,0,`DemoHomePage`,X,$),de(Z,1,$);