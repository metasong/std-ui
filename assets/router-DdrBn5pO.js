import{U as e,a as t,b as n,i as r,j as i,m as a,n as o,r as s,t as c,y as l}from"./index-DsT9IMgw.js";import"./code-preview-BoRCt_Z-.js";function u(e=`/`,t=`http://router.local`){let n=new EventTarget,r=0,i=(e,t)=>({key:String(r++),url:e,getState:()=>t}),a=[i(new URL(e,t).href,void 0)],o=0,s=null,c=()=>new DOMException(`Navigation aborted`,`AbortError`);function l(e,t,r,i,l){let u=new URL(t,a[o].url).href;s?.abort();let d=new AbortController;s=d;let f,p,m=Object.assign(new Event(`navigate`,{cancelable:!0}),{canIntercept:!0,hashChange:!1,downloadRequest:null,formData:null,navigationType:e,info:l,destination:{url:u,getState:()=>r},signal:d.signal,intercept(e){f=e?.handler,p=e?.precommitHandler}});n.dispatchEvent(m);let h;if(p){let e=u,t=r,n=!1,a={redirect(r,i){e=new URL(r,u).href,`state`in(i??{})&&(t=i.state),n=i?.history===`replace`}};h=Promise.resolve().then(()=>p(a)).then(()=>{if(d.signal.aborted)throw c();i(e,t,n)})}else i(u,r,!1),h=Promise.resolve();let g=h.then(()=>f?.()).then(()=>{if(d.signal.aborted)throw c()});return h.catch(()=>{}),g.catch(()=>{}),{committed:h,finished:g}}let u=e=>{let t=a[e];if(!t)throw new DOMException(`No such entry`,`InvalidStateError`);return l(`traverse`,t.url,t.getState(),()=>{o=e})},d=Object.assign(n,{navigate(e,t={}){let n=t.history===`replace`;return l(n?`replace`:`push`,e,t.state,(e,t,r)=>{let s=i(e,t);n||r?a[o]=s:(a.splice(o+1),a.push(s),o++)},t.info)},back:()=>u(o-1),forward:()=>u(o+1),traverseTo(e){let t=a.findIndex(t=>t.key===e);return u(t)}});return Object.defineProperty(d,"currentEntry",{get:()=>a[o]??null}),d}var d=(e,t,n)=>{let r=document.createElement(`template`);return r.innerHTML=`<div class="rt-page"><h2>${t}</h2><p>${n}</p></div>`,{path:e,title:t,template:r}},f=()=>[d(`/`,`Home`,`Welcome. This is the first page.`),d(`/products`,`Products`,`A list of products would go here.`),d(`/contact`,`Contact`,`A contact form would go here.`)],p=Object.create,m=Object.defineProperty,h=Object.getOwnPropertyDescriptor,g=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),_=e=>{throw TypeError(e)},v=(e,t,n)=>t in e?m(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,y=(e,t)=>m(e,`name`,{value:t,configurable:!0}),b=e=>[,,,p(e?.[g(`metadata`)]??null)],ee=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],x=e=>e!==void 0&&typeof e!=`function`?_(`Function expected`):e,te=(e,t,n,r,i)=>({kind:ee[e],name:t,metadata:r,addInitializer:e=>n._?_(`Already initialized`):i.push(x(e||null))}),ne=(e,t)=>v(t,g(`metadata`),e[3]),re=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},S=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),g=d>3?e.length+1:d?f?1:2:0,v=ee[d+5],b=d>3&&(e[g-1]=[]),re=e[g]||(e[g]=[]),S=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&h(d<4?i:{get[n](){return ae(this,a)},set[n](e){return oe(this,a,e)}},n));d?p&&d<4&&y(a,(d>2?`set `:d>1?`get `:``)+n):y(i,n);for(var C=r.length-1;C>=0;C--)l=te(d,n,c={},e[3],re),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>ie(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?ae:se)(e,i,d^4?a:S.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>oe(e,i,t,d^4?a:S.set):(e,t)=>e[n]=t)),s=(0,r[C])(d?d<4?p?a:S[v]:d>4?void 0:{get:S.get,set:S.set}:i,l),c._=1,d^4||s===void 0?x(s)&&(d>4?b.unshift(s):d?p?a=s:S[v]=s:i=s):typeof s!=`object`||!s?_(`Object expected`):(x(o=s.get)&&(S.get=o),x(o=s.set)&&(S.set=o),x(o=s.init)&&b.unshift(o));return d||ne(e,i),S&&m(i,n,S),p?d^4?a:S:i},C=(e,t,n)=>t.has(e)||_(`Cannot `+n),ie=(e,t)=>Object(t)===t?e.has(t):_(`Cannot use the "in" operator on this value`),ae=(e,t,n)=>(C(e,t,`read from private field`),n?n.call(e):t.get(e)),oe=(e,t,n,r)=>(C(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),se=(e,t,n)=>(C(e,t,`access private method`),n),ce=[l(`demo-router-announcer-section`)],le,ue,de=class extends (ue=a){heard=n(`(navigate to hear something)`);router=s({routes:f(),navigation:u(`/`),announce:({matches:e})=>{let t=`Navigated to ${e.at(-1)?.route.title??`unknown page`}`;return this.heard.set(t),t}});template(){let{router:t}=this;return e`
			<section class="demo-router-block" id="announcer">
				<h2>Live-region announcer</h2>
				<p class="desc">
					Client-side navigations load no page, so screen readers say nothing. With <code>announce</code> the router
					writes a message into a hidden <code>aria-live="polite"</code> region after each navigation (not the
					initial load). Default text: route <code>title</code>, else first <code>&lt;h1&gt;</code>, else the path.
				</p>
				<std-router .router=${t}>
					<p>
						<button @click=${()=>t.navigate(`/`)}>Home</button>
						<button @click=${()=>t.navigate(`/products`)}>Products</button>
						<button @click=${()=>t.navigate(`/contact`)}>Contact</button>
					</p>
					<std-outlet></std-outlet>
				</std-router>
				<p><strong>Screen reader hears:</strong> <output>${this.heard()}</output></p>
			</section>
		`}};le=b(ue),de=S(le,0,`DemoRouterAnnouncerSection`,ce,de),re(le,1,de);var fe=i`
	::view-transition-group(demo-rt) { animation-duration: 500ms; }
	::view-transition-old(demo-rt), ::view-transition-new(demo-rt) { animation-duration: 500ms; animation-fill-mode: both; mix-blend-mode: normal; }

	/* slide */
	:root[data-rt-effect='slide']::view-transition-old(demo-rt) { animation-name: rt-slide-out; }
	:root[data-rt-effect='slide']::view-transition-new(demo-rt) { animation-name: rt-slide-in; }
	@keyframes rt-slide-out { to { opacity: 0; transform: translateX(-120px); } }
	@keyframes rt-slide-in { from { opacity: 0; transform: translateX(120px); } }

	/* zoom */
	:root[data-rt-effect='zoom']::view-transition-old(demo-rt) { animation-name: rt-zoom-out; }
	:root[data-rt-effect='zoom']::view-transition-new(demo-rt) { animation-name: rt-zoom-in; }
	@keyframes rt-zoom-out { to { opacity: 0; transform: scale(1.4); } }
	@keyframes rt-zoom-in { from { opacity: 0; transform: scale(0.6); } }

	/* flip */
	:root[data-rt-effect='flip']::view-transition-old(demo-rt) { animation-name: rt-flip-out; }
	:root[data-rt-effect='flip']::view-transition-new(demo-rt) { animation-name: rt-flip-in; }
	@keyframes rt-flip-out { to { opacity: 0; transform: perspective(600px) rotateY(-90deg); } }
	@keyframes rt-flip-in { from { opacity: 0; transform: perspective(600px) rotateY(90deg); } }

	/* blur */
	:root[data-rt-effect='blur']::view-transition-old(demo-rt) { animation-name: rt-blur-out; }
	:root[data-rt-effect='blur']::view-transition-new(demo-rt) { animation-name: rt-blur-in; }
	@keyframes rt-blur-out { to { opacity: 0; filter: blur(16px); } }
	@keyframes rt-blur-in { from { opacity: 0; filter: blur(16px); } }

	/* wipe: new page revealed left to right */
	:root[data-rt-effect='wipe']::view-transition-old(demo-rt) { animation: none; }
	:root[data-rt-effect='wipe']::view-transition-new(demo-rt) { animation-name: rt-wipe; }
	@keyframes rt-wipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }

	/* spin */
	:root[data-rt-effect='spin']::view-transition-old(demo-rt) { animation-name: rt-spin-out; }
	:root[data-rt-effect='spin']::view-transition-new(demo-rt) { animation-name: rt-spin-in; }
	@keyframes rt-spin-out { to { opacity: 0; transform: rotate(-20deg) scale(0.5); } }
	@keyframes rt-spin-in { from { opacity: 0; transform: rotate(20deg) scale(0.5); } }
`,pe=Object.create,w=Object.defineProperty,me=Object.getOwnPropertyDescriptor,he=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),T=e=>{throw TypeError(e)},ge=(e,t,n)=>t in e?w(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,_e=(e,t)=>w(e,`name`,{value:t,configurable:!0}),ve=e=>[,,,pe(e?.[he(`metadata`)]??null)],ye=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],E=e=>e!==void 0&&typeof e!=`function`?T(`Function expected`):e,be=(e,t,n,r,i)=>({kind:ye[e],name:t,metadata:r,addInitializer:e=>n._?T(`Already initialized`):i.push(E(e||null))}),xe=(e,t)=>ge(t,he(`metadata`),e[3]),Se=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},Ce=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=ye[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&me(d<4?i:{get[n](){return Te(this,a)},set[n](e){return Ee(this,a,e)}},n));d?p&&d<4&&_e(a,(d>2?`set `:d>1?`get `:``)+n):_e(i,n);for(var y=r.length-1;y>=0;y--)l=be(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>we(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Te:De)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Ee(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?E(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?T(`Object expected`):(E(o=s.get)&&(v.get=o),E(o=s.set)&&(v.set=o),E(o=s.init)&&g.unshift(o));return d||xe(e,i),v&&w(i,n,v),p?d^4?a:v:i},D=(e,t,n)=>t.has(e)||T(`Cannot `+n),we=(e,t)=>Object(t)===t?e.has(t):T(`Cannot use the "in" operator on this value`),Te=(e,t,n)=>(D(e,t,`read from private field`),n?n.call(e):t.get(e)),Ee=(e,t,n,r)=>(D(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),De=(e,t,n)=>(D(e,t,`access private method`),n),Oe,O,ke,Ae=[`slide`,`zoom`,`flip`,`blur`,`wipe`,`spin`],je=i`
	.demo-rt-outlet { display: block; min-height: 8rem; }
`;Oe=[l(`demo-router-view-transition-section`)];var k=class extends (ke=a){static styles=je;chosen=n(`(none yet)`);router=s({routes:f(),navigation:u(`/`),viewTransition:!0,announce:!1});connect(){let e=fe.styleSheet;document.adoptedStyleSheets.includes(e)||(document.adoptedStyleSheets=[...document.adoptedStyleSheets,e])}disconnect(){document.adoptedStyleSheets=document.adoptedStyleSheets.filter(e=>e!==fe.styleSheet),delete document.documentElement.dataset.rtEffect}go(e){let t=Ae.filter(e=>e!==document.documentElement.dataset.rtEffect),n=t[Math.floor(Math.random()*t.length)];document.documentElement.dataset.rtEffect=n,this.chosen.set(n),this.router.navigate(e)}template(){let{router:t}=this;return e`
			<section class="demo-router-block" id="view-transition">
				<h2>View transitions</h2>
				<p class="desc">
					With <code>viewTransition: true</code> (or the <code>view-transition</code> attribute) the commit runs inside
					<code>document.startViewTransition</code>, so the outlet content animates between pages. Style it with
					<code>::view-transition-old/new(name)</code>; here <code>&lt;std-outlet view-transition-name="demo-rt"&gt;</code> gives the outlet that name only while this router's transition runs (the name is document-wide, so it is not left on permanently).
					Each click picks a random effect by setting <code>data-rt-effect</code> on <code>&lt;html&gt;</code> before navigating.
					Unsupported browsers and <code>prefers-reduced-motion</code> get a plain swap.
				</p>
				<std-router .router=${t}>
					<p>
						<button @click=${()=>this.go(`/`)}>Home</button>
						<button @click=${()=>this.go(`/products`)}>Products</button>
						<button @click=${()=>this.go(`/contact`)}>Contact</button>
						<small>effect: <output>${this.chosen()}</output></small>
					</p>
					<std-outlet class="demo-rt-outlet" view-transition-name="demo-rt"></std-outlet>
				</std-router>
			</section>
		`}};O=ve(ke),k=Ce(O,0,`DemoRouterViewTransitionSection`,Oe,k),Se(O,1,k);var Me=Object.create,A=Object.defineProperty,Ne=Object.getOwnPropertyDescriptor,Pe=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),j=e=>{throw TypeError(e)},Fe=(e,t,n)=>t in e?A(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Ie=(e,t)=>A(e,`name`,{value:t,configurable:!0}),M=e=>[,,,Me(e?.[Pe(`metadata`)]??null)],Le=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],N=e=>e!==void 0&&typeof e!=`function`?j(`Function expected`):e,Re=(e,t,n,r,i)=>({kind:Le[e],name:t,metadata:r,addInitializer:e=>n._?j(`Already initialized`):i.push(N(e||null))}),ze=(e,t)=>Fe(t,Pe(`metadata`),e[3]),P=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},F=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=Le[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&Ne(d<4?i:{get[n](){return Ve(this,a)},set[n](e){return He(this,a,e)}},n));d?p&&d<4&&Ie(a,(d>2?`set `:d>1?`get `:``)+n):Ie(i,n);for(var y=r.length-1;y>=0;y--)l=Re(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>Be(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Ve:Ue)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>He(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?N(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?j(`Object expected`):(N(o=s.get)&&(v.get=o),N(o=s.set)&&(v.set=o),N(o=s.init)&&g.unshift(o));return d||ze(e,i),v&&A(i,n,v),p?d^4?a:v:i},I=(e,t,n)=>Fe(e,typeof t==`symbol`?t:t+``,n),L=(e,t,n)=>t.has(e)||j(`Cannot `+n),Be=(e,t)=>Object(t)===t?e.has(t):j(`Cannot use the "in" operator on this value`),Ve=(e,t,n)=>(L(e,t,`read from private field`),n?n.call(e):t.get(e)),He=(e,t,n,r)=>(L(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Ue=(e,t,n)=>(L(e,t,`access private method`),n),We,R,Ge,Ke,z,qe,Je,B,Ye,Xe,V,Ze,Qe,H,$e,et,tt,U,nt,W,rt,G,it,at,K,ot,st,q,ct,lt=e=>e.closest(`std-router`).router,J=e=>localStorage.getItem(e)===`1`,ut=i`
	.rt-links { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-block: 1rem; }
	.rt-links a { padding: 0.35rem 0.75rem; border-radius: 999px; text-decoration: none; color: var(--std-sys-color-primary, #6750a4); border: 1px solid var(--std-sys-color-outline-variant, #cac4d0); }
	.rt-links a[aria-current='page'] { background: var(--std-sys-color-secondary-container, #e8def8); }
	.rt-panel { border: 1px solid var(--std-sys-color-outline-variant, #cac4d0); border-radius: 12px; padding: 1rem; margin-block: 1rem; }
	.rt-status { font: 400 0.8rem/1.4 'Roboto Mono', monospace; color: var(--std-sys-color-on-surface-variant, #49454f); }
`,dt=i`
	::view-transition-old(rt-page) { animation: rt-out 150ms ease-in both; }
	::view-transition-new(rt-page) { animation: rt-in 200ms ease-out both; }
	@keyframes rt-out { to { opacity: 0; transform: translateY(-8px); } }
	@keyframes rt-in { from { opacity: 0; transform: translateY(8px); } }
`,ft=e=>{let t=document.createElement(`template`);return t.innerHTML=e,t},pt=async({params:e})=>(await new Promise(e=>setTimeout(e,300)),{id:e.id,name:`User #${e.id}`}),mt=()=>J(`rt-signed-in`)?!0:`/users`,ht=()=>{if(J(`rt-fail`))throw Error(`Admin loader failed on purpose`)},gt=()=>[{path:`/`,title:`Home - router demo`,template:ft(`<div class="rt-panel"><h2>Home</h2><p>Plain inline template route.</p></div>`)},{path:`/users`,element:`demo-rt-layout`,title:`Users - router demo`,children:[{index:!0,element:`demo-rt-users`},{path:`:id`,element:`demo-rt-user`,load:pt}]},{path:`/editor`,element:`demo-rt-editor`,title:`Editor - router demo`},{path:`/admin`,element:`demo-rt-admin`,errorElement:`demo-rt-error`,guard:mt,load:ht},{path:`/old-users`,redirect:`/users`},{path:`*`,template:ft(`<div class="rt-panel"><h2>404</h2><p>No route matches.</p></div>`)}];We=[l(`demo-router-full-section`)];var _t=class extends (Ge=a){static styles=ut;#e;router=s({routes:gt(),navigation:u(`/`),viewTransition:!0});outlet=r();onLinkClick=e=>{let t=e.target.closest(`a`);t&&(e.preventDefault(),e.stopPropagation(),this.router.navigate(t.getAttribute(`href`)))};connect(){let e=dt.styleSheet;document.adoptedStyleSheets.includes(e)||(document.adoptedStyleSheets=[...document.adoptedStyleSheets,e]),this.#e=new MutationObserver(()=>{let e=this.querySelector(`#rt-announced`),t=document.querySelector(`[data-std-announcer]`)?.textContent;e&&t&&e.textContent!==t&&(e.textContent=t)}),this.#e.observe(document.body,{childList:!0,subtree:!0,characterData:!0})}disconnect(){this.#e?.disconnect(),document.adoptedStyleSheets=document.adoptedStyleSheets.filter(e=>e!==dt.styleSheet)}template(){return e`
			<section class="demo-router-block" id="full-router">
				<h2>Full router</h2>
				<p class="desc">
					Navigation API router: nested routes, a lazy-style loader, a guard,
					redirects, and a <code>beforeLeave</code> / tab-close guard. Runs on an in-memory history, so the address bar stays on this app's own route.
				</p>
				<std-router .router=${this.router} @click=${this.onLinkClick}>
					<nav class="rt-links">
						<a href="/">Home</a>
						<a href="/users">Users</a>
						<a href="/users/3">User 3</a>
						<a href="/editor">Editor (unsaved guard)</a>
						<a href="/admin">Admin (guarded)</a>
						<a href="/old-users">Old URL (redirect)</a>
						<a href="/nowhere">Nowhere (404)</a>
					</nav>

					<demo-rt-controls></demo-rt-controls>
					<demo-rt-status></demo-rt-status>
					<p class="rt-status">announced to screen readers: <output id="rt-announced">(navigate to see)</output></p>

					<std-outlet ${t(this.outlet)} view-transition-name="rt-page"></std-outlet>
				</std-router>
			</section>
		`}};R=M(Ge),_t=F(R,0,`DemoRouterFullSection`,We,_t),P(R,1,_t),Ke=[l(`demo-rt-controls`)];var vt=class extends (qe=a){signedIn=n(J(`rt-signed-in`));fail=n(J(`rt-fail`));toggle(e,t){t.set(!t.peek()),localStorage.setItem(e,t.peek()?`1`:`0`)}template(){return e`<p>
			<label><input type="checkbox" .checked=${this.signedIn()} @change=${()=>this.toggle(`rt-signed-in`,this.signedIn)} /> signed in (admin guard)</label>
			<label><input type="checkbox" .checked=${this.fail()} @change=${()=>this.toggle(`rt-fail`,this.fail)} /> admin loader throws</label>
		</p>`}};z=M(qe),vt=F(z,0,`Controls`,Ke,vt),P(z,1,vt),Je=[l(`demo-rt-status`)];var yt=class extends (Ye=a){template(){let t=lt(this);return e`<p class="rt-status">
			path=${t.location().pathname} · status=${t.status()} · matches=${t.matches().length}
			· params=${JSON.stringify(t.params())}
		</p>`}};B=M(Ye),yt=F(B,0,`Status`,Je,yt),P(B,1,yt),Xe=[l(`demo-rt-layout`)];var bt=class extends (Ze=a){template(){return e`<div class="rt-panel"><h2>Users layout</h2><std-outlet></std-outlet></div>`}};V=M(Ze),bt=F(V,0,`Layout`,Xe,bt),P(V,1,bt),Qe=[l(`demo-rt-users`)];var xt=class extends ($e=a){template(){return e`<ul>${[1,2,3].map(t=>e`<li><a href="/users/${t}">User ${t}</a></li>`)}</ul>`}};H=M($e),xt=F(H,0,`Users`,Qe,xt),P(H,1,xt),nt=[l(`demo-rt-user`)];var Y=class extends (U=a,tt=[c(`id`)],et=[o(`tab`)],U){constructor(){super(...arguments),I(this,`data`),I(this,`userId`,P(W,8,this)),P(W,11,this),I(this,`tab`,P(W,12,this)),P(W,15,this)}template(){return e`<p>${this.data?.name??`loading…`}</p>
			<p>id=${this.userId} · tab=${this.tab??`(none)`}
				· <a href="/users/${this.userId}?tab=posts">posts</a> <a href="/users/${this.userId}?tab=likes">likes</a></p>`}};W=M(U),F(W,5,`userId`,tt,Y),F(W,5,`tab`,et,Y),Y=F(W,0,`User`,nt,Y),P(W,1,Y),rt=[l(`demo-rt-editor`)];var St=class extends (it=a){static styles=i`textarea { width: 100%; box-sizing: border-box; }`;text=n(``);saved=``;#e;connect(){let e=()=>this.text.peek()!==this.saved;this.#e=lt(this).beforeLeave(()=>!e()||confirm(`Discard unsaved changes?`),{unload:e})}disconnect(){this.#e?.()}template(){return e`<div class="rt-panel">
			<h2>Editor</h2>
			<textarea rows="4" .value=${this.text()} @input=${e=>this.text.set(e.target.value)}></textarea>
			<button @click=${()=>this.saved=this.text.peek()}>Save</button>
			<p>Type, then navigate away or reload: you are asked first.</p>
		</div>`}};G=M(it),St=F(G,0,`Editor`,rt,St),P(G,1,St),at=[l(`demo-rt-admin`)];var Ct=class extends (ot=a){template(){return e`<div class="rt-panel"><h2>Admin</h2><p>Signed in.</p></div>`}};K=M(ot),Ct=F(K,0,`Admin`,at,Ct),P(K,1,Ct),st=[l(`demo-rt-error`)];var wt=class extends (ct=a){error;template(){return e`<div class="rt-panel"><h2>Something failed</h2><p>${this.error?.message??``}</p></div>`}};q=M(ct),wt=F(q,0,`ErrorPage`,st,wt),P(q,1,wt);var Tt=`// Router \`announce\`: a screen-reader message after each client-side navigation.\r
import { state, t, tag, UIElement } from '@std-ui/core';\r
import '@std-ui/router';\r
import { createRouter } from '@std-ui/router';\r
import { createMemoryNavigation } from '@std-ui/router/testing';\r
import { demoRoutes } from './pages.js';\r
\r
@tag('demo-router-announcer-section')\r
export class DemoRouterAnnouncerSection extends UIElement {\r
	private readonly heard = state('(navigate to hear something)');\r
\r
	// Custom \`announce\`: same default text, plus we mirror it on screen. Return '' to stay silent.\r
	private readonly router = createRouter({\r
		routes: demoRoutes(),\r
		navigation: createMemoryNavigation('/'),\r
		announce: ({ matches }) => {\r
			const text = \`Navigated to \${matches.at(-1)?.route.title ?? 'unknown page'}\`;\r
			this.heard.set(text);\r
			return text;\r
		},\r
	});\r
\r
	protected override template() {\r
		const { router } = this;\r
		return t\`\r
			<section class="demo-router-block" id="announcer">\r
				<h2>Live-region announcer</h2>\r
				<p class="desc">\r
					Client-side navigations load no page, so screen readers say nothing. With <code>announce</code> the router\r
					writes a message into a hidden <code>aria-live="polite"</code> region after each navigation (not the\r
					initial load). Default text: route <code>title</code>, else first <code>&lt;h1&gt;</code>, else the path.\r
				</p>\r
				<std-router .router=\${router}>\r
					<p>\r
						<button @click=\${() => router.navigate('/')}>Home</button>\r
						<button @click=\${() => router.navigate('/products')}>Products</button>\r
						<button @click=\${() => router.navigate('/contact')}>Contact</button>\r
					</p>\r
					<std-outlet></std-outlet>\r
				</std-router>\r
				<p><strong>Screen reader hears:</strong> <output>\${this.heard()}</output></p>\r
			</section>\r
		\`;\r
	}\r
}\r
`,Et=`import { createRef, css, ref, t, tag, state, UIElement } from '@std-ui/core';\r
import { createRouter, routeParam, searchParam } from '@std-ui/router';\r
import '@std-ui/router'; // defines <std-router>, <std-route>, <std-outlet>
import { createMemoryNavigation } from '@std-ui/router/testing';
import type { RouteDef, Router, StdOutlet, StdRouter } from '@std-ui/router';
\r
// \`router\` is reactive, so templates re-render when <std-router> gets its .router assigned after connecting.\r
const routerOf = (el: Element): Router => (el.closest('std-router') as StdRouter).router;\r
const flag = (key: string): boolean => localStorage.getItem(key) === '1';\r
\r
// ---- page elements (plain custom elements; the outlet sets \`params\`, \`data\`, \`error\`) ----\r
\r
// Light DOM: the rules are wrapped in \`@scope (demo-router-full-section)\`, so they cover this markup\r
// and the route elements rendered into the outlet.\r
const appStyles = css\`\r
	.rt-links { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-block: 1rem; }\r
	.rt-links a { padding: 0.35rem 0.75rem; border-radius: 999px; text-decoration: none; color: var(--std-sys-color-primary, #6750a4); border: 1px solid var(--std-sys-color-outline-variant, #cac4d0); }\r
	.rt-links a[aria-current='page'] { background: var(--std-sys-color-secondary-container, #e8def8); }\r
	.rt-panel { border: 1px solid var(--std-sys-color-outline-variant, #cac4d0); border-radius: 12px; padding: 1rem; margin-block: 1rem; }\r
	.rt-status { font: 400 0.8rem/1.4 'Roboto Mono', monospace; color: var(--std-sys-color-on-surface-variant, #49454f); }\r
\`;\r
\r
// View-transition pseudo-elements hang off \`:root\`, outside any element scope, so they live on \`document\`.\r
const transitionStyles = css\`\r
	::view-transition-old(rt-page) { animation: rt-out 150ms ease-in both; }\r
	::view-transition-new(rt-page) { animation: rt-in 200ms ease-out both; }\r
	@keyframes rt-out { to { opacity: 0; transform: translateY(-8px); } }\r
	@keyframes rt-in { from { opacity: 0; transform: translateY(8px); } }\r
\`;\r
\r
const html = (markup: string): HTMLTemplateElement => {
	const template = document.createElement('template');
	template.innerHTML = markup;
	return template;
};

const loadUser = async ({ params }: { params: Record<string, string> }) => {
	await new Promise((r) => setTimeout(r, 300)); // simulated fetch
	return { id: params.id, name: \`User #\${params.id}\` };
};
const guardAdmin = () => (flag('rt-signed-in') ? true : '/users');
const loadAdmin = () => {
	if (flag('rt-fail')) throw new Error('Admin loader failed on purpose');
};

// Config routes (the same shape <std-route> markup builds): nested routes, a loader, a guard, redirects and a 404.
const routes = (): RouteDef[] => [
	{ path: '/', title: 'Home - router demo', template: html('<div class="rt-panel"><h2>Home</h2><p>Plain inline template route.</p></div>') },
	{
		path: '/users', element: 'demo-rt-layout', title: 'Users - router demo',
		children: [{ index: true, element: 'demo-rt-users' }, { path: ':id', element: 'demo-rt-user', load: loadUser }],
	},
	{ path: '/editor', element: 'demo-rt-editor', title: 'Editor - router demo' },
	{ path: '/admin', element: 'demo-rt-admin', errorElement: 'demo-rt-error', guard: guardAdmin, load: loadAdmin },
	{ path: '/old-users', redirect: '/users' },
	{ path: '*', template: html('<div class="rt-panel"><h2>404</h2><p>No route matches.</p></div>') },
];

@tag('demo-router-full-section')
export class DemoRouterFullSection extends UIElement {
	static override styles = appStyles;
	#observer?: MutationObserver;
	// In-memory history: the address bar belongs to the app's own router, so this one never touches it.
	private readonly router = createRouter({ routes: routes(), navigation: createMemoryNavigation('/'), viewTransition: true });

	private readonly outlet = createRef<StdOutlet>();

	/** Links inside the demo go to the in-memory router, not the browser's. */
	private readonly onLinkClick = (e: MouseEvent): void => {
		const a = (e.target as Element).closest('a');
		if (!a) return;
		e.preventDefault();
		e.stopPropagation();
		void this.router.navigate(a.getAttribute('href')!);
	};

	protected override connect(): void {
		const sheet = transitionStyles.styleSheet;
		if (!document.adoptedStyleSheets.includes(sheet)) document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
		// The announcer's live region is visually hidden; mirror it so the demo shows what a screen reader hears.
		this.#observer = new MutationObserver(() => {
			const announced = this.querySelector('#rt-announced');
			const text = document.querySelector('[data-std-announcer]')?.textContent;
			// Only write on change: this observer watches \`document.body\`, which contains \`announced\` itself.
			if (announced && text && announced.textContent !== text) announced.textContent = text;
		});
		this.#observer.observe(document.body, { childList: true, subtree: true, characterData: true });
	}

	protected override disconnect(): void {
		this.#observer?.disconnect();
		document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== transitionStyles.styleSheet);
	}

	protected override template() {
		return t\`
			<section class="demo-router-block" id="full-router">
				<h2>Full router</h2>
				<p class="desc">
					Navigation API router: nested routes, a lazy-style loader, a guard,
					redirects, and a <code>beforeLeave</code> / tab-close guard. Runs on an in-memory history, so the address bar stays on this app's own route.
				</p>
				<std-router .router=\${this.router} @click=\${this.onLinkClick}>
					<nav class="rt-links">
						<a href="/">Home</a>
						<a href="/users">Users</a>
						<a href="/users/3">User 3</a>
						<a href="/editor">Editor (unsaved guard)</a>
						<a href="/admin">Admin (guarded)</a>
						<a href="/old-users">Old URL (redirect)</a>
						<a href="/nowhere">Nowhere (404)</a>
					</nav>

					<demo-rt-controls></demo-rt-controls>
					<demo-rt-status></demo-rt-status>
					<p class="rt-status">announced to screen readers: <output id="rt-announced">(navigate to see)</output></p>

					<std-outlet \${ref(this.outlet)} view-transition-name="rt-page"></std-outlet>
				</std-router>
			</section>
		\`;
	}
}
@tag('demo-rt-controls')\r
class Controls extends UIElement {\r
	private readonly signedIn = state(flag('rt-signed-in'));\r
	private readonly fail = state(flag('rt-fail'));\r
\r
	private toggle(key: string, s: typeof this.signedIn): void {\r
		s.set(!s.peek());\r
		localStorage.setItem(key, s.peek() ? '1' : '0');\r
	}\r
\r
	protected override template() {\r
		return t\`<p>\r
			<label><input type="checkbox" .checked=\${this.signedIn()} @change=\${() => this.toggle('rt-signed-in', this.signedIn)} /> signed in (admin guard)</label>\r
			<label><input type="checkbox" .checked=\${this.fail()} @change=\${() => this.toggle('rt-fail', this.fail)} /> admin loader throws</label>\r
		</p>\`;\r
	}\r
}\r
\r
@tag('demo-rt-status')\r
class Status extends UIElement {\r
	protected override template() {\r
		const router = routerOf(this);\r
		return t\`<p class="rt-status">\r
			path=\${router.location().pathname} · status=\${router.status()} · matches=\${router.matches().length}\r
			· params=\${JSON.stringify(router.params())}\r
		</p>\`;\r
	}\r
}\r
\r
@tag('demo-rt-layout')\r
class Layout extends UIElement {\r
	protected override template() {\r
		return t\`<div class="rt-panel"><h2>Users layout</h2><std-outlet></std-outlet></div>\`;\r
	}\r
}\r
\r
@tag('demo-rt-users')\r
class Users extends UIElement {\r
	protected override template() {\r
		return t\`<ul>\${[1, 2, 3].map((n) => t\`<li><a href="/users/\${n}">User \${n}</a></li>\`)}</ul>\`;\r
	}\r
}\r
\r
@tag('demo-rt-user')\r
class User extends UIElement {\r
	data?: { id: string; name: string };\r
	@routeParam('id') readonly userId?: string; // \`:id\` of the route, reactive\r
	@searchParam('tab') readonly tab?: string; // \`?tab=...\`, reactive\r
	protected override template() {\r
		return t\`<p>\${this.data?.name ?? 'loading…'}</p>\r
			<p>id=\${this.userId} · tab=\${this.tab ?? '(none)'}\r
				· <a href="/users/\${this.userId}?tab=posts">posts</a> <a href="/users/\${this.userId}?tab=likes">likes</a></p>\`;\r
	}\r
}\r
\r
@tag('demo-rt-editor')\r
class Editor extends UIElement {\r
	static override styles = css\`textarea { width: 100%; box-sizing: border-box; }\`;\r
	private readonly text = state('');\r
	private saved = '';\r
	#off?: () => void;\r
\r
	protected override connect(): void {\r
		const dirty = (): boolean => this.text.peek() !== this.saved;\r
		// The second argument also prompts on tab close / reload while there is unsaved text.\r
		this.#off = routerOf(this).beforeLeave(() => !dirty() || confirm('Discard unsaved changes?'), { unload: dirty });\r
	}\r
\r
	protected override disconnect(): void {\r
		this.#off?.();\r
	}\r
\r
	protected override template() {\r
		return t\`<div class="rt-panel">\r
			<h2>Editor</h2>\r
			<textarea rows="4" .value=\${this.text()} @input=\${(e: Event) => this.text.set((e.target as HTMLTextAreaElement).value)}></textarea>\r
			<button @click=\${() => (this.saved = this.text.peek())}>Save</button>\r
			<p>Type, then navigate away or reload: you are asked first.</p>\r
		</div>\`;\r
	}\r
}\r
\r
@tag('demo-rt-admin')\r
class Admin extends UIElement {\r
	protected override template() {\r
		return t\`<div class="rt-panel"><h2>Admin</h2><p>Signed in.</p></div>\`;\r
	}\r
}\r
\r
@tag('demo-rt-error')\r
class ErrorPage extends UIElement {\r
	error?: Error;\r
	protected override template() {\r
		return t\`<div class="rt-panel"><h2>Something failed</h2><p>\${this.error?.message ?? ''}</p></div>\`;\r
	}\r
}\r
`,Dt=`// Shared by the router sections: three tiny pages as template routes, and an in-memory Navigation API so\r
// the demo never touches the address bar (the app itself is routed by the real router, see \`demo/app/\` (\`main.ts\`, \`pages.ts\`)).\r
import type { RouteDef } from '@std-ui/router';\r
\r
const page = (path: string, title: string, body: string): RouteDef => {\r
	const template = document.createElement('template');\r
	template.innerHTML = \`<div class="rt-page"><h2>\${title}</h2><p>\${body}</p></div>\`;\r
	return { path, title, template };\r
};\r
\r
export const demoRoutes = (): RouteDef[] => [\r
	page('/', 'Home', 'Welcome. This is the first page.'),\r
	page('/products', 'Products', 'A list of products would go here.'),\r
	page('/contact', 'Contact', 'A contact form would go here.'),\r
];\r
`,Ot=`import { css } from '@std-ui/core';

// View-transition pseudo-elements hang off \`:root\`, outside any element scope, so these rules must live on
// \`document\`. Adopted while the element is connected (see \`connect\`/\`disconnect\`).
export default css\`
	::view-transition-group(demo-rt) { animation-duration: 500ms; }
	::view-transition-old(demo-rt), ::view-transition-new(demo-rt) { animation-duration: 500ms; animation-fill-mode: both; mix-blend-mode: normal; }

	/* slide */
	:root[data-rt-effect='slide']::view-transition-old(demo-rt) { animation-name: rt-slide-out; }
	:root[data-rt-effect='slide']::view-transition-new(demo-rt) { animation-name: rt-slide-in; }
	@keyframes rt-slide-out { to { opacity: 0; transform: translateX(-120px); } }
	@keyframes rt-slide-in { from { opacity: 0; transform: translateX(120px); } }

	/* zoom */
	:root[data-rt-effect='zoom']::view-transition-old(demo-rt) { animation-name: rt-zoom-out; }
	:root[data-rt-effect='zoom']::view-transition-new(demo-rt) { animation-name: rt-zoom-in; }
	@keyframes rt-zoom-out { to { opacity: 0; transform: scale(1.4); } }
	@keyframes rt-zoom-in { from { opacity: 0; transform: scale(0.6); } }

	/* flip */
	:root[data-rt-effect='flip']::view-transition-old(demo-rt) { animation-name: rt-flip-out; }
	:root[data-rt-effect='flip']::view-transition-new(demo-rt) { animation-name: rt-flip-in; }
	@keyframes rt-flip-out { to { opacity: 0; transform: perspective(600px) rotateY(-90deg); } }
	@keyframes rt-flip-in { from { opacity: 0; transform: perspective(600px) rotateY(90deg); } }

	/* blur */
	:root[data-rt-effect='blur']::view-transition-old(demo-rt) { animation-name: rt-blur-out; }
	:root[data-rt-effect='blur']::view-transition-new(demo-rt) { animation-name: rt-blur-in; }
	@keyframes rt-blur-out { to { opacity: 0; filter: blur(16px); } }
	@keyframes rt-blur-in { from { opacity: 0; filter: blur(16px); } }

	/* wipe: new page revealed left to right */
	:root[data-rt-effect='wipe']::view-transition-old(demo-rt) { animation: none; }
	:root[data-rt-effect='wipe']::view-transition-new(demo-rt) { animation-name: rt-wipe; }
	@keyframes rt-wipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }

	/* spin */
	:root[data-rt-effect='spin']::view-transition-old(demo-rt) { animation-name: rt-spin-out; }
	:root[data-rt-effect='spin']::view-transition-new(demo-rt) { animation-name: rt-spin-in; }
	@keyframes rt-spin-out { to { opacity: 0; transform: rotate(-20deg) scale(0.5); } }
	@keyframes rt-spin-in { from { opacity: 0; transform: rotate(20deg) scale(0.5); } }
\`;
`,kt=`// Router \`viewTransition\`: each commit runs inside document.startViewTransition.
import { css, state, t, tag, UIElement } from '@std-ui/core';
import '@std-ui/router';
import { createRouter } from '@std-ui/router';
import { createMemoryNavigation } from '@std-ui/router/testing';
import { demoRoutes } from './pages.js';
import transitionStyles from './view-transition-section.css.js';

// One CSS block per name below, selected by \`<html data-rt-effect>\`.
const EFFECTS = ['slide', 'zoom', 'flip', 'blur', 'wipe', 'spin'] as const;

// Scoped to this element (light DOM: wrapped in \`@scope (demo-router-view-transition-section)\`).
const elementStyles = css\`
	.demo-rt-outlet { display: block; min-height: 8rem; }
\`;

@tag('demo-router-view-transition-section')
export class DemoRouterViewTransitionSection extends UIElement {
	static override styles = elementStyles;

	private readonly chosen = state<string>('(none yet)');
	private readonly router = createRouter({
		routes: demoRoutes(),
		navigation: createMemoryNavigation('/'),
		viewTransition: true,
		announce: false, // this section is only about the animation
	});

	protected override connect(): void {
		const sheet = transitionStyles.styleSheet;
		if (!document.adoptedStyleSheets.includes(sheet)) document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
	}

	protected override disconnect(): void {
		document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== transitionStyles.styleSheet);
		delete document.documentElement.dataset.rtEffect;
	}

	/** Picks a random effect (never the same twice in a row), then navigates; the router runs the commit in a view transition. */
	private go(path: string): void {
		const choices = EFFECTS.filter((e) => e !== document.documentElement.dataset.rtEffect);
		const next = choices[Math.floor(Math.random() * choices.length)]!;
		document.documentElement.dataset.rtEffect = next; // data-rt-effect = 'next' on <html> selects the animation style
		this.chosen.set(next);
		void this.router.navigate(path);
	}

	protected override template() {
		const { router } = this;
		return t\`
			<section class="demo-router-block" id="view-transition">
				<h2>View transitions</h2>
				<p class="desc">
					With <code>viewTransition: true</code> (or the <code>view-transition</code> attribute) the commit runs inside
					<code>document.startViewTransition</code>, so the outlet content animates between pages. Style it with
					<code>::view-transition-old/new(name)</code>; here <code>&lt;std-outlet view-transition-name="demo-rt"&gt;</code> gives the outlet that name only while this router's transition runs (the name is document-wide, so it is not left on permanently).
					Each click picks a random effect by setting <code>data-rt-effect</code> on <code>&lt;html&gt;</code> before navigating.
					Unsupported browsers and <code>prefers-reduced-motion</code> get a plain swap.
				</p>
				<std-router .router=\${router}>
					<p>
						<button @click=\${() => this.go('/')}>Home</button>
						<button @click=\${() => this.go('/products')}>Products</button>
						<button @click=\${() => this.go('/contact')}>Contact</button>
						<small>effect: <output>\${this.chosen()}</output></small>
					</p>
					<std-outlet class="demo-rt-outlet" view-transition-name="demo-rt"></std-outlet>
				</std-router>
			</section>
		\`;
	}
}
`,At=Object.create,jt=Object.defineProperty,Mt=Object.getOwnPropertyDescriptor,Nt=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),X=e=>{throw TypeError(e)},Pt=(e,t,n)=>t in e?jt(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Ft=(e,t)=>jt(e,`name`,{value:t,configurable:!0}),It=e=>[,,,At(e?.[Nt(`metadata`)]??null)],Lt=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],Z=e=>e!==void 0&&typeof e!=`function`?X(`Function expected`):e,Rt=(e,t,n,r,i)=>({kind:Lt[e],name:t,metadata:r,addInitializer:e=>n._?X(`Already initialized`):i.push(Z(e||null))}),zt=(e,t)=>Pt(t,Nt(`metadata`),e[3]),Bt=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},Vt=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=Lt[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&Mt(d<4?i:{get[n](){return Ut(this,a)},set[n](e){return Wt(this,a,e)}},n));d?p&&d<4&&Ft(a,(d>2?`set `:d>1?`get `:``)+n):Ft(i,n);for(var y=r.length-1;y>=0;y--)l=Rt(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>Ht(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Ut:Gt)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Wt(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?Z(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?X(`Object expected`):(Z(o=s.get)&&(v.get=o),Z(o=s.set)&&(v.set=o),Z(o=s.init)&&g.unshift(o));return d||zt(e,i),v&&jt(i,n,v),p?d^4?a:v:i},Q=(e,t,n)=>t.has(e)||X(`Cannot `+n),Ht=(e,t)=>Object(t)===t?e.has(t):X(`Cannot use the "in" operator on this value`),Ut=(e,t,n)=>(Q(e,t,`read from private field`),n?n.call(e):t.get(e)),Wt=(e,t,n,r)=>(Q(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Gt=(e,t,n)=>(Q(e,t,`access private method`),n),Kt,qt,Jt,Yt={"app-section.ts":Et,"pages.ts":Dt},Xt={"announcer-section.ts":Tt,"pages.ts":Dt},Zt={"view-transition-section.ts":kt,"view-transition-section.css.ts":Ot,"pages.ts":Dt};Kt=[l(`demo-router-page`)];var $=class extends (Jt=a){template(){return e`
			<code-preview .files=${Yt}><demo-router-full-section></demo-router-full-section></code-preview>
			<code-preview .files=${Xt}><demo-router-announcer-section></demo-router-announcer-section></code-preview>
			<code-preview .files=${Zt}><demo-router-view-transition-section></demo-router-view-transition-section></code-preview>
		`}};qt=It(Jt),$=Vt(qt,0,`DemoRouterPage`,Kt,$),Bt(qt,1,$);