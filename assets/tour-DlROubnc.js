import{H as e,M as t,O as n,P as r,U as i,V as a,_ as o,b as s,g as c,h as l,j as u,l as d,m as f,s as p,u as m,y as h}from"./index-DsT9IMgw.js";import{t as g}from"./key-DzqtW87o.js";import{f as _,p as v}from"./src-vkAovAHS.js";import"./code-preview-BoRCt_Z-.js";var y=Object.create,ee=Object.defineProperty,te=Object.getOwnPropertyDescriptor,ne=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),re=e=>{throw TypeError(e)},ie=(e,t,n)=>t in e?ee(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,ae=(e,t)=>ee(e,`name`,{value:t,configurable:!0}),oe=e=>[,,,y(e?.[ne(`metadata`)]??null)],se=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],ce=e=>e!==void 0&&typeof e!=`function`?re(`Function expected`):e,le=(e,t,n,r,i)=>({kind:se[e],name:t,metadata:r,addInitializer:e=>n._?re(`Already initialized`):i.push(ce(e||null))}),ue=(e,t)=>ie(t,ne(`metadata`),e[3]),de=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},fe=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=se[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&te(d<4?i:{get[n](){return he(this,a)},set[n](e){return ge(this,a,e)}},n));d?p&&d<4&&ae(a,(d>2?`set `:d>1?`get `:``)+n):ae(i,n);for(var y=r.length-1;y>=0;y--)l=le(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>me(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?he:_e)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>ge(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?ce(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?re(`Object expected`):(ce(o=s.get)&&(v.get=o),ce(o=s.set)&&(v.set=o),ce(o=s.init)&&g.unshift(o));return d||ue(e,i),v&&ee(i,n,v),p?d^4?a:v:i},pe=(e,t,n)=>t.has(e)||re(`Cannot `+n),me=(e,t)=>Object(t)===t?e.has(t):re(`Cannot use the "in" operator on this value`),he=(e,t,n)=>(pe(e,t,`read from private field`),n?n.call(e):t.get(e)),ge=(e,t,n,r)=>(pe(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),_e=(e,t,n)=>(pe(e,t,`access private method`),n),ve,ye,be,xe=s(0),Se=n(()=>xe()<2?`click`:`clicks`);ve=[h(`demo-counter-section`)];var Ce=class extends (be=f){template(){return i`
			<h2>Signals + templates</h2>
			<p class="desc"><code>state</code>, <code>computed</code>, <code>html</code>/<code>render</code> — the template re-renders in place whenever a read signal changes.</p>
			<p><strong>${xe()}</strong> ${Se()}</p>
			<div class="demo-actions">
				<button type="button" @click=${()=>xe.update(e=>e+1)}>+1</button>
				<button type="button" class="tonal" @click=${()=>xe.set(0)} ?disabled=${xe()===0}>reset</button>
			</div>
		`}};ye=oe(be),Ce=fe(ye,0,`DemoCounterSection`,ve,Ce),de(ye,1,Ce);var we=Object.create,Te=Object.defineProperty,Ee=Object.getOwnPropertyDescriptor,De=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),Oe=e=>{throw TypeError(e)},ke=(e,t,n)=>t in e?Te(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Ae=(e,t)=>Te(e,`name`,{value:t,configurable:!0}),je=e=>[,,,we(e?.[De(`metadata`)]??null)],Me=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],b=e=>e!==void 0&&typeof e!=`function`?Oe(`Function expected`):e,Ne=(e,t,n,r,i)=>({kind:Me[e],name:t,metadata:r,addInitializer:e=>n._?Oe(`Already initialized`):i.push(b(e||null))}),Pe=(e,t)=>ke(t,De(`metadata`),e[3]),x=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},Fe=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=Me[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&Ee(d<4?i:{get[n](){return ze(this,a)},set[n](e){return Be(this,a,e)}},n));d?p&&d<4&&Ae(a,(d>2?`set `:d>1?`get `:``)+n):Ae(i,n);for(var y=r.length-1;y>=0;y--)l=Ne(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>Re(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?ze:Ve)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Be(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?b(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?Oe(`Object expected`):(b(o=s.get)&&(v.get=o),b(o=s.set)&&(v.set=o),b(o=s.init)&&g.unshift(o));return d||Pe(e,i),v&&Te(i,n,v),p?d^4?a:v:i},Ie=(e,t,n)=>ke(e,typeof t==`symbol`?t:t+``,n),Le=(e,t,n)=>t.has(e)||Oe(`Cannot `+n),Re=(e,t)=>Object(t)===t?e.has(t):Oe(`Cannot use the "in" operator on this value`),ze=(e,t,n)=>(Le(e,t,`read from private field`),n?n.call(e):t.get(e)),Be=(e,t,n,r)=>(Le(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Ve=(e,t,n)=>(Le(e,t,`access private method`),n),He,Ue,We,Ge=[h(`demo-attribute-section`)],S,C=class extends (We=f,Ue=[l({type:String,reflect:!0})],He=[l({reflect:!0})],We){constructor(){super(...arguments),Ie(this,`theme`,x(S,8,this,s(`light`))),x(S,11,this),Ie(this,`count`,x(S,12,this,s(0))),x(S,15,this),Ie(this,`expanded`,s(!1))}template(){return i`
			<h2>Attributes vs. state</h2>
			<p class="desc"><code>@attribute({ reflect: true })</code> mirrors to/from the host's HTML attributes (inspect <code>&lt;demo-attribute-section&gt;</code> in devtools). Toggling <code>theme</code> flips this card via <code>:host([theme="dark"])</code> in <code>static styles</code> — not the whole page (see Context). <code>state()</code> alone stays JS-only.</p>
			<p>
				theme=<code>${this.theme()}</code>,
				count=<code>${this.count()}</code>
			</p>
			<div class="demo-actions">
				<button type="button" @click=${()=>this.theme.update(e=>e===`light`?`dark`:`light`)}>toggle theme attribute</button>
				<button type="button" class="tonal" @click=${()=>this.count.update(e=>e+1)}>increment count attribute</button>
				<button type="button" class="text" @click=${()=>this.expanded.set(!this.expanded())}>${this.expanded()?`hide`:`show`} internal-only state</button>
			</div>
			${this.expanded()?i`<p><em>This line comes from a plain <code>state()</code> — it never appears as an attribute.</em></p>`:``}
		`}};S=je(We),Fe(S,5,`theme`,Ue,C),Fe(S,5,`count`,He,C),C=Fe(S,0,`DemoAttributeSection`,Ge,C),Ie(C,`styles`,u`
		:host([theme='dark']) {
			background: var(--std-sys-color-inverse-surface);
			border-color: var(--std-sys-color-outline);
			color: var(--std-sys-color-inverse-on-surface);
		}
		:host([theme='dark']) :is(h2, p) {
			color: var(--std-sys-color-inverse-on-surface);
		}
		:host([theme='dark']) p.desc {
			opacity: 0.88;
		}
		:host([theme='dark']) code {
			background: rgb(255 255 255 / 0.12);
			color: inherit;
		}
	`),x(S,1,C);var Ke=Object.create,qe=Object.defineProperty,Je=Object.getOwnPropertyDescriptor,Ye=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),w=e=>{throw TypeError(e)},Xe=(e,t,n)=>t in e?qe(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Ze=(e,t)=>qe(e,`name`,{value:t,configurable:!0}),Qe=e=>[,,,Ke(e?.[Ye(`metadata`)]??null)],$e=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],T=e=>e!==void 0&&typeof e!=`function`?w(`Function expected`):e,et=(e,t,n,r,i)=>({kind:$e[e],name:t,metadata:r,addInitializer:e=>n._?w(`Already initialized`):i.push(T(e||null))}),tt=(e,t)=>Xe(t,Ye(`metadata`),e[3]),E=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},nt=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=$e[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&Je(d<4?i:{get[n](){return ot(this,a)},set[n](e){return st(this,a,e)}},n));d?p&&d<4&&Ze(a,(d>2?`set `:d>1?`get `:``)+n):Ze(i,n);for(var y=r.length-1;y>=0;y--)l=et(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>at(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?ot:ct)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>st(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?T(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?w(`Object expected`):(T(o=s.get)&&(v.get=o),T(o=s.set)&&(v.set=o),T(o=s.init)&&g.unshift(o));return d||tt(e,i),v&&qe(i,n,v),p?d^4?a:v:i},rt=(e,t,n)=>Xe(e,typeof t==`symbol`?t:t+``,n),it=(e,t,n)=>t.has(e)||w(`Cannot `+n),at=(e,t)=>Object(t)===t?e.has(t):w(`Cannot use the "in" operator on this value`),ot=(e,t,n)=>(it(e,t,`read from private field`),n?n.call(e):t.get(e)),st=(e,t,n,r)=>(it(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),ct=(e,t,n)=>(it(e,t,`access private method`),n),lt,ut,dt,D,ft,pt,mt,O,ht=g(`demo-theme`);dt=[h(`demo-theme-child`)];var gt=class extends (ut=f,lt=[_(ht)],ut){constructor(){super(...arguments),rt(this,`theme`,E(D,8,this)),E(D,11,this)}template(){return i`<p>Child reads context: mode = <strong>${this.theme.mode}</strong></p>`}};D=Qe(ut),nt(D,5,`theme`,lt,gt),gt=nt(D,0,`DemoThemeChild`,dt,gt),E(D,1,gt),mt=[h(`demo-context-section`)];var _t=class extends (pt=f,ft=[v(ht)],pt){constructor(){super(...arguments),rt(this,`theme`,E(O,8,this,s({mode:`light`}))),E(O,11,this)}template(){return i`
			<h2>Context</h2>
			<p class="desc"><code>@provide(ThemeKey)</code> on this element provides <code>ThemeKey</code>; the nested <code>&lt;demo-theme-child&gt;</code> below reads it via <code>@consume(ThemeKey)</code> with no attributes/props passed through markup.</p>
			<div class="demo-actions">
				<button type="button" @click="${()=>this.theme.set({mode:this.theme().mode===`light`?`dark`:`light`})}">toggle (parent)</button>
			</div>
			<demo-theme-child></demo-theme-child>
		`}};O=Qe(pt),nt(O,5,`theme`,ft,_t),_t=nt(O,0,`DemoContextSection`,mt,_t),E(O,1,_t);var vt=Object.create,yt=Object.defineProperty,bt=Object.getOwnPropertyDescriptor,xt=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),k=e=>{throw TypeError(e)},St=(e,t,n)=>t in e?yt(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Ct=(e,t)=>yt(e,`name`,{value:t,configurable:!0}),wt=e=>[,,,vt(e?.[xt(`metadata`)]??null)],Tt=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],A=e=>e!==void 0&&typeof e!=`function`?k(`Function expected`):e,Et=(e,t,n,r,i)=>({kind:Tt[e],name:t,metadata:r,addInitializer:e=>n._?k(`Already initialized`):i.push(A(e||null))}),Dt=(e,t)=>St(t,xt(`metadata`),e[3]),j=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},Ot=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=Tt[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&bt(d<4?i:{get[n](){return Mt(this,a)},set[n](e){return Pt(this,a,e)}},n));d?p&&d<4&&Ct(a,(d>2?`set `:d>1?`get `:``)+n):Ct(i,n);for(var y=r.length-1;y>=0;y--)l=Et(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>jt(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Mt:Ft)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Pt(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?A(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?k(`Object expected`):(A(o=s.get)&&(v.get=o),A(o=s.set)&&(v.set=o),A(o=s.init)&&g.unshift(o));return d||Dt(e,i),v&&yt(i,n,v),p?d^4?a:v:i},kt=(e,t,n)=>St(e,typeof t==`symbol`?t:t+``,n),At=(e,t,n)=>t.has(e)||k(`Cannot `+n),jt=(e,t)=>Object(t)===t?e.has(t):k(`Cannot use the "in" operator on this value`),Mt=(e,t,n)=>(At(e,t,`read from private field`),n?n.call(e):t.get(e)),Nt=(e,t,n)=>t.has(e)?k(`Cannot add the same private member more than once`):t instanceof WeakSet?t.add(e):t.set(e,n),Pt=(e,t,n,r)=>(At(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Ft=(e,t,n)=>(At(e,t,`access private method`),n),It,Lt,Rt,zt=[h(`demo-query-section`)],M,Bt,Vt,N=class extends (Rt=f,Lt=[o(`input`)],It=[c(`li`)],Rt){constructor(){super(...arguments),Nt(this,Bt),kt(this,`items`,s([`alpha`,`beta`,`gamma`])),kt(this,`input`,j(M,8,this)),j(M,11,this),kt(this,`listItems`,j(M,12,this)),j(M,15,this)}template(){return i`
			<h2>Queries</h2>
			<p class="desc"><code>@query()</code> / <code>@queryAll()</code> resolve <code>this.querySelector(All)</code> on demand; <code>firstUpdated()</code> + <code>this.effect()</code> patch a node (the <code>.badge</code> span) directly.</p>
			<input class="demo-outlined-field" type="text" placeholder="add an item, press Enter" @keydown=${e=>Ft(this,Bt,Vt).call(this,e)} />
			<span class="demo-badge badge"></span>
			<ul>
				${this.items().map(e=>i`<li>${e}</li>`)}
			</ul>
			<div class="demo-actions">
				<button type="button" @click=${()=>this.input?.focus()}>focus input via @query</button>
				<button type="button" class="tonal" @click=${()=>console.log(`@queryAll() <li> count:`,this.listItems.length)}>log &lt;li&gt; count (console)</button>
			</div>
		`}firstUpdated(){let e=this.querySelector(`.badge`);this.effect(()=>{let t=this.items().length;e.textContent=`${t} item${t===1?``:`s`}`})}};M=wt(Rt),Bt=new WeakSet,Vt=function(e){if(e.key!==`Enter`)return;let t=this.input?.value.trim();t&&(this.items.set([...this.items(),t]),this.input&&(this.input.value=``))},Ot(M,5,`input`,Lt,N),Ot(M,5,`listItems`,It,N),N=Ot(M,0,`DemoQuerySection`,zt,N),j(M,1,N);var Ht=Object.create,Ut=Object.defineProperty,Wt=Object.getOwnPropertyDescriptor,Gt=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),P=e=>{throw TypeError(e)},Kt=(e,t,n)=>t in e?Ut(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,qt=(e,t)=>Ut(e,`name`,{value:t,configurable:!0}),Jt=e=>[,,,Ht(e?.[Gt(`metadata`)]??null)],Yt=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],F=e=>e!==void 0&&typeof e!=`function`?P(`Function expected`):e,Xt=(e,t,n,r,i)=>({kind:Yt[e],name:t,metadata:r,addInitializer:e=>n._?P(`Already initialized`):i.push(F(e||null))}),Zt=(e,t)=>Kt(t,Gt(`metadata`),e[3]),Qt=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},$t=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=Yt[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&Wt(d<4?i:{get[n](){return rn(this,a)},set[n](e){return an(this,a,e)}},n));d?p&&d<4&&qt(a,(d>2?`set `:d>1?`get `:``)+n):qt(i,n);for(var y=r.length-1;y>=0;y--)l=Xt(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>nn(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?rn:on)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>an(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?F(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?P(`Object expected`):(F(o=s.get)&&(v.get=o),F(o=s.set)&&(v.set=o),F(o=s.init)&&g.unshift(o));return d||Zt(e,i),v&&Ut(i,n,v),p?d^4?a:v:i},en=(e,t,n)=>Kt(e,typeof t==`symbol`?t:t+``,n),tn=(e,t,n)=>t.has(e)||P(`Cannot `+n),nn=(e,t)=>Object(t)===t?e.has(t):P(`Cannot use the "in" operator on this value`),rn=(e,t,n)=>(tn(e,t,`read from private field`),n?n.call(e):t.get(e)),an=(e,t,n,r)=>(tn(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),on=(e,t,n)=>(tn(e,t,`access private method`),n),sn,cn,ln=[h(`demo-shadow-chip`)],I,un,dn,fn,L=class extends (cn=f,sn=[o(`button`)],cn){constructor(){super(...arguments),en(this,`on`,s(!1)),en(this,`toggle`,Qt(I,8,this)),Qt(I,11,this)}template(){return i`
			<style>
				:host { display: inline-block; }
				button {
					font: inherit;
					font-weight: 500;
					font-size: 0.875rem;
					padding: 0.625rem 1.5rem;
					border-radius: 9999px;
					border: none;
					background: var(--std-sys-color-primary, #6750a4);
					color: var(--std-sys-color-on-primary, #fff);
					cursor: pointer;
					box-shadow: 0 1px 2px rgb(0 0 0 / 0.3), 0 1px 3px 1px rgb(0 0 0 / 0.15);
				}
				button[data-off] {
					background: var(--std-sys-color-surface-container-highest, #e6e0e9);
					color: var(--std-sys-color-on-surface-variant, #49454f);
					box-shadow: none;
				}
			</style>
			<button
				type="button"
				data-off=${this.on()?null:``}
				@click=${()=>this.on.set(!this.on())}
			>
				${this.on()?`Encapsulated (shadow)`:`Click — themed only inside shadow`}
			</button>
		`}updated(){this.on()&&this.toggle&&this.toggle.focus()}};I=Jt(cn),$t(I,5,`toggle`,sn,L),L=$t(I,0,`DemoShadowChip`,ln,L),en(L,`shadowRootOptions`,{mode:`open`}),Qt(I,1,L),un=[h(`demo-shadow-section`)];var pn=class extends (fn=f){static styles=u`
		p {
			display: flex;
			flex-wrap: wrap;
			gap: 0.75rem;
			align-items: center;
		}
	`;template(){return i`
			<h2>Shadow DOM</h2>
			<p class="desc">
				Set <code>static shadowRootOptions</code> on a <code>UIElement</code> subclass —
				<code>template()</code> renders into <code>shadowRoot</code>; <code>@query()</code> searches
				<code>renderRoot</code>, not the light DOM host.
			</p>
			<p>
				The chip uses shadow-only Std-styled rules. Global <code>button</code> styles from
				<code>demo-components.css</code> do not reach it — compare with the page button beside it.
			</p>
			<p>
				<demo-shadow-chip></demo-shadow-chip>
				<button type="button">ordinary page button</button>
			</p>
		`}};dn=Jt(fn),pn=$t(dn,0,`DemoShadowSection`,un,pn),Qt(dn,1,pn);var mn=Object.create,hn=Object.defineProperty,gn=Object.getOwnPropertyDescriptor,_n=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),R=e=>{throw TypeError(e)},vn=(e,t,n)=>t in e?hn(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,yn=(e,t)=>hn(e,`name`,{value:t,configurable:!0}),bn=e=>[,,,mn(e?.[_n(`metadata`)]??null)],xn=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],z=e=>e!==void 0&&typeof e!=`function`?R(`Function expected`):e,Sn=(e,t,n,r,i)=>({kind:xn[e],name:t,metadata:r,addInitializer:e=>n._?R(`Already initialized`):i.push(z(e||null))}),Cn=(e,t)=>vn(t,_n(`metadata`),e[3]),wn=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},Tn=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=xn[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&gn(d<4?i:{get[n](){return On(this,a)},set[n](e){return kn(this,a,e)}},n));d?p&&d<4&&yn(a,(d>2?`set `:d>1?`get `:``)+n):yn(i,n);for(var y=r.length-1;y>=0;y--)l=Sn(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>Dn(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?On:An)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>kn(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?z(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?R(`Object expected`):(z(o=s.get)&&(v.get=o),z(o=s.set)&&(v.set=o),z(o=s.init)&&g.unshift(o));return d||Cn(e,i),v&&hn(i,n,v),p?d^4?a:v:i},En=(e,t,n)=>t.has(e)||R(`Cannot `+n),Dn=(e,t)=>Object(t)===t?e.has(t):R(`Cannot use the "in" operator on this value`),On=(e,t,n)=>(En(e,t,`read from private field`),n?n.call(e):t.get(e)),kn=(e,t,n,r)=>(En(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),An=(e,t,n)=>(En(e,t,`access private method`),n),jn,Mn,Nn,Pn,Fn,In,Ln,Rn,zn,Bn=u`
	:host { display: inline-flex; }
	button {
		font: inherit;
		font-weight: 500;
		font-size: 0.875rem;
		padding: 0.625rem 1.5rem;
		border-radius: 9999px;
		border: none;
		background: var(--std-sys-color-tertiary, #7d5260);
		color: var(--std-sys-color-on-tertiary, #fff);
		cursor: pointer;
	}
`;jn=[h(`demo-css-chip`)];var Vn=class extends (Nn=f){static shadowRootOptions={mode:`open`};static styles=Bn;count=s(0);template(){return i`<button type="button" @click=${()=>this.count.update(e=>e+1)}>clicked ${this.count()}×</button>`}};Mn=bn(Nn),Vn=Tn(Mn,0,`DemoCssChip`,jn,Vn),wn(Mn,1,Vn);var Hn=u`
	:host {
		display: inline-block;
		margin: 0 0.35rem 0.35rem 0;
		padding: 0.2rem 0.65rem;
		font-size: 0.75rem;
		font-weight: 500;
		border-radius: var(--std-shape-corner-full, 9999px);
		background: var(--std-sys-color-tertiary-container, #ffd8e4);
		color: var(--std-sys-color-on-tertiary-container, #31101d);
	}
`;Pn=[h(`demo-css-badge`)];var Un=class extends (In=f){static styles=Hn};Fn=bn(In),Un=Tn(Fn,0,`DemoCssBadge`,Pn,Un),wn(Fn,1,Un),Ln=[h(`demo-css-section`)];var Wn=class extends (zn=f){template(){return i`
			<h2>CSS templates</h2>
			<p class="desc">
				<code>css\`...\`</code> tags a literal as CSS (cached, composable, rejects raw strings —
				use <code>unsafeCss()</code> to opt in). <code>static styles</code> on a
				<code>UIElement</code> applies it as a real <code>CSSStyleSheet</code>: adopted via
				<code>adoptedStyleSheets</code> for a shadow root (shared by reference, one instance
				below), or — with no shadow boundary to hold it — adopted onto <code>document</code>
				once per tag, wrapped in <code>@scope (tag-name)</code> so it still can't leak to
				unrelated markup, no matter how many instances share it.
			</p>
			<p>
				<demo-css-chip></demo-css-chip>
				<demo-css-chip></demo-css-chip>
			</p>
			<p class="desc">
				Five <code>&lt;demo-css-badge&gt;</code> light-DOM instances below share a single
				<code>@scope</code>-wrapped stylesheet on <code>document</code> — open devtools and
				check <code>document.adoptedStyleSheets</code> (or a fallback <code>&lt;style&gt;</code>
				in <code>&lt;head&gt;</code>) for exactly one entry mentioning <code>demo-css-badge</code>.
			</p>
			<p>
				${[1,2,3,4,5].map(e=>i`<demo-css-badge>badge ${e}</demo-css-badge>`)}
			</p>
		`}};Rn=bn(zn),Wn=Tn(Rn,0,`DemoCssSection`,Ln,Wn),wn(Rn,1,Wn);var Gn=Object.create,Kn=Object.defineProperty,qn=Object.getOwnPropertyDescriptor,Jn=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),Yn=e=>{throw TypeError(e)},Xn=(e,t,n)=>t in e?Kn(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Zn=(e,t)=>Kn(e,`name`,{value:t,configurable:!0}),Qn=e=>[,,,Gn(e?.[Jn(`metadata`)]??null)],$n=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],B=e=>e!==void 0&&typeof e!=`function`?Yn(`Function expected`):e,er=(e,t,n,r,i)=>({kind:$n[e],name:t,metadata:r,addInitializer:e=>n._?Yn(`Already initialized`):i.push(B(e||null))}),tr=(e,t)=>Xn(t,Jn(`metadata`),e[3]),nr=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},rr=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=$n[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&qn(d<4?i:{get[n](){return or(this,a)},set[n](e){return sr(this,a,e)}},n));d?p&&d<4&&Zn(a,(d>2?`set `:d>1?`get `:``)+n):Zn(i,n);for(var y=r.length-1;y>=0;y--)l=er(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>ar(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?or:cr)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>sr(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?B(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?Yn(`Object expected`):(B(o=s.get)&&(v.get=o),B(o=s.set)&&(v.set=o),B(o=s.init)&&g.unshift(o));return d||tr(e,i),v&&Kn(i,n,v),p?d^4?a:v:i},ir=(e,t,n)=>t.has(e)||Yn(`Cannot `+n),ar=(e,t)=>Object(t)===t?e.has(t):Yn(`Cannot use the "in" operator on this value`),or=(e,t,n)=>(ir(e,t,`read from private field`),n?n.call(e):t.get(e)),sr=(e,t,n,r)=>(ir(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),cr=(e,t,n)=>(ir(e,t,`access private method`),n),lr=[h(`demo-directives-section`)],ur,dr,fr=class extends (dr=f){active=s(!1);big=s(!1);template(){let e={active:this.active(),"demo-box":!0},n={padding:this.big()?`1.5rem`:`0.75rem`,fontSize:this.big()?`1.125rem`:`1rem`,transition:`all 150ms ease`};return i`
			<h2>Directives</h2>
			<p class="desc"><code>classMap</code> toggles individual classes via <code>classList</code>; <code>styleMap</code> sets individual inline style properties - both can coexist with static text/other classes in the same attribute; <code>unsafeHtml</code> injects raw markup (trusted input only).</p>
			<div class="${m(e)} demo-box" style=${d(n)}>
				classMap + styleMap controlled box (mixed with static "class"/"style" text)
			</div>
			<div class="demo-actions">
				<button type="button" @click=${()=>this.active.set(!this.active())}>toggle active class</button>
				<button type="button" class="tonal" @click=${()=>this.big.set(!this.big())}>toggle size style</button>
			</div>
			<div>${t(`<em>rendered via <code>unsafeHtml</code></em>`)}</div>
		`}};ur=Qn(dr),fr=rr(ur,0,`DemoDirectivesSection`,lr,fr),nr(ur,1,fr);var pr=Object.create,mr=Object.defineProperty,hr=Object.getOwnPropertyDescriptor,gr=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),V=e=>{throw TypeError(e)},_r=(e,t,n)=>t in e?mr(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,vr=(e,t)=>mr(e,`name`,{value:t,configurable:!0}),yr=e=>[,,,pr(e?.[gr(`metadata`)]??null)],br=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],H=e=>e!==void 0&&typeof e!=`function`?V(`Function expected`):e,xr=(e,t,n,r,i)=>({kind:br[e],name:t,metadata:r,addInitializer:e=>n._?V(`Already initialized`):i.push(H(e||null))}),Sr=(e,t)=>_r(t,gr(`metadata`),e[3]),Cr=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},wr=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=br[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&hr(d<4?i:{get[n](){return Dr(this,a)},set[n](e){return Or(this,a,e)}},n));d?p&&d<4&&vr(a,(d>2?`set `:d>1?`get `:``)+n):vr(i,n);for(var y=r.length-1;y>=0;y--)l=xr(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>Er(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Dr:kr)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Or(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?H(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?V(`Object expected`):(H(o=s.get)&&(v.get=o),H(o=s.set)&&(v.set=o),H(o=s.init)&&g.unshift(o));return d||Sr(e,i),v&&mr(i,n,v),p?d^4?a:v:i},Tr=(e,t,n)=>t.has(e)||V(`Cannot `+n),Er=(e,t)=>Object(t)===t?e.has(t):V(`Cannot use the "in" operator on this value`),Dr=(e,t,n)=>(Tr(e,t,`read from private field`),n?n.call(e):t.get(e)),Or=(e,t,n,r)=>(Tr(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),kr=(e,t,n)=>(Tr(e,t,`access private method`),n),Ar=[h(`demo-bindings-section`)],jr,Mr,Nr=class extends (Mr=f){static styles=u`
		.demo-self {
			display: inline-flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.5rem 0.75rem;
			border: 1px dashed var(--std-sys-color-outline);
			border-radius: var(--std-shape-corner-small, 8px);
		}

		.demo-log {
			margin: 0.75rem 0 0;
			min-height: 5.5em;
			padding: 0.5rem 0.75rem;
			font-family: 'Roboto Mono', ui-monospace, monospace;
			font-size: 0.8rem;
			background: var(--std-sys-color-surface-container-high);
			border-radius: 4px;
			white-space: pre-wrap;
		}
	`;active=s(!1);hue=s(210);log=s([]);note(e){this.log.set([e,...this.log()].slice(0,6))}onceHandler=Object.assign(()=>this.note(`handler.options { once }: fired (and removed)`),{options:{once:!0}});captureHandler=r(()=>this.note(`handler.options { capture }: runs BEFORE the inner click`),{capture:!0});overrideHandler=r(()=>this.note(`modifier .once overridden by options { once: false }: still firing`),{once:!1});template(){return i`
			<h2>Binding modifiers</h2>
			<p class="desc">
				<code>@event.modifier</code> adds <code>once</code>, <code>prevent</code>, <code>stop</code>,
				<code>stop-immediate</code> and <code>self</code> without handler boilerplate.
				<code>class.name</code> / <code>style.prop</code> bind one class or style property and leave the rest alone.
			</p>

			<div class="demo-actions">
				<button type="button" @click.once=${()=>this.note(`@click.once: fired (and removed)`)}>
					@click.once
				</button>
				<form @submit.prevent=${()=>this.note(`@submit.prevent: no page reload`)}>
					<button type="submit" class="tonal">@submit.prevent</button>
				</form>
			</div>

			<div class="demo-actions" @click=${()=>this.note(`outer: reached the parent`)}>
				<button type="button" @click.stop=${()=>this.note(`@click.stop: parent not notified`)}>
					@click.stop
				</button>
				<button type="button" @click=${()=>this.note(`plain click: bubbles to the parent`)}>
					plain click
				</button>
				<span
					class="demo-self"
					@click.self=${()=>this.note(`@click.self: clicked the span itself`)}
				>
					@click.self <button type="button" class="tonal">inner (ignored)</button>
				</span>
			</div>

			<div class="demo-actions">
				<button type="button" @click=${this.onceHandler}>handler.options once</button>
				<span class="demo-self" @click=${this.captureHandler}>
					capture on parent
					<button type="button" class="tonal" @click=${()=>this.note(`inner click`)}>inner</button>
				</span>
				<button type="button" @click.once=${this.overrideHandler}>.once overridden by options</button>
			</div>

			<div class="demo-actions">
				<button
					type="button"
					class.active=${this.active()}
					style.background=${this.active()?`hsl(${this.hue()} 70% 45%)`:null}
					style.color=${this.active()?`white`:null}
					style.--hue=${this.hue()}
					@click=${()=>this.active.set(!this.active())}
				>
					class.active + style.background
				</button>
				<label>
					hue
					<input
						type="range"
						min="0"
						max="360"
						.value=${this.hue()}
						@input=${e=>this.hue.set(Number(e.target.value))}
					/>
				</label>
			</div>

			<pre class="demo-log">${this.log().join(`
`)||`events log here`}</pre>
		`}};jr=yr(Mr),Nr=wr(jr,0,`DemoBindingsSection`,Ar,Nr),Cr(jr,1,Nr);var Pr=Object.create,Fr=Object.defineProperty,Ir=Object.getOwnPropertyDescriptor,Lr=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),U=e=>{throw TypeError(e)},Rr=(e,t,n)=>t in e?Fr(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,zr=(e,t)=>Fr(e,`name`,{value:t,configurable:!0}),Br=e=>[,,,Pr(e?.[Lr(`metadata`)]??null)],Vr=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],W=e=>e!==void 0&&typeof e!=`function`?U(`Function expected`):e,Hr=(e,t,n,r,i)=>({kind:Vr[e],name:t,metadata:r,addInitializer:e=>n._?U(`Already initialized`):i.push(W(e||null))}),Ur=(e,t)=>Rr(t,Lr(`metadata`),e[3]),Wr=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},Gr=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=Vr[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&Ir(d<4?i:{get[n](){return Jr(this,a)},set[n](e){return Yr(this,a,e)}},n));d?p&&d<4&&zr(a,(d>2?`set `:d>1?`get `:``)+n):zr(i,n);for(var y=r.length-1;y>=0;y--)l=Hr(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>qr(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Jr:Xr)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Yr(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?W(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?U(`Object expected`):(W(o=s.get)&&(v.get=o),W(o=s.set)&&(v.set=o),W(o=s.init)&&g.unshift(o));return d||Ur(e,i),v&&Fr(i,n,v),p?d^4?a:v:i},Kr=(e,t,n)=>t.has(e)||U(`Cannot `+n),qr=(e,t)=>Object(t)===t?e.has(t):U(`Cannot use the "in" operator on this value`),Jr=(e,t,n)=>(Kr(e,t,`read from private field`),n?n.call(e):t.get(e)),Yr=(e,t,n,r)=>(Kr(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Xr=(e,t,n)=>(Kr(e,t,`access private method`),n),Zr=[h(`demo-event-extensions-section`)],Qr,$r,ei=class extends ($r=f){typed=s(``);debounced=s(``);combos=s([]);template(){return i`
			<h2>Event extensions</h2>
			<p class="desc">
				<code>@input.debounce:300</code> runs the handler once typing pauses.
				<code>@keyup.ctrl+enter.ctrl+y</code> runs only for Ctrl+Enter or ctrl+y.
			</p>

			<div class="demo-actions">
				<input
					placeholder="type quickly..."
					@input=${e=>this.typed.set(e.target.value)}
					@input.debounce:300=${e=>this.debounced.set(e.target.value)}
				/>
				<span>live: ${this.typed()} | debounced: ${this.debounced()}</span>
			</div>

			<div class="demo-actions">
				<input
					placeholder="focus, press Ctrl+Enter or ctrl+y"
					@keyup.ctrl+enter.ctrl+y=${e=>this.combos.set([`${e.ctrlKey?`Ctrl+`:``}${e.shiftKey?`Shift+`:``}${e.key}`,...this.combos()].slice(0,5))}
				/>
			</div>

			<pre class="demo-log">${this.combos().join(`
`)||`matching combos log here`}</pre>
		`}};Qr=Br($r),ei=Gr(Qr,0,`DemoEventExtensionsSection`,Zr,ei),Wr(Qr,1,ei);var ti=Object.create,ni=Object.defineProperty,ri=Object.getOwnPropertyDescriptor,ii=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),G=e=>{throw TypeError(e)},ai=(e,t,n)=>t in e?ni(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,oi=(e,t)=>ni(e,`name`,{value:t,configurable:!0}),si=e=>[,,,ti(e?.[ii(`metadata`)]??null)],ci=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],K=e=>e!==void 0&&typeof e!=`function`?G(`Function expected`):e,li=(e,t,n,r,i)=>({kind:ci[e],name:t,metadata:r,addInitializer:e=>n._?G(`Already initialized`):i.push(K(e||null))}),ui=(e,t)=>ai(t,ii(`metadata`),e[3]),di=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},fi=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=ci[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&ri(d<4?i:{get[n](){return hi(this,a)},set[n](e){return gi(this,a,e)}},n));d?p&&d<4&&oi(a,(d>2?`set `:d>1?`get `:``)+n):oi(i,n);for(var y=r.length-1;y>=0;y--)l=li(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>mi(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?hi:_i)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>gi(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?K(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?G(`Object expected`):(K(o=s.get)&&(v.get=o),K(o=s.set)&&(v.set=o),K(o=s.init)&&g.unshift(o));return d||ui(e,i),v&&ni(i,n,v),p?d^4?a:v:i},pi=(e,t,n)=>t.has(e)||G(`Cannot `+n),mi=(e,t)=>Object(t)===t?e.has(t):G(`Cannot use the "in" operator on this value`),hi=(e,t,n)=>(pi(e,t,`read from private field`),n?n.call(e):t.get(e)),gi=(e,t,n,r)=>(pi(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),_i=(e,t,n)=>(pi(e,t,`access private method`),n),vi,yi,bi,xi=1;vi=[h(`demo-todo-section`)];var Si=class extends (bi=f){static styles=u`
		.demo-todo-list {
			list-style: none;
			margin: 0;
			padding: 0;
		}

		.demo-todo-item {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			padding: 0.5rem 0;
			border-bottom: 1px solid var(--std-sys-color-outline-variant);
		}

		.demo-todo-item:last-child {
			border-bottom: none;
		}

		.demo-todo-item span.done {
			text-decoration: line-through;
			color: var(--std-sys-color-on-surface-variant);
		}

		.demo-todo-item button.tonal {
			padding: 0.35rem 0.65rem;
			min-width: 2.25rem;
		}

		.demo-todo-form {
			display: flex;
			gap: 0.75rem;
			margin-top: 1rem;
		}

		.demo-todo-form .demo-outlined-field {
			flex: 1;
		}
	`;todos=s([{id:xi++,text:`Read the std-ui docs`,done:!0},{id:xi++,text:`Build a demo app`,done:!1}]);template(){let e=this.todos(),t=n(()=>this.todos().filter(e=>!e.done).length)();return i`
			<h2>Putting it together: a tiny todo list</h2>
			<p class="desc">A realistic composition of <code>state()</code>, list rendering, and event bindings — no framework, no virtual DOM.</p>
			<p>${t} remaining of ${e.length}</p>
			<ul class="demo-todo-list">
				${e.map(e=>i`
					<li class="demo-todo-item">
						<input type="checkbox" .checked=${e.done} @change=${()=>this.#e(e.id)} />
						<span class=${e.done?`done`:``}>${e.text}</span>
						<button type="button" class="tonal" style="margin-left:auto;" @click=${()=>this.#t(e.id)}>✕</button>
					</li>
				`)}
			</ul>
			<form class="demo-todo-form" @submit=${e=>this.#n(e)}>
				<input class="demo-outlined-field" type="text" name="text" placeholder="new todo" />
				<button type="submit">add</button>
			</form>
		`}#e(e){this.todos.set(this.todos().map(t=>t.id===e?{...t,done:!t.done}:t))}#t(e){this.todos.set(this.todos().filter(t=>t.id!==e))}#n(e){e.preventDefault();let t=e.currentTarget,n=t.elements.namedItem(`text`).value.trim();n&&(this.todos.set([...this.todos(),{id:xi++,text:n,done:!1}]),t.reset())}};yi=si(bi),Si=fi(yi,0,`DemoTodoSection`,vi,Si),di(yi,1,Si);var Ci=Object.create,wi=Object.defineProperty,Ti=Object.getOwnPropertyDescriptor,Ei=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),q=e=>{throw TypeError(e)},Di=(e,t,n)=>t in e?wi(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Oi=(e,t)=>wi(e,`name`,{value:t,configurable:!0}),ki=e=>[,,,Ci(e?.[Ei(`metadata`)]??null)],Ai=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],ji=e=>e!==void 0&&typeof e!=`function`?q(`Function expected`):e,Mi=(e,t,n,r,i)=>({kind:Ai[e],name:t,metadata:r,addInitializer:e=>n._?q(`Already initialized`):i.push(ji(e||null))}),Ni=(e,t)=>Di(t,Ei(`metadata`),e[3]),Pi=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},Fi=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=Ai[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&Ti(d<4?i:{get[n](){return Ri(this,a)},set[n](e){return zi(this,a,e)}},n));d?p&&d<4&&Oi(a,(d>2?`set `:d>1?`get `:``)+n):Oi(i,n);for(var y=r.length-1;y>=0;y--)l=Mi(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>Li(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Ri:Bi)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>zi(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?ji(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?q(`Object expected`):(ji(o=s.get)&&(v.get=o),ji(o=s.set)&&(v.set=o),ji(o=s.init)&&g.unshift(o));return d||Ni(e,i),v&&wi(i,n,v),p?d^4?a:v:i},Ii=(e,t,n)=>t.has(e)||q(`Cannot `+n),Li=(e,t)=>Object(t)===t?e.has(t):q(`Cannot use the "in" operator on this value`),Ri=(e,t,n)=>(Ii(e,t,`read from private field`),n?n.call(e):t.get(e)),zi=(e,t,n,r)=>(Ii(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Bi=(e,t,n)=>(Ii(e,t,`access private method`),n),Vi=[h(`demo-map-by-key-section`)],Hi,Ui,Wi=class extends (Ui=f){static styles=u`
		.demo-chore-list {
			list-style: none;
			margin: 0;
			padding: 0;
		}

		.demo-chore-item {
			padding: 0.5rem 0;
			border-bottom: 1px solid var(--std-sys-color-outline-variant);
		}

		.demo-chore-item:last-child {
			border-bottom: none;
		}

		.demo-chore-item label {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			cursor: pointer;
		}
	`;chores=s([{id:`wash`,label:`Wash dishes`},{id:`mail`,label:`Check mail`},{id:`walk`,label:`Walk the dog`},{id:`read`,label:`Read a chapter`}]);template(){let e=this.chores();return i`
			<h2>Keyed lists (<code>mapByKey</code>)</h2>
			<p class="desc">
				Sort the chores, then check a box and sort again — the checkbox stays with the same chore because rows are keyed by <code>id</code>, not list index. The todo section above uses a plain <code>.map()</code> (positional).
			</p>
			<div class="demo-actions">
				<button type="button" @click=${()=>this.sortByLabel(1)}>A → Z</button>
				<button type="button" class="tonal" @click=${()=>this.sortByLabel(-1)}>Z → A</button>
			</div>
			<ul class="demo-chore-list">
				${p(e,e=>e.id,e=>i`
						<li class="demo-chore-item" data-id=${e.id}>
							<label>
								<input type="checkbox" />
								<span>${e.id}) ${e.label}</span>
							</label>
						</li>
					`)}
			</ul>
		`}sortByLabel(e){this.chores.set([...this.chores()].sort((t,n)=>t.label.localeCompare(n.label)*e))}};Hi=ki(Ui),Wi=Fi(Hi,0,`DemoMapByKeySection`,Vi,Wi),Pi(Hi,1,Wi);var Gi=Object.create,Ki=Object.defineProperty,qi=Object.getOwnPropertyDescriptor,Ji=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),Yi=e=>{throw TypeError(e)},Xi=(e,t,n)=>t in e?Ki(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Zi=(e,t)=>Ki(e,`name`,{value:t,configurable:!0}),Qi=e=>[,,,Gi(e?.[Ji(`metadata`)]??null)],$i=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],ea=e=>e!==void 0&&typeof e!=`function`?Yi(`Function expected`):e,ta=(e,t,n,r,i)=>({kind:$i[e],name:t,metadata:r,addInitializer:e=>n._?Yi(`Already initialized`):i.push(ea(e||null))}),na=(e,t)=>Xi(t,Ji(`metadata`),e[3]),ra=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},ia=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=$i[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&qi(d<4?i:{get[n](){return sa(this,a)},set[n](e){return ca(this,a,e)}},n));d?p&&d<4&&Zi(a,(d>2?`set `:d>1?`get `:``)+n):Zi(i,n);for(var y=r.length-1;y>=0;y--)l=ta(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>oa(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?sa:la)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>ca(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?ea(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?Yi(`Object expected`):(ea(o=s.get)&&(v.get=o),ea(o=s.set)&&(v.set=o),ea(o=s.init)&&g.unshift(o));return d||na(e,i),v&&Ki(i,n,v),p?d^4?a:v:i},aa=(e,t,n)=>t.has(e)||Yi(`Cannot `+n),oa=(e,t)=>Object(t)===t?e.has(t):Yi(`Cannot use the "in" operator on this value`),sa=(e,t,n)=>(aa(e,t,`read from private field`),n?n.call(e):t.get(e)),ca=(e,t,n,r)=>(aa(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),la=(e,t,n)=>(aa(e,t,`access private method`),n),ua,da,fa,pa=[40,120,200],ma=e=>i`<circle r="20" cx="${e}" cy="40" fill="tomato"></circle>`,ha=t=>e`<circle r="20" cx="${t}" cy="40" fill="seagreen"></circle>`;ua=[h(`demo-svg-section`)];var ga=class extends (fa=f){report=s(``);template(){return i`
			<h2>SVG fragments (<code>svg</code>)</h2>
			<p class="desc">
				The HTML parser only creates SVG elements inside an <code>&lt;svg&gt;</code>. A fragment such as
				<code>&lt;circle&gt;</code> written with <code>t</code> has no <code>&lt;svg&gt;</code> ancestor in its own
				string, so it becomes an <code>HTMLUnknownElement</code> and nothing is drawn - even when it is later
				placed inside a real <code>&lt;svg&gt;</code>. Use <code>svg</code> for fragments that will be embedded into an
				existing <code>&lt;svg&gt;</code>. A complete <code>&lt;svg&gt;...&lt;/svg&gt;</code> works with plain <code>t</code>.
			</p>
			<div class="demo-actions">
				<div style="background:#fce8e6;border:1px solid #ea4335;border-radius:12px;padding:0.5rem 1rem">
					<p style="color:#c5221f;font-weight:500">&#10008; <code>t</code> fragment - not drawn</p>
					<svg id="svg-plain" width="240" height="80" style="border:1px solid #888">${pa.map(ma)}</svg>
				</div>
				<div style="background:#e6f4ea;border:1px solid #34a853;border-radius:12px;padding:0.5rem 1rem">
					<p style="color:#137333;font-weight:500">&#10004; <code>svg</code> fragment - drawn</p>
					<svg id="svg-tag" width="240" height="80" style="border:1px solid #888">${pa.map(ha)}</svg>
				</div>
			</div>
			<pre style="white-space:pre-wrap;font-size:0.8rem">${this.report()}</pre>
		`}firstUpdated(){requestAnimationFrame(()=>this.report.set(this.describe()))}describe(){let e=e=>[...this.querySelectorAll(`#${e} circle`)].map(e=>{let t=e.getBoundingClientRect();return`  ${e.constructor.name} ns=${e.namespaceURI} size=${t.width}x${t.height}`});return`t:
${e(`svg-plain`).join(`
`)}

svg:
${e(`svg-tag`).join(`
`)}`}};da=Qi(fa),ga=ia(da,0,`DemoSvgSection`,ua,ga),ra(da,1,ga);var _a=Object.create,va=Object.defineProperty,ya=Object.getOwnPropertyDescriptor,ba=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),xa=e=>{throw TypeError(e)},Sa=(e,t,n)=>t in e?va(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Ca=(e,t)=>va(e,`name`,{value:t,configurable:!0}),wa=e=>[,,,_a(e?.[ba(`metadata`)]??null)],Ta=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],Ea=e=>e!==void 0&&typeof e!=`function`?xa(`Function expected`):e,Da=(e,t,n,r,i)=>({kind:Ta[e],name:t,metadata:r,addInitializer:e=>n._?xa(`Already initialized`):i.push(Ea(e||null))}),Oa=(e,t)=>Sa(t,ba(`metadata`),e[3]),ka=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},Aa=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=Ta[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&ya(d<4?i:{get[n](){return Na(this,a)},set[n](e){return Pa(this,a,e)}},n));d?p&&d<4&&Ca(a,(d>2?`set `:d>1?`get `:``)+n):Ca(i,n);for(var y=r.length-1;y>=0;y--)l=Da(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>Ma(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Na:Fa)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Pa(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?Ea(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?xa(`Object expected`):(Ea(o=s.get)&&(v.get=o),Ea(o=s.set)&&(v.set=o),Ea(o=s.init)&&g.unshift(o));return d||Oa(e,i),v&&va(i,n,v),p?d^4?a:v:i},ja=(e,t,n)=>t.has(e)||xa(`Cannot `+n),Ma=(e,t)=>Object(t)===t?e.has(t):xa(`Cannot use the "in" operator on this value`),Na=(e,t,n)=>(ja(e,t,`read from private field`),n?n.call(e):t.get(e)),Pa=(e,t,n,r)=>(ja(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Fa=(e,t,n)=>(ja(e,t,`access private method`),n),Ia,La,Ra,J=e=>a`<mi>${e}</mi>`,Y=e=>a`<mn>${e}</mn>`,X=e=>a`<mo>${e}</mo>`,Z=(...e)=>a`<mrow>${e}</mrow>`,za=(e,t)=>a`<mfrac>${Z(e)}${Z(t)}</mfrac>`,Ba=e=>a`<msqrt>${e}</msqrt>`,Q=(e,t)=>a`<msup>${Z(e)}${Z(t)}</msup>`,Va=(e,t)=>a`<msub>${Z(e)}${Z(t)}</msub>`,Ha=(e,t,n)=>a`<mrow><munderover><mo>&sum;</mo>${Z(e)}${Z(t)}</munderover>${n}</mrow>`,Ua=(e,t,n)=>a`<mrow><msubsup><mo>&int;</mo>${Z(e)}${Z(t)}</msubsup>${n}</mrow>`,Wa=e=>a`<mrow><mo>(</mo><mtable>${e.map(e=>a`<mtr>${e.map(e=>a`<mtd>${e}</mtd>`)}</mtr>`)}</mtable><mo>)</mo></mrow>`,Ga=(e,t)=>i`<mfrac><mi>${e}</mi><mi>${t}</mi></mfrac>`,Ka=e=>Number.isInteger(e)?String(e):e.toFixed(3);Ia=[h(`demo-mathml-section`)];var qa=class extends (Ra=f){a=s(1);b=s(-3);c=s(2);report=s(``);template(){let[e,t,n]=[this.a(),this.b(),this.c()],r=t*t-4*e*n,o=a`<math display="block">
			${J(`x`)}${X(`=`)}
			${za([X(`−`),J(`b`),X(`±`),Ba([Q(J(`b`),Y(2)),X(`−`),Y(4),J(`a`),J(`c`)])],[Y(2),J(`a`)])}
		</math>`,s=e===0?`a must not be 0`:r>=0?`x\u2081 = ${Ka((-t+Math.sqrt(r))/(2*e))},  x\u2082 = ${Ka((-t-Math.sqrt(r))/(2*e))}`:`x = ${Ka(-t/(2*e))} \xB1 ${Ka(Math.sqrt(-r)/(2*e))}i`;return i`
			<h2>MathML fragments (<code>math</code>)</h2>
			<p class="desc">
				Same parser rule as SVG: only an open <code>&lt;math&gt;</code> switches the HTML parser to the MathML
				namespace. A fragment such as <code>&lt;mi&gt;</code> written with <code>t</code> becomes an
				<code>HTMLUnknownElement</code> and is not typeset, even when later placed inside a real
				<code>&lt;math&gt;</code>. With <code>math</code> you can build small reusable pieces
				(<code>frac</code>, <code>sqrt</code>, <code>sup</code>, <code>sum</code>, <code>matrix</code>, ...) and nest them
				freely; drag the sliders and the formulas below re-render in place.
			</p>

			<div class="demo-actions">
				<label>a = ${e} <input type="range" min="-5" max="5" step="1" .value=${String(e)} @input=${e=>this.a.set(+e.target.value)} /></label>
				<label>b = ${t} <input type="range" min="-10" max="10" step="1" .value=${String(t)} @input=${e=>this.b.set(+e.target.value)} /></label>
				<label>c = ${n} <input type="range" min="-10" max="10" step="1" .value=${String(n)} @input=${e=>this.c.set(+e.target.value)} /></label>
			</div>

			<div style="background:#e6f4ea;border:1px solid #34a853;border-radius:12px;padding:0.5rem 1rem;margin:1rem 0">
			<p style="color:#137333;font-weight:500">&#10004; <code>math</code> fragments - typeset</p>
			<h3>Quadratic formula</h3>
			<div id="math-rich" style="font-size:1.6rem">
				${o}
				<math display="block">
					${Z(J(`a`),Q(J(`x`),Y(2)),X(`+`),J(`b`),J(`x`),X(`+`),J(`c`),X(`=`),Y(0))}
					<mspace width="2em"></mspace>
					${Z(J(`a`),X(`=`),Y(e),X(`,`),J(`b`),X(`=`),Y(t),X(`,`),J(`c`),X(`=`),Y(n))}
				</math>
			</div>
			<p>Discriminant <strong>${Ka(r)}</strong> &rarr; <strong>${s}</strong></p>

			<h3>Matrix and determinant</h3>
			<div style="font-size:1.6rem">
				<math display="block">
					${Z(J(`M`),X(`=`),Wa([[Y(e),Y(t)],[Y(t),Y(n)]]),X(`,`),Ja())}
					${Z(J(`det`),X(`⁡`),J(`M`),X(`=`),J(`a`),J(`c`),X(`−`),Q(J(`b`),Y(2)),X(`=`),Y(e*n-t*t))}
				</math>
			</div>

			<h3>Sums and integrals</h3>
			<div style="font-size:1.6rem">
				<math display="block">
					${Z(Ha([J(`n`),X(`=`),Y(1)],X(`∞`),za(Y(1),Q(J(`n`),Y(2)))),X(`=`),za(Q(J(`π`),Y(2)),Y(6)))}
				</math>
				<math display="block">
					${Z(Ua(X(`−∞`),X(`∞`),[Q(J(`e`),Z(X(`−`),Q(J(`x`),Y(2)))),J(`d`),J(`x`)]),X(`=`),Ba(J(`π`)))}
				</math>
				<math display="block">
					${Z(Va(J(`F`),J(`n`)),X(`=`),za(Q(Z(X(`(`),Y(1),X(`+`),Ba(Y(5)),X(`)`)),J(`n`)),Z(Q(Y(2),J(`n`)),Ba(Y(5)))))}
				</math>
			</div>

			</div>

			<div style="background:#fce8e6;border:1px solid #ea4335;border-radius:12px;padding:0.5rem 1rem;margin:1rem 0">
				<p style="color:#c5221f;font-weight:500">&#10008; plain <code>t</code> fragment - not typeset</p>
				<div style="font-size:1.6rem">
					<math id="math-plain">${Ga(`a`,`b`)}</math>
					<small>&larr; a/b should render as a fraction, but renders nothing</small>
				</div>
			</div>
			<pre style="white-space:pre-wrap;font-size:0.8rem">${this.report()}</pre>
		`}firstUpdated(){requestAnimationFrame(()=>this.report.set(this.describe()))}describe(){let e=e=>{let t=new Map;for(let n of this.querySelectorAll(e)){let e=`${n.constructor.name} (${n.namespaceURI})`;t.set(e,(t.get(e)??0)+1)}return[...t].map(([e,t])=>`  ${t} x ${e}`).join(`
`)};return`plain t, elements under #math-plain:
${e(`#math-plain *`)}

math, elements under #math-rich:
${e(`#math-rich *`)}`}};La=wa(Ra),qa=Aa(La,0,`DemoMathmlSection`,Ia,qa),ka(La,1,qa);function Ja(){return a`<mspace width="2em"></mspace>`}var Ya=`// Demonstrates: \`state\`/\`computed\`, \`UIElement.template()\` re-rendering on signal change,\r
// \`@click\` event binding, \`?disabled\` boolean-attribute binding.\r
import { tag, t, UIElement } from '@std-ui/core';\r
import { state, computed } from '@std-ui/core';\r
\r
const count = state(0);\r
const label = computed(() => (count() < 2 ? 'click' : 'clicks'));\r
\r
@tag('demo-counter-section')\r
export class DemoCounterSection extends UIElement {\r
	protected override template() {\r
		return t\`\r
			<h2>Signals + templates</h2>\r
			<p class="desc"><code>state</code>, <code>computed</code>, <code>html</code>/<code>render</code> — the template re-renders in place whenever a read signal changes.</p>\r
			<p><strong>\${count()}</strong> \${label()}</p>\r
			<div class="demo-actions">\r
				<button type="button" @click=\${() => count.update(n => n + 1)}>+1</button>\r
				<button type="button" class="tonal" @click=\${() => count.set(0)} ?disabled=\${count() === 0}>reset</button>\r
			</div>\r
		\`;\r
	}\r
}\r
`,Xa=`// Demonstrates: \`@attribute()\` (attribute <-> property sync, with \`reflect: true\`) vs. a plain \`state()\` field\r
// (store-backed, no attribute at all).\r
import { tag, t, UIElement, attribute, state, css } from '@std-ui/core';\r
\r
@tag('demo-attribute-section')\r
export class DemoAttributeSection extends UIElement {\r
	static override styles = css\`\r
		:host([theme='dark']) {\r
			background: var(--std-sys-color-inverse-surface);\r
			border-color: var(--std-sys-color-outline);\r
			color: var(--std-sys-color-inverse-on-surface);\r
		}\r
		:host([theme='dark']) :is(h2, p) {\r
			color: var(--std-sys-color-inverse-on-surface);\r
		}\r
		:host([theme='dark']) p.desc {\r
			opacity: 0.88;\r
		}\r
		:host([theme='dark']) code {\r
			background: rgb(255 255 255 / 0.12);\r
			color: inherit;\r
		}\r
	\`;\r
	// Parsed from the \`theme\`/\`count\` attributes on first connect (and whenever changed from\r
	// outside); writes also reflect back onto the attribute since \`reflect: true\`.\r
	@attribute({ type: String, reflect: true }) readonly theme = state('light');\r
	@attribute({ reflect: true }) readonly count = state(0);\r
\r
	// Store-backed, but never touches an attribute — purely internal UI state.\r
	readonly expanded = state(false);\r
\r
	protected override template() {\r
		return t\`\r
			<h2>Attributes vs. state</h2>\r
			<p class="desc"><code>@attribute({ reflect: true })</code> mirrors to/from the host's HTML attributes (inspect <code>&lt;demo-attribute-section&gt;</code> in devtools). Toggling <code>theme</code> flips this card via <code>:host([theme="dark"])</code> in <code>static styles</code> — not the whole page (see Context). <code>state()</code> alone stays JS-only.</p>\r
			<p>\r
				theme=<code>\${this.theme()}</code>,\r
				count=<code>\${this.count()}</code>\r
			</p>\r
			<div class="demo-actions">\r
				<button type="button" @click=\${() => this.theme.update(t => t === 'light' ? 'dark' : 'light')}>toggle theme attribute</button>\r
				<button type="button" class="tonal" @click=\${() => this.count.update(n => n + 1)}>increment count attribute</button>\r
				<button type="button" class="text" @click=\${() => this.expanded.set(!this.expanded())}>\${this.expanded() ? 'hide' : 'show'} internal-only state</button>\r
			</div>\r
			\${this.expanded() ? t\`<p><em>This line comes from a plain <code>state()</code> — it never appears as an attribute.</em></p>\` : ''}\r
		\`;\r
	}\r
}\r
`,Za=`// Demonstrates: \`createContextKey\`, \`@provide(key)\` / \`@consume(key)\` (read) —\r
// a descendant reads an ancestor's reactive value with no prop-drilling.\r
import { tag, t, UIElement, state } from '@std-ui/core';\r
import { consume, provide, createContextKey } from '@std-ui/ext';\r
\r
interface Theme { mode: 'light' | 'dark'; }\r
const ThemeKey = createContextKey<Theme>('demo-theme');\r
\r
@tag('demo-theme-child')\r
class DemoThemeChild extends UIElement {\r
	@consume(ThemeKey) readonly theme!: Theme; // reads as the plain value; decorator-free: defineElement(..., { consume: { theme: ThemeKey } })\r
\r
	protected override template() {\r
		return t\`<p>Child reads context: mode = <strong>\${this.theme.mode}</strong></p>\`;\r
	}\r
}\r
\r
@tag('demo-context-section')\r
export class DemoContextSection extends UIElement {\r
	@provide(ThemeKey) readonly theme = state<Theme>({ mode: 'light' });\r
\r
	protected override template() {\r
		return t\`\r
			<h2>Context</h2>\r
			<p class="desc"><code>@provide(ThemeKey)</code> on this element provides <code>ThemeKey</code>; the nested <code>&lt;demo-theme-child&gt;</code> below reads it via <code>@consume(ThemeKey)</code> with no attributes/props passed through markup.</p>\r
			<div class="demo-actions">\r
				<button type="button" @click="\${() => this.theme.set({ mode: this.theme().mode === 'light' ? 'dark' : 'light' })}">toggle (parent)</button>\r
			</div>\r
			<demo-theme-child></demo-theme-child>\r
		\`;\r
	}\r
}\r
`,Qa=`// Demonstrates: \`@query()\`/\`@queryAll()\` (light-DOM selector accessors) and \`firstUpdated()\` +\r
// \`this.effect()\` for imperatively patching a node outside the template's own re-render.\r
import { tag, t, UIElement, state, query, queryAll } from '@std-ui/core';
\r
@tag('demo-query-section')\r
export class DemoQuerySection extends UIElement {\r
	readonly items = state(['alpha', 'beta', 'gamma']);\r
\r
	@query('input') input!: HTMLInputElement | null;\r
	@queryAll('li') listItems!: NodeListOf<HTMLLIElement>;\r
\r
	protected override template() {\r
		return t\`\r
			<h2>Queries</h2>\r
			<p class="desc"><code>@query()</code> / <code>@queryAll()</code> resolve <code>this.querySelector(All)</code> on demand; <code>firstUpdated()</code> + <code>this.effect()</code> patch a node (the <code>.badge</code> span) directly.</p>\r
			<input class="demo-outlined-field" type="text" placeholder="add an item, press Enter" @keydown=\${(e: KeyboardEvent) => this.#onKeydown(e)} />\r
			<span class="demo-badge badge"></span>\r
			<ul>\r
				\${this.items().map(item => t\`<li>\${item}</li>\`)}\r
			</ul>\r
			<div class="demo-actions">\r
				<button type="button" @click=\${() => this.input?.focus()}>focus input via @query</button>\r
				<button type="button" class="tonal" @click=\${() => console.log('@queryAll() <li> count:', this.listItems.length)}>log &lt;li&gt; count (console)</button>\r
			</div>\r
		\`;\r
	}\r
\r
	protected override firstUpdated(): void {\r
		const badge = this.querySelector('.badge') as HTMLElement;\r
		this.effect(() => {\r
			const n = this.items().length;\r
			badge.textContent = \`\${n} item\${n === 1 ? '' : 's'}\`;\r
		});\r
	}\r
\r
	#onKeydown(e: KeyboardEvent): void {\r
		if (e.key !== 'Enter') return;\r
		const value = this.input?.value.trim();\r
		if (!value) return;\r
		this.items.set([...this.items(), value]);\r
		if (this.input) this.input.value = '';\r
	}\r
}\r
`,$a=`// Demonstrates: \`static shadowRootOptions\`, encapsulated styles, \`@query()\` against \`renderRoot\`.\r
import { css, tag, t, UIElement, state, query } from '@std-ui/core';
\r
@tag('demo-shadow-chip')\r
export class DemoShadowChip extends UIElement {\r
	static override shadowRootOptions = { mode: 'open' } as const;\r
\r
	readonly on = state(false);\r
\r
	@query('button') toggle!: HTMLButtonElement | null;\r
\r
	protected override template() {\r
		return t\`\r
			<style>\r
				:host { display: inline-block; }\r
				button {\r
					font: inherit;\r
					font-weight: 500;\r
					font-size: 0.875rem;\r
					padding: 0.625rem 1.5rem;\r
					border-radius: 9999px;\r
					border: none;\r
					background: var(--std-sys-color-primary, #6750a4);\r
					color: var(--std-sys-color-on-primary, #fff);\r
					cursor: pointer;\r
					box-shadow: 0 1px 2px rgb(0 0 0 / 0.3), 0 1px 3px 1px rgb(0 0 0 / 0.15);\r
				}\r
				button[data-off] {\r
					background: var(--std-sys-color-surface-container-highest, #e6e0e9);\r
					color: var(--std-sys-color-on-surface-variant, #49454f);\r
					box-shadow: none;\r
				}\r
			</style>\r
			<button\r
				type="button"\r
				data-off=\${this.on() ? null : ''}\r
				@click=\${() => this.on.set(!this.on())}\r
			>\r
				\${this.on() ? 'Encapsulated (shadow)' : 'Click — themed only inside shadow'}\r
			</button>\r
		\`;\r
	}\r
\r
	protected override updated(): void {\r
		if (this.on() && this.toggle) this.toggle.focus();\r
	}\r
}\r
\r
@tag('demo-shadow-section')\r
export class DemoShadowSection extends UIElement {\r
	static override styles = css\`\r
		p {\r
			display: flex;\r
			flex-wrap: wrap;\r
			gap: 0.75rem;\r
			align-items: center;\r
		}\r
	\`;\r
\r
	protected override template() {\r
		return t\`\r
			<h2>Shadow DOM</h2>\r
			<p class="desc">\r
				Set <code>static shadowRootOptions</code> on a <code>UIElement</code> subclass —\r
				<code>template()</code> renders into <code>shadowRoot</code>; <code>@query()</code> searches\r
				<code>renderRoot</code>, not the light DOM host.\r
			</p>\r
			<p>\r
				The chip uses shadow-only Std-styled rules. Global <code>button</code> styles from\r
				<code>demo-components.css</code> do not reach it — compare with the page button beside it.\r
			</p>\r
			<p>\r
				<demo-shadow-chip></demo-shadow-chip>\r
				<button type="button">ordinary page button</button>\r
			</p>\r
		\`;\r
	}\r
}\r
`,eo=`// Demonstrates: \`css\` tagged templates + \`static styles\` — shadow-DOM \`adoptedStyleSheets\` vs.\r
// light-DOM \`@scope (tag-name)\` (shared once across every instance, not re-parsed per instance).\r
import { css, tag, t, UIElement, state } from '@std-ui/core';\r
\r
// Shared by every \`demo-css-chip\` instance via \`adoptedStyleSheets\` — one \`CSSStyleSheet\`, never\r
// re-parsed, and naturally scoped by the shadow boundary, so \`:host\` is used as-is.\r
const chipStyles = css\`\r
	:host { display: inline-flex; }\r
	button {\r
		font: inherit;\r
		font-weight: 500;\r
		font-size: 0.875rem;\r
		padding: 0.625rem 1.5rem;\r
		border-radius: 9999px;\r
		border: none;\r
		background: var(--std-sys-color-tertiary, #7d5260);\r
		color: var(--std-sys-color-on-tertiary, #fff);\r
		cursor: pointer;\r
	}\r
\`;\r
\r
@tag('demo-css-chip')\r
export class DemoCssChip extends UIElement {\r
	static override shadowRootOptions = { mode: 'open' } as const;\r
	static override styles = chipStyles;\r
\r
	readonly count = state(0);\r
\r
	protected override template() {\r
		return t\`<button type="button" @click=\${() => this.count.update(n => n + 1)}>clicked \${this.count()}×</button>\`;\r
	}\r
}\r
\r
// Shared by every \`demo-css-badge\` instance too — but there's no shadow root to hold an\r
// \`adoptedStyleSheets\` list, so this one sheet is instead adopted onto \`document\`, once per tag\r
// name, wrapped in \`@scope (demo-css-badge) { ... }\`. \`:host\` is rewritten to \`:scope\` under the\r
// hood so this literal reads the same either way — see \`src/element/template/tag-funcs/css/css.md\`.\r
const badgeStyles = css\`\r
	:host {\r
		display: inline-block;\r
		margin: 0 0.35rem 0.35rem 0;\r
		padding: 0.2rem 0.65rem;\r
		font-size: 0.75rem;\r
		font-weight: 500;\r
		border-radius: var(--std-shape-corner-full, 9999px);\r
		background: var(--std-sys-color-tertiary-container, #ffd8e4);\r
		color: var(--std-sys-color-on-tertiary-container, #31101d);\r
	}\r
\`;\r
\r
@tag('demo-css-badge')\r
export class DemoCssBadge extends UIElement {\r
	static override styles = badgeStyles;\r
}\r
\r
@tag('demo-css-section')\r
export class DemoCssSection extends UIElement {\r
	protected override template() {\r
		return t\`\r
			<h2>CSS templates</h2>\r
			<p class="desc">\r
				<code>css\\\`...\\\`</code> tags a literal as CSS (cached, composable, rejects raw strings —\r
				use <code>unsafeCss()</code> to opt in). <code>static styles</code> on a\r
				<code>UIElement</code> applies it as a real <code>CSSStyleSheet</code>: adopted via\r
				<code>adoptedStyleSheets</code> for a shadow root (shared by reference, one instance\r
				below), or — with no shadow boundary to hold it — adopted onto <code>document</code>\r
				once per tag, wrapped in <code>@scope (tag-name)</code> so it still can't leak to\r
				unrelated markup, no matter how many instances share it.\r
			</p>\r
			<p>\r
				<demo-css-chip></demo-css-chip>\r
				<demo-css-chip></demo-css-chip>\r
			</p>\r
			<p class="desc">\r
				Five <code>&lt;demo-css-badge&gt;</code> light-DOM instances below share a single\r
				<code>@scope</code>-wrapped stylesheet on <code>document</code> — open devtools and\r
				check <code>document.adoptedStyleSheets</code> (or a fallback <code>&lt;style&gt;</code>\r
				in <code>&lt;head&gt;</code>) for exactly one entry mentioning <code>demo-css-badge</code>.\r
			</p>\r
			<p>\r
				\${[1, 2, 3, 4, 5].map(n => t\`<demo-css-badge>badge \${n}</demo-css-badge>\`)}\r
			</p>\r
		\`;\r
	}\r
}\r
`,to=`// Demonstrates: \`classMap\` / \`styleMap\` attribute directives, and \`unsafeHtml\`.\r
import { tag, t, UIElement, unsafeHtml, state } from '@std-ui/core';\r
import { classMap, styleMap } from '@std-ui/core';\r
\r
@tag('demo-directives-section')\r
export class DemoDirectivesSection extends UIElement {\r
	readonly active = state(false);\r
	readonly big = state(false);\r
\r
	protected override template() {\r
		const classes = { active: this.active(), 'demo-box': true };\r
		const styles = {\r
			padding: this.big() ? '1.5rem' : '0.75rem',\r
			fontSize: this.big() ? '1.125rem' : '1rem',\r
			transition: 'all 150ms ease',\r
		};\r
\r
		return t\`\r
			<h2>Directives</h2>\r
			<p class="desc"><code>classMap</code> toggles individual classes via <code>classList</code>; <code>styleMap</code> sets individual inline style properties - both can coexist with static text/other classes in the same attribute; <code>unsafeHtml</code> injects raw markup (trusted input only).</p>\r
			<div class="\${classMap(classes)} demo-box" style=\${styleMap(styles)}>\r
				classMap + styleMap controlled box (mixed with static "class"/"style" text)\r
			</div>\r
			<div class="demo-actions">\r
				<button type="button" @click=\${() => this.active.set(!this.active())}>toggle active class</button>\r
				<button type="button" class="tonal" @click=\${() => this.big.set(!this.big())}>toggle size style</button>\r
			</div>\r
			<div>\${unsafeHtml('<em>rendered via <code>unsafeHtml</code></em>')}</div>\r
		\`;\r
	}\r
}\r
`,no=`// Demonstrates: event modifiers (\`@click.once\`, \`.prevent\`, \`.stop\`, \`.self\`, \`.stop-immediate\`)\r
// and single-entry bindings (\`class.name\`, \`style.prop\`).\r
import { tag, t, css, UIElement, state, withEventOptions } from '@std-ui/core';\r
// Registers the \`class.name\` / \`style.prop\` bindings used below.\r
import '@std-ui/ext';\r
\r
@tag('demo-bindings-section')\r
export class DemoBindingsSection extends UIElement {\r
	static override styles = css\`\r
		.demo-self {\r
			display: inline-flex;\r
			align-items: center;\r
			gap: 0.5rem;\r
			padding: 0.5rem 0.75rem;\r
			border: 1px dashed var(--std-sys-color-outline);\r
			border-radius: var(--std-shape-corner-small, 8px);\r
		}\r
\r
		.demo-log {\r
			margin: 0.75rem 0 0;\r
			min-height: 5.5em;\r
			padding: 0.5rem 0.75rem;\r
			font-family: 'Roboto Mono', ui-monospace, monospace;\r
			font-size: 0.8rem;\r
			background: var(--std-sys-color-surface-container-high);\r
			border-radius: 4px;\r
			white-space: pre-wrap;\r
		}\r
	\`;\r
\r
	readonly active = state(false);\r
	readonly hue = state(210);\r
	readonly log = state<string[]>([]);\r
\r
	private note(message: string) {\r
		this.log.set([message, ...this.log()].slice(0, 6));\r
	}\r
\r
	// Handlers carrying an \`options\` property: \`addEventListener\` options without modifiers.\r
	// With std-ui-ext (imported above) they override anything set by \`.capture\` / \`.once\` / \`.passive\`.\r
	private readonly onceHandler = Object.assign(\r
		() => this.note('handler.options { once }: fired (and removed)'),\r
		{ options: { once: true } satisfies AddEventListenerOptions },\r
	);\r
	private readonly captureHandler = withEventOptions(\r
		() => this.note('handler.options { capture }: runs BEFORE the inner click'),\r
		{ capture: true }\r
	);\r
	// \`.once\` modifier is overridden by \`options.once = false\`: keeps firing.\r
	private readonly overrideHandler = withEventOptions(\r
		() => this.note('modifier .once overridden by options { once: false }: still firing'),\r
		{ once: false }\r
	);\r
\r
	protected override template() {\r
		return t\`\r
			<h2>Binding modifiers</h2>\r
			<p class="desc">\r
				<code>@event.modifier</code> adds <code>once</code>, <code>prevent</code>, <code>stop</code>,\r
				<code>stop-immediate</code> and <code>self</code> without handler boilerplate.\r
				<code>class.name</code> / <code>style.prop</code> bind one class or style property and leave the rest alone.\r
			</p>\r
\r
			<div class="demo-actions">\r
				<button type="button" @click.once=\${() => this.note('@click.once: fired (and removed)')}>\r
					@click.once\r
				</button>\r
				<form @submit.prevent=\${() => this.note('@submit.prevent: no page reload')}>\r
					<button type="submit" class="tonal">@submit.prevent</button>\r
				</form>\r
			</div>\r
\r
			<div class="demo-actions" @click=\${() => this.note('outer: reached the parent')}>\r
				<button type="button" @click.stop=\${() => this.note('@click.stop: parent not notified')}>\r
					@click.stop\r
				</button>\r
				<button type="button" @click=\${() => this.note('plain click: bubbles to the parent')}>\r
					plain click\r
				</button>\r
				<span\r
					class="demo-self"\r
					@click.self=\${() => this.note('@click.self: clicked the span itself')}\r
				>\r
					@click.self <button type="button" class="tonal">inner (ignored)</button>\r
				</span>\r
			</div>\r
\r
			<div class="demo-actions">\r
				<button type="button" @click=\${this.onceHandler}>handler.options once</button>\r
				<span class="demo-self" @click=\${this.captureHandler}>\r
					capture on parent\r
					<button type="button" class="tonal" @click=\${() => this.note('inner click')}>inner</button>\r
				</span>\r
				<button type="button" @click.once=\${this.overrideHandler}>.once overridden by options</button>\r
			</div>\r
\r
			<div class="demo-actions">\r
				<button\r
					type="button"\r
					class.active=\${this.active()}\r
					style.background=\${this.active() ? \`hsl(\${this.hue()} 70% 45%)\` : null}\r
					style.color=\${this.active() ? 'white' : null}\r
					style.--hue=\${this.hue()}\r
					@click=\${() => this.active.set(!this.active())}\r
				>\r
					class.active + style.background\r
				</button>\r
				<label>\r
					hue\r
					<input\r
						type="range"\r
						min="0"\r
						max="360"\r
						.value=\${this.hue()}\r
						@input=\${(e: Event) => this.hue.set(Number((e.target as HTMLInputElement).value))}\r
					/>\r
				</label>\r
			</div>\r
\r
			<pre class="demo-log">\${this.log().join('\\n') || 'events log here'}</pre>\r
		\`;\r
	}\r
}\r
`,ro=`// Demonstrates: event extensions (\`@input.debounce:300\`, \`@keyup.ctrl+enter.ctrl+y\`).
import { tag, t, UIElement, state } from '@std-ui/core';
// Registers the \`@event.modifier\` binding and its extensions.
import '@std-ui/ext';

@tag('demo-event-extensions-section')
export class DemoEventExtensionsSection extends UIElement {
	readonly typed = state('');
	readonly debounced = state('');
	readonly combos = state<string[]>([]);

	protected override template() {
		return t\`
			<h2>Event extensions</h2>
			<p class="desc">
				<code>@input.debounce:300</code> runs the handler once typing pauses.
				<code>@keyup.ctrl+enter.ctrl+y</code> runs only for Ctrl+Enter or ctrl+y.
			</p>

			<div class="demo-actions">
				<input
					placeholder="type quickly..."
					@input=\${(e: Event) => this.typed.set((e.target as HTMLInputElement).value)}
					@input.debounce:300=\${(e: Event) => this.debounced.set((e.target as HTMLInputElement).value)}
				/>
				<span>live: \${this.typed()} | debounced: \${this.debounced()}</span>
			</div>

			<div class="demo-actions">
				<input
					placeholder="focus, press Ctrl+Enter or ctrl+y"
					@keyup.ctrl+enter.ctrl+y=\${(e: KeyboardEvent) =>
						this.combos.set([\`\${e.ctrlKey ? 'Ctrl+' : ''}\${e.shiftKey ? 'Shift+' : ''}\${e.key}\`, ...this.combos()].slice(0, 5))}
				/>
			</div>

			<pre class="demo-log">\${this.combos().join('\\n') || 'matching combos log here'}</pre>
		\`;
	}
}
`,io=`// Pulls several features together in one realistic component: \`state()\` with a plain-object\r
// value (tree-backed, per-leaf reactivity), list rendering, \`computed\`, and event handlers.\r
import { css, tag, t, UIElement, state } from '@std-ui/core';\r
import { computed } from '@std-ui/core';\r
\r
interface Todo { id: number; text: string; done: boolean; }\r
\r
let nextId = 1;\r
\r
@tag('demo-todo-section')\r
export class DemoTodoSection extends UIElement {\r
	static override styles = css\`\r
		.demo-todo-list {\r
			list-style: none;\r
			margin: 0;\r
			padding: 0;\r
		}\r
\r
		.demo-todo-item {\r
			display: flex;\r
			align-items: center;\r
			gap: 0.75rem;\r
			padding: 0.5rem 0;\r
			border-bottom: 1px solid var(--std-sys-color-outline-variant);\r
		}\r
\r
		.demo-todo-item:last-child {\r
			border-bottom: none;\r
		}\r
\r
		.demo-todo-item span.done {\r
			text-decoration: line-through;\r
			color: var(--std-sys-color-on-surface-variant);\r
		}\r
\r
		.demo-todo-item button.tonal {\r
			padding: 0.35rem 0.65rem;\r
			min-width: 2.25rem;\r
		}\r
\r
		.demo-todo-form {\r
			display: flex;\r
			gap: 0.75rem;\r
			margin-top: 1rem;\r
		}\r
\r
		.demo-todo-form .demo-outlined-field {\r
			flex: 1;\r
		}\r
	\`;\r
\r
	readonly todos = state<Todo[]>([\r
		{ id: nextId++, text: 'Read the std-ui docs', done: true },\r
		{ id: nextId++, text: 'Build a demo app', done: false },\r
	]);\r
\r
	protected override template() {\r
		const todos = this.todos();\r
		const remaining = computed(() => this.todos().filter(t => !t.done).length)();\r
\r
		return t\`\r
			<h2>Putting it together: a tiny todo list</h2>\r
			<p class="desc">A realistic composition of <code>state()</code>, list rendering, and event bindings — no framework, no virtual DOM.</p>\r
			<p>\${remaining} remaining of \${todos.length}</p>\r
			<ul class="demo-todo-list">\r
				\${todos.map(todo => t\`\r
					<li class="demo-todo-item">\r
						<input type="checkbox" .checked=\${todo.done} @change=\${() => this.#toggle(todo.id)} />\r
						<span class=\${todo.done ? 'done' : ''}>\${todo.text}</span>\r
						<button type="button" class="tonal" style="margin-left:auto;" @click=\${() => this.#remove(todo.id)}>✕</button>\r
					</li>\r
				\`)}\r
			</ul>\r
			<form class="demo-todo-form" @submit=\${(e: Event) => this.#onSubmit(e)}>\r
				<input class="demo-outlined-field" type="text" name="text" placeholder="new todo" />\r
				<button type="submit">add</button>\r
			</form>\r
		\`;\r
	}\r
\r
	#toggle(id: number): void {\r
		this.todos.set(this.todos().map(t => (t.id === id ? { ...t, done: !t.done } : t)));\r
	}\r
\r
	#remove(id: number): void {\r
		this.todos.set(this.todos().filter(t => t.id !== id));\r
	}\r
\r
	#onSubmit(e: Event): void {\r
		e.preventDefault();\r
		const form = e.currentTarget as HTMLFormElement;\r
		const input = form.elements.namedItem('text') as HTMLInputElement;\r
		const text = input.value.trim();\r
		if (!text) return;\r
		this.todos.set([...this.todos(), { id: nextId++, text, done: false }]);\r
		form.reset();\r
	}\r
}\r
`,ao=`// Demonstrates: \`mapByKey\` — keyed list reconciliation when the list store changes order.\r
import { css, tag, t, UIElement, mapByKey, state } from '@std-ui/core';\r
\r
type Chore = { id: string; label: string };\r
\r
@tag('demo-map-by-key-section')\r
export class DemoMapByKeySection extends UIElement {\r
	static override styles = css\`\r
		.demo-chore-list {\r
			list-style: none;\r
			margin: 0;\r
			padding: 0;\r
		}\r
\r
		.demo-chore-item {\r
			padding: 0.5rem 0;\r
			border-bottom: 1px solid var(--std-sys-color-outline-variant);\r
		}\r
\r
		.demo-chore-item:last-child {\r
			border-bottom: none;\r
		}\r
\r
		.demo-chore-item label {\r
			display: flex;\r
			align-items: center;\r
			gap: 0.75rem;\r
			cursor: pointer;\r
		}\r
	\`;\r
\r
	readonly chores = state<Chore[]>([\r
		{ id: 'wash', label: 'Wash dishes' },\r
		{ id: 'mail', label: 'Check mail' },\r
		{ id: 'walk', label: 'Walk the dog' },\r
		{ id: 'read', label: 'Read a chapter' },\r
	]);\r
\r
	protected override template() {\r
		const chores = this.chores();\r
		return t\`\r
			<h2>Keyed lists (<code>mapByKey</code>)</h2>\r
			<p class="desc">\r
				Sort the chores, then check a box and sort again — the checkbox stays with the same chore because rows are keyed by <code>id</code>, not list index. The todo section above uses a plain <code>.map()</code> (positional).\r
			</p>\r
			<div class="demo-actions">\r
				<button type="button" @click=\${() => this.sortByLabel(1)}>A → Z</button>\r
				<button type="button" class="tonal" @click=\${() => this.sortByLabel(-1)}>Z → A</button>\r
			</div>\r
			<ul class="demo-chore-list">\r
				\${mapByKey(\r
					chores,\r
					(c: Chore) => c.id,\r
					(c: Chore) => t\`\r
						<li class="demo-chore-item" data-id=\${c.id}>\r
							<label>\r
								<input type="checkbox" />\r
								<span>\${c.id}) \${c.label}</span>\r
							</label>\r
						</li>\r
					\`,\r
				)}\r
			</ul>\r
		\`;\r
	}\r
\r
	private sortByLabel(dir: 1 | -1): void {\r
		this.chores.set([...this.chores()].sort((a, b) => a.label.localeCompare(b.label) * dir));\r
	}\r
}\r
`,oo=`// Demonstrates: the \`svg\` tag — embedding SVG *fragments* (no \`<svg>\` ancestor in the template string).\r
import { tag, t, svg, state, UIElement } from '@std-ui/core';\r
\r
const xs = [40, 120, 200];\r
\r
// Plain \`t\`: \`<circle>\` is parsed as HTML -> HTMLUnknownElement, never drawn.\r
const plainCircle = (x: number) => t\`<circle r="20" cx="\${x}" cy="40" fill="tomato"></circle>\`;\r
// \`svg\`: parsed in the SVG namespace -> SVGCircleElement, drawn.\r
const svgCircle = (x: number) => svg\`<circle r="20" cx="\${x}" cy="40" fill="seagreen"></circle>\`;\r
\r
@tag('demo-svg-section')\r
export class DemoSvgSection extends UIElement {\r
	readonly report = state('');\r
\r
	protected override template() {\r
		return t\`\r
			<h2>SVG fragments (<code>svg</code>)</h2>\r
			<p class="desc">\r
				The HTML parser only creates SVG elements inside an <code>&lt;svg&gt;</code>. A fragment such as\r
				<code>&lt;circle&gt;</code> written with <code>t</code> has no <code>&lt;svg&gt;</code> ancestor in its own\r
				string, so it becomes an <code>HTMLUnknownElement</code> and nothing is drawn - even when it is later\r
				placed inside a real <code>&lt;svg&gt;</code>. Use <code>svg</code> for fragments that will be embedded into an\r
				existing <code>&lt;svg&gt;</code>. A complete <code>&lt;svg&gt;...&lt;/svg&gt;</code> works with plain <code>t</code>.\r
			</p>\r
			<div class="demo-actions">\r
				<div style="background:#fce8e6;border:1px solid #ea4335;border-radius:12px;padding:0.5rem 1rem">\r
					<p style="color:#c5221f;font-weight:500">&#10008; <code>t</code> fragment - not drawn</p>\r
					<svg id="svg-plain" width="240" height="80" style="border:1px solid #888">\${xs.map(plainCircle)}</svg>\r
				</div>\r
				<div style="background:#e6f4ea;border:1px solid #34a853;border-radius:12px;padding:0.5rem 1rem">\r
					<p style="color:#137333;font-weight:500">&#10004; <code>svg</code> fragment - drawn</p>\r
					<svg id="svg-tag" width="240" height="80" style="border:1px solid #888">\${xs.map(svgCircle)}</svg>\r
				</div>\r
			</div>\r
			<pre style="white-space:pre-wrap;font-size:0.8rem">\${this.report()}</pre>\r
		\`;\r
	}\r
\r
	protected override firstUpdated(): void {\r
		// Layout sizes are only available once the browser has laid out the rendered SVG.\r
		requestAnimationFrame(() => this.report.set(this.describe()));\r
	}\r
\r
	private describe(): string {\r
		const lines = (id: string) =>\r
			[...this.querySelectorAll(\`#\${id} circle\`)].map((c) => {\r
				const r = c.getBoundingClientRect();\r
				return \`  \${c.constructor.name} ns=\${c.namespaceURI} size=\${r.width}x\${r.height}\`;\r
			});\r
		return \`t:\\n\${lines('svg-plain').join('\\n')}\\n\\nsvg:\\n\${lines('svg-tag').join('\\n')}\`;\r
	}\r
}\r
`,so=`// Demonstrates: the \`math\` tag — composing MathML from small reusable *fragments* (no \`<math>\` ancestor in\r
// each template string): fractions, roots, superscripts, sums, integrals and matrices, driven by live state.\r
import { tag, t, math, state, UIElement } from '@std-ui/core';\r
\r
// --- Reusable MathML fragments (each is parsed in the MathML namespace) -----------------------------\r
const mi = (x: string) => math\`<mi>\${x}</mi>\`;\r
const mn = (x: number | string) => math\`<mn>\${x}</mn>\`;\r
const mo = (x: string) => math\`<mo>\${x}</mo>\`;\r
const row = (...xs: unknown[]) => math\`<mrow>\${xs}</mrow>\`;\r
const frac = (num: unknown, den: unknown) => math\`<mfrac>\${row(num)}\${row(den)}</mfrac>\`;\r
const sqrt = (x: unknown) => math\`<msqrt>\${x}</msqrt>\`;\r
const sup = (base: unknown, exp: unknown) => math\`<msup>\${row(base)}\${row(exp)}</msup>\`;\r
const sub = (base: unknown, s: unknown) => math\`<msub>\${row(base)}\${row(s)}</msub>\`;\r
const sum = (from: unknown, to: unknown, body: unknown) =>\r
	math\`<mrow><munderover><mo>&sum;</mo>\${row(from)}\${row(to)}</munderover>\${body}</mrow>\`;\r
const integral = (from: unknown, to: unknown, body: unknown) =>\r
	math\`<mrow><msubsup><mo>&int;</mo>\${row(from)}\${row(to)}</msubsup>\${body}</mrow>\`;\r
const matrix = (rows: unknown[][]) =>\r
	math\`<mrow><mo>(</mo><mtable>\${rows.map(\r
		(r) => math\`<mtr>\${r.map((c) => math\`<mtd>\${c}</mtd>\`)}</mtr>\`,\r
	)}</mtable><mo>)</mo></mrow>\`;\r
\r
// What a plain \`t\` fragment does instead: HTMLUnknownElement, not typeset.\r
const plainFrac = (n: string, d: string) => t\`<mfrac><mi>\${n}</mi><mi>\${d}</mi></mfrac>\`;\r
\r
const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(3));\r
\r
@tag('demo-mathml-section')\r
export class DemoMathmlSection extends UIElement {\r
	readonly a = state(1);\r
	readonly b = state(-3);\r
	readonly c = state(2);\r
	readonly report = state('');\r
\r
	protected override template() {\r
		const [a, b, c] = [this.a(), this.b(), this.c()];\r
		const disc = b * b - 4 * a * c;\r
\r
		// x = (-b ± sqrt(b^2 - 4ac)) / 2a, built from fragments\r
		const quadratic = math\`<math display="block">\r
			\${mi('x')}\${mo('=')}\r
			\${frac(\r
				[mo('\\u2212'), mi('b'), mo('\\u00b1'), sqrt([sup(mi('b'), mn(2)), mo('\\u2212'), mn(4), mi('a'), mi('c')])],\r
				[mn(2), mi('a')],\r
			)}\r
		</math>\`;\r
\r
		// the same formula with this page's coefficients substituted\r
		const roots =\r
			a === 0\r
				? 'a must not be 0'\r
				: disc >= 0\r
					? \`x\\u2081 = \${fmt((-b + Math.sqrt(disc)) / (2 * a))},  x\\u2082 = \${fmt((-b - Math.sqrt(disc)) / (2 * a))}\`\r
					: \`x = \${fmt(-b / (2 * a))} \\u00b1 \${fmt(Math.sqrt(-disc) / (2 * a))}i\`;\r
\r
		return t\`\r
			<h2>MathML fragments (<code>math</code>)</h2>\r
			<p class="desc">\r
				Same parser rule as SVG: only an open <code>&lt;math&gt;</code> switches the HTML parser to the MathML\r
				namespace. A fragment such as <code>&lt;mi&gt;</code> written with <code>t</code> becomes an\r
				<code>HTMLUnknownElement</code> and is not typeset, even when later placed inside a real\r
				<code>&lt;math&gt;</code>. With <code>math</code> you can build small reusable pieces\r
				(<code>frac</code>, <code>sqrt</code>, <code>sup</code>, <code>sum</code>, <code>matrix</code>, ...) and nest them\r
				freely; drag the sliders and the formulas below re-render in place.\r
			</p>\r
\r
			<div class="demo-actions">\r
				<label>a = \${a} <input type="range" min="-5" max="5" step="1" .value=\${String(a)} @input=\${(e: Event) => this.a.set(+(e.target as HTMLInputElement).value)} /></label>\r
				<label>b = \${b} <input type="range" min="-10" max="10" step="1" .value=\${String(b)} @input=\${(e: Event) => this.b.set(+(e.target as HTMLInputElement).value)} /></label>\r
				<label>c = \${c} <input type="range" min="-10" max="10" step="1" .value=\${String(c)} @input=\${(e: Event) => this.c.set(+(e.target as HTMLInputElement).value)} /></label>\r
			</div>\r
\r
			<div style="background:#e6f4ea;border:1px solid #34a853;border-radius:12px;padding:0.5rem 1rem;margin:1rem 0">\r
			<p style="color:#137333;font-weight:500">&#10004; <code>math</code> fragments - typeset</p>\r
			<h3>Quadratic formula</h3>\r
			<div id="math-rich" style="font-size:1.6rem">\r
				\${quadratic}\r
				<math display="block">\r
					\${row(mi('a'), sup(mi('x'), mn(2)), mo('+'), mi('b'), mi('x'), mo('+'), mi('c'), mo('='), mn(0))}\r
					<mspace width="2em"></mspace>\r
					\${row(mi('a'), mo('='), mn(a), mo(','), mi('b'), mo('='), mn(b), mo(','), mi('c'), mo('='), mn(c))}\r
				</math>\r
			</div>\r
			<p>Discriminant <strong>\${fmt(disc)}</strong> &rarr; <strong>\${roots}</strong></p>\r
\r
			<h3>Matrix and determinant</h3>\r
			<div style="font-size:1.6rem">\r
				<math display="block">\r
					\${row(mi('M'), mo('='), matrix([[mn(a), mn(b)], [mn(b), mn(c)]]), mo(','), mspaceRow())}\r
					\${row(mi('det'), mo('\\u2061'), mi('M'), mo('='), mi('a'), mi('c'), mo('\\u2212'), sup(mi('b'), mn(2)), mo('='), mn(a * c - b * b))}\r
				</math>\r
			</div>\r
\r
			<h3>Sums and integrals</h3>\r
			<div style="font-size:1.6rem">\r
				<math display="block">\r
					\${row(sum([mi('n'), mo('='), mn(1)], mo('\\u221e'), frac(mn(1), sup(mi('n'), mn(2)))), mo('='), frac(sup(mi('\\u03c0'), mn(2)), mn(6)))}\r
				</math>\r
				<math display="block">\r
					\${row(integral(mo('\\u2212\\u221e'), mo('\\u221e'), [sup(mi('e'), row(mo('\\u2212'), sup(mi('x'), mn(2)))), mi('d'), mi('x')]), mo('='), sqrt(mi('\\u03c0')))}\r
				</math>\r
				<math display="block">\r
					\${row(sub(mi('F'), mi('n')), mo('='), frac(sup(row(mo('('), mn(1), mo('+'), sqrt(mn(5)), mo(')')), mi('n')), row(sup(mn(2), mi('n')), sqrt(mn(5)))))}\r
				</math>\r
			</div>\r
\r
			</div>\r
\r
			<div style="background:#fce8e6;border:1px solid #ea4335;border-radius:12px;padding:0.5rem 1rem;margin:1rem 0">\r
				<p style="color:#c5221f;font-weight:500">&#10008; plain <code>t</code> fragment - not typeset</p>\r
				<div style="font-size:1.6rem">\r
					<math id="math-plain">\${plainFrac('a', 'b')}</math>\r
					<small>&larr; a/b should render as a fraction, but renders nothing</small>\r
				</div>\r
			</div>\r
			<pre style="white-space:pre-wrap;font-size:0.8rem">\${this.report()}</pre>\r
		\`;\r
	}\r
\r
	protected override firstUpdated(): void {\r
		requestAnimationFrame(() => this.report.set(this.describe()));\r
	}\r
\r
	private describe(): string {\r
		const count = (selector: string) => {\r
			const tally = new Map<string, number>();\r
			for (const el of this.querySelectorAll(selector)) {\r
				const key = \`\${el.constructor.name} (\${el.namespaceURI})\`;\r
				tally.set(key, (tally.get(key) ?? 0) + 1);\r
			}\r
			return [...tally].map(([k, n]) => \`  \${n} x \${k}\`).join('\\n');\r
		};\r
		return \`plain t, elements under #math-plain:\\n\${count('#math-plain *')}\\n\\nmath, elements under #math-rich:\\n\${count('#math-rich *')}\`;\r
	}\r
}\r
\r
function mspaceRow() {\r
	return math\`<mspace width="2em"></mspace>\`;\r
}\r
`,co=Object.create,lo=Object.defineProperty,uo=Object.getOwnPropertyDescriptor,fo=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),po=e=>{throw TypeError(e)},mo=(e,t,n)=>t in e?lo(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,ho=(e,t)=>lo(e,`name`,{value:t,configurable:!0}),go=e=>[,,,co(e?.[fo(`metadata`)]??null)],_o=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],vo=e=>e!==void 0&&typeof e!=`function`?po(`Function expected`):e,yo=(e,t,n,r,i)=>({kind:_o[e],name:t,metadata:r,addInitializer:e=>n._?po(`Already initialized`):i.push(vo(e||null))}),bo=(e,t)=>mo(t,fo(`metadata`),e[3]),xo=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},So=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=_o[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&uo(d<4?i:{get[n](){return To(this,a)},set[n](e){return Eo(this,a,e)}},n));d?p&&d<4&&ho(a,(d>2?`set `:d>1?`get `:``)+n):ho(i,n);for(var y=r.length-1;y>=0;y--)l=yo(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>wo(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?To:Do)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Eo(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?vo(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?po(`Object expected`):(vo(o=s.get)&&(v.get=o),vo(o=s.set)&&(v.set=o),vo(o=s.init)&&g.unshift(o));return d||bo(e,i),v&&lo(i,n,v),p?d^4?a:v:i},Co=(e,t,n)=>t.has(e)||po(`Cannot `+n),wo=(e,t)=>Object(t)===t?e.has(t):po(`Cannot use the "in" operator on this value`),To=(e,t,n)=>(Co(e,t,`read from private field`),n?n.call(e):t.get(e)),Eo=(e,t,n,r)=>(Co(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Do=(e,t,n)=>(Co(e,t,`access private method`),n),Oo,ko,Ao,$=(e,t)=>({[e]:t});Oo=[h(`demo-feature-page`)];var jo=class extends (Ao=f){template(){return i`
			<code-preview id="counter" .files=${$(`counter-section.ts`,Ya)}>
				<demo-counter-section></demo-counter-section>
			</code-preview>
			<code-preview id="attribute" .files=${$(`attribute-section.ts`,Xa)}>
				<demo-attribute-section theme="light" count="3"></demo-attribute-section>
			</code-preview>
			<code-preview id="context" .files=${$(`context-section.ts`,Za)}>
				<demo-context-section></demo-context-section>
			</code-preview>
			<code-preview id="query" .files=${$(`query-section.ts`,Qa)}>
				<demo-query-section></demo-query-section>
			</code-preview>
			<code-preview id="shadow" .files=${$(`shadow-section.ts`,$a)}>
				<demo-shadow-section></demo-shadow-section>
			</code-preview>
			<code-preview id="css" .files=${$(`css-section.ts`,eo)}>
				<demo-css-section></demo-css-section>
			</code-preview>
			<code-preview id="directives" .files=${$(`directives-section.ts`,to)}>
				<demo-directives-section></demo-directives-section>
			</code-preview>
			<code-preview id="bindings" .files=${$(`bindings-section.ts`,no)}>
				<demo-bindings-section></demo-bindings-section>
			</code-preview>
			<code-preview id="event-extensions" .files=${$(`event-extensions-section.ts`,ro)}>
				<demo-event-extensions-section></demo-event-extensions-section>
			</code-preview>
			<code-preview id="todo" .files=${$(`todo-section.ts`,io)}>
				<demo-todo-section></demo-todo-section>
			</code-preview>
			<code-preview id="map-by-key" .files=${$(`map-by-key-section.ts`,ao)}>
				<demo-map-by-key-section></demo-map-by-key-section>
			</code-preview>
			<code-preview id="svg" .files=${$(`svg-section.ts`,oo)}>
				<demo-svg-section></demo-svg-section>
			</code-preview>
			<code-preview id="mathml" .files=${$(`mathml-section.ts`,so)}>
				<demo-mathml-section></demo-mathml-section>
			</code-preview>
		`}};ko=go(Ao),jo=So(ko,0,`DemoFeaturePage`,Oo,jo),xo(ko,1,jo);