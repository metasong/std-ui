import{D as e,U as t,b as n,d as r,j as i,m as a,y as o}from"./index-DsT9IMgw.js";import{a as s,c,i as l,n as u,r as d,t as f}from"./src-vkAovAHS.js";import{a as p,i as m,n as h,o as g,r as _,t as v}from"./range-control-DVcb85EW.js";import"./code-preview-BoRCt_Z-.js";var y=Object.create,ee=Object.defineProperty,te=Object.getOwnPropertyDescriptor,ne=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),b=e=>{throw TypeError(e)},re=(e,t,n)=>t in e?ee(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,ie=(e,t)=>ee(e,`name`,{value:t,configurable:!0}),ae=e=>[,,,y(e?.[ne(`metadata`)]??null)],oe=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],x=e=>e!==void 0&&typeof e!=`function`?b(`Function expected`):e,se=(e,t,n,r,i)=>({kind:oe[e],name:t,metadata:r,addInitializer:e=>n._?b(`Already initialized`):i.push(x(e||null))}),ce=(e,t)=>re(t,ne(`metadata`),e[3]),le=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},ue=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=oe[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&te(d<4?i:{get[n](){return pe(this,a)},set[n](e){return me(this,a,e)}},n));d?p&&d<4&&ie(a,(d>2?`set `:d>1?`get `:``)+n):ie(i,n);for(var y=r.length-1;y>=0;y--)l=se(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>fe(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?pe:he)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>me(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?x(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?b(`Object expected`):(x(o=s.get)&&(v.get=o),x(o=s.set)&&(v.set=o),x(o=s.init)&&g.unshift(o));return d||ce(e,i),v&&ee(i,n,v),p?d^4?a:v:i},de=(e,t,n)=>t.has(e)||b(`Cannot `+n),fe=(e,t)=>Object(t)===t?e.has(t):b(`Cannot use the "in" operator on this value`),pe=(e,t,n)=>(de(e,t,`read from private field`),n?n.call(e):t.get(e)),me=(e,t,n,r)=>(de(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),he=(e,t,n)=>(de(e,t,`access private method`),n),ge=[o(`demo-bind-form-section`)],_e,ve,ye=class extends (ve=a){search=n(`hello`);agreed=n(!1);renderPasses=n(0);template(){return t`
			<section class="demo-bind-block" id="form">
				<h2>Native form controls</h2>
				<p class="desc">
					<code>bind()</code> replaces <code>.value</code> + <code>@input</code>. Edits update the
					bound signal; other re-renders should not stomp the field while values stay in sync.
				</p>
				<label class="demo-bind-field">
					Text
					<input .value=${r(this.search)} type="text" />
				</label>
				<p class="demo-bind-mirror">Model: <code>${this.search()}</code></p>
				<label class="demo-bind-field demo-bind-field--inline">
					<input type="checkbox" .checked=${r(this.agreed)} />
					I agree
				</label>
				<p class="demo-bind-mirror">Agreed: <code>${String(this.agreed())}</code></p>
				<div class="demo-actions">
					<button type="button" @click=${()=>this.search.set(``)}>clear query from model</button>
					<button type="button" class="tonal" @click=${()=>this.renderPasses.update(e=>e+1)}>
						bump render counter (${this.renderPasses()})
					</button>
				</div>
			</section>
		`}};_e=ae(ve),ye=ue(_e,0,`DemoBindFormSection`,ge,ye),le(_e,1,ye);var be=Object.create,xe=Object.defineProperty,Se=Object.getOwnPropertyDescriptor,Ce=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),S=e=>{throw TypeError(e)},we=(e,t,n)=>t in e?xe(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Te=(e,t)=>xe(e,`name`,{value:t,configurable:!0}),Ee=e=>[,,,be(e?.[Ce(`metadata`)]??null)],De=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],C=e=>e!==void 0&&typeof e!=`function`?S(`Function expected`):e,Oe=(e,t,n,r,i)=>({kind:De[e],name:t,metadata:r,addInitializer:e=>n._?S(`Already initialized`):i.push(C(e||null))}),ke=(e,t)=>we(t,Ce(`metadata`),e[3]),Ae=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},je=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=De[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&Se(d<4?i:{get[n](){return Pe(this,a)},set[n](e){return Fe(this,a,e)}},n));d?p&&d<4&&Te(a,(d>2?`set `:d>1?`get `:``)+n):Te(i,n);for(var y=r.length-1;y>=0;y--)l=Oe(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>Ne(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Pe:Ie)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Fe(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?C(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?S(`Object expected`):(C(o=s.get)&&(v.get=o),C(o=s.set)&&(v.set=o),C(o=s.init)&&g.unshift(o));return d||ke(e,i),v&&xe(i,n,v),p?d^4?a:v:i},Me=(e,t,n)=>t.has(e)||S(`Cannot `+n),Ne=(e,t)=>Object(t)===t?e.has(t):S(`Cannot use the "in" operator on this value`),Pe=(e,t,n)=>(Me(e,t,`read from private field`),n?n.call(e):t.get(e)),Fe=(e,t,n,r)=>(Me(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Ie=(e,t,n)=>(Me(e,t,`access private method`),n),Le=[o(`demo-bind-knob`)],Re,ze,Be=class extends (ze=HTMLElement){#e=0;#t=null;get level(){return this.#e}set level(e){let t=Number(e);Number.isNaN(t)||(this.#e=t,this.#r())}connectedCallback(){if(this.childElementCount>0)return;let e=document.createElement(`button`);e.type=`button`,e.textContent=`−`;let t=document.createElement(`button`);t.type=`button`,t.textContent=`+`,this.#t=document.createElement(`span`),this.#t.className=`demo-bind-knob__readout`,e.addEventListener(`click`,()=>this.#n(-1)),t.addEventListener(`click`,()=>this.#n(1)),this.append(e,this.#t,t),this.#r()}#n(e){this.#e+=e,this.#r(),this.dispatchEvent(new Event(`level-change`,{bubbles:!0}))}#r(){this.#t&&(this.#t.textContent=`level ${this.#e}`)}};Re=Ee(ze),Be=je(Re,0,`DemoBindKnob`,Le,Be),Ae(Re,1,Be);var Ve=Object.create,He=Object.defineProperty,Ue=Object.getOwnPropertyDescriptor,We=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),w=e=>{throw TypeError(e)},Ge=(e,t,n)=>t in e?He(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Ke=(e,t)=>He(e,`name`,{value:t,configurable:!0}),qe=e=>[,,,Ve(e?.[We(`metadata`)]??null)],Je=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],T=e=>e!==void 0&&typeof e!=`function`?w(`Function expected`):e,Ye=(e,t,n,r,i)=>({kind:Je[e],name:t,metadata:r,addInitializer:e=>n._?w(`Already initialized`):i.push(T(e||null))}),Xe=(e,t)=>Ge(t,We(`metadata`),e[3]),Ze=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},Qe=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=Je[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&Ue(d<4?i:{get[n](){return tt(this,a)},set[n](e){return nt(this,a,e)}},n));d?p&&d<4&&Ke(a,(d>2?`set `:d>1?`get `:``)+n):Ke(i,n);for(var y=r.length-1;y>=0;y--)l=Ye(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>et(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?tt:rt)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>nt(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?T(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?w(`Object expected`):(T(o=s.get)&&(v.get=o),T(o=s.set)&&(v.set=o),T(o=s.init)&&g.unshift(o));return d||Xe(e,i),v&&He(i,n,v),p?d^4?a:v:i},$e=(e,t,n)=>t.has(e)||w(`Cannot `+n),et=(e,t)=>Object(t)===t?e.has(t):w(`Cannot use the "in" operator on this value`),tt=(e,t,n)=>($e(e,t,`read from private field`),n?n.call(e):t.get(e)),nt=(e,t,n,r)=>($e(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),rt=(e,t,n)=>($e(e,t,`access private method`),n),it=[o(`demo-bind-signal-knob`)],at,ot,st=class extends (ot=a){level=n(0);#e(e){this.level.update(t=>t+e),this.dispatchEvent(new Event(`level-change`,{bubbles:!0}))}template(){return t`
			<button type="button" @click=${()=>this.#e(-1)}>−</button>
			<span class="demo-bind-knob__readout">level ${this.level()}</span>
			<button type="button" @click=${()=>this.#e(1)}>+</button>
		`}};at=qe(ot),st=Qe(at,0,`DemoBindSignalKnob`,it,st),Ze(at,1,st);var ct=Object.create,lt=Object.defineProperty,ut=Object.getOwnPropertyDescriptor,dt=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),E=e=>{throw TypeError(e)},ft=(e,t,n)=>t in e?lt(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,pt=(e,t)=>lt(e,`name`,{value:t,configurable:!0}),mt=e=>[,,,ct(e?.[dt(`metadata`)]??null)],ht=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],D=e=>e!==void 0&&typeof e!=`function`?E(`Function expected`):e,gt=(e,t,n,r,i)=>({kind:ht[e],name:t,metadata:r,addInitializer:e=>n._?E(`Already initialized`):i.push(D(e||null))}),_t=(e,t)=>ft(t,dt(`metadata`),e[3]),vt=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},yt=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=ht[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&ut(d<4?i:{get[n](){return St(this,a)},set[n](e){return Ct(this,a,e)}},n));d?p&&d<4&&pt(a,(d>2?`set `:d>1?`get `:``)+n):pt(i,n);for(var y=r.length-1;y>=0;y--)l=gt(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>xt(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?St:wt)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Ct(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?D(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?E(`Object expected`):(D(o=s.get)&&(v.get=o),D(o=s.set)&&(v.set=o),D(o=s.init)&&g.unshift(o));return d||_t(e,i),v&&lt(i,n,v),p?d^4?a:v:i},bt=(e,t,n)=>t.has(e)||E(`Cannot `+n),xt=(e,t)=>Object(t)===t?e.has(t):E(`Cannot use the "in" operator on this value`),St=(e,t,n)=>(bt(e,t,`read from private field`),n?n.call(e):t.get(e)),Ct=(e,t,n,r)=>(bt(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),wt=(e,t,n)=>(bt(e,t,`access private method`),n),Tt=[o(`demo-bind-custom-section`)],Et,Dt,Ot=class extends (Dt=a){level=n(2);template(){return t`
			<section class="demo-bind-block" id="custom">
				<h2>Custom <code>.level</code></h2>
				<p class="desc">
					<code>&lt;demo-bind-knob&gt;</code> updates <code>.level</code> and bubbles
					<code>level-change</code> (the default for a property named <code>level</code>).
				</p>
				<demo-bind-knob .level=${r(this.level)}></demo-bind-knob>
				<p class="demo-bind-mirror">Parent <code>state()</code> level: <code>${this.level()}</code></p>
				<h3>Signal property</h3>
				<p class="desc">
					<code>&lt;demo-bind-signal-knob&gt;</code> exposes <code>.level</code> as a <code>state()</code>;
					<code>bind()</code> reads it with <code>()</code> and writes it with <code>.set()</code>.
				</p>
				<demo-bind-signal-knob .level=${r(this.level)}></demo-bind-signal-knob>
				<div class="demo-actions">
					<button type="button" @click=${()=>this.level.set(0)}>set parent level to 0</button>
					<button type="button" class="tonal" @click=${()=>this.level.update(e=>e+5)}>parent +5</button>
				</div>
			</section>
		`}};Et=mt(Dt),Ot=yt(Et,0,`DemoBindCustomSection`,Tt,Ot),vt(Et,1,Ot);var kt=Object.create,At=Object.defineProperty,jt=Object.getOwnPropertyDescriptor,Mt=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),O=e=>{throw TypeError(e)},Nt=(e,t,n)=>t in e?At(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Pt=(e,t)=>At(e,`name`,{value:t,configurable:!0}),Ft=e=>[,,,kt(e?.[Mt(`metadata`)]??null)],It=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],k=e=>e!==void 0&&typeof e!=`function`?O(`Function expected`):e,Lt=(e,t,n,r,i)=>({kind:It[e],name:t,metadata:r,addInitializer:e=>n._?O(`Already initialized`):i.push(k(e||null))}),Rt=(e,t)=>Nt(t,Mt(`metadata`),e[3]),zt=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},Bt=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=It[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&jt(d<4?i:{get[n](){return Ut(this,a)},set[n](e){return Wt(this,a,e)}},n));d?p&&d<4&&Pt(a,(d>2?`set `:d>1?`get `:``)+n):Pt(i,n);for(var y=r.length-1;y>=0;y--)l=Lt(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>Ht(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Ut:Gt)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Wt(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?k(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?O(`Object expected`):(k(o=s.get)&&(v.get=o),k(o=s.set)&&(v.set=o),k(o=s.init)&&g.unshift(o));return d||Rt(e,i),v&&At(i,n,v),p?d^4?a:v:i},Vt=(e,t,n)=>t.has(e)||O(`Cannot `+n),Ht=(e,t)=>Object(t)===t?e.has(t):O(`Cannot use the "in" operator on this value`),Ut=(e,t,n)=>(Vt(e,t,`read from private field`),n?n.call(e):t.get(e)),Wt=(e,t,n,r)=>(Vt(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Gt=(e,t,n)=>(Vt(e,t,`access private method`),n),Kt,qt,Jt,Yt=[`tomato`,`gold`,`seagreen`,`royalblue`];Kt=[o(`demo-bind-swatch`)];var Xt=class extends (Jt=HTMLElement){#e=Yt[0];#t=[];get color(){return this.#e}set color(e){this.#e=String(e),this.#n()}connectedCallback(){if(!(this.childElementCount>0)){for(let e of Yt){let t=document.createElement(`button`);t.type=`button`,t.title=e,t.style.cssText=`background:${e};width:1.5rem;height:1.5rem;border-radius:50%;margin-right:.25rem`,t.addEventListener(`click`,()=>{this.#e=e,this.#n(),this.dispatchEvent(new CustomEvent(`swatch-picked`,{bubbles:!0,detail:e}))}),this.#t.push(t),this.append(t)}this.#n()}}#n(){for(let e of this.#t)e.style.outline=e.title===this.#e?`2px solid currentColor`:`none`}};qt=Ft(Jt),Xt=Bt(qt,0,`DemoBindSwatch`,Kt,Xt),zt(qt,1,Xt);var Zt=Object.create,Qt=Object.defineProperty,$t=Object.getOwnPropertyDescriptor,en=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),A=e=>{throw TypeError(e)},tn=(e,t,n)=>t in e?Qt(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,nn=(e,t)=>Qt(e,`name`,{value:t,configurable:!0}),rn=e=>[,,,Zt(e?.[en(`metadata`)]??null)],an=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],j=e=>e!==void 0&&typeof e!=`function`?A(`Function expected`):e,on=(e,t,n,r,i)=>({kind:an[e],name:t,metadata:r,addInitializer:e=>n._?A(`Already initialized`):i.push(j(e||null))}),sn=(e,t)=>tn(t,en(`metadata`),e[3]),cn=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},ln=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=an[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&$t(d<4?i:{get[n](){return fn(this,a)},set[n](e){return pn(this,a,e)}},n));d?p&&d<4&&nn(a,(d>2?`set `:d>1?`get `:``)+n):nn(i,n);for(var y=r.length-1;y>=0;y--)l=on(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>dn(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?fn:mn)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>pn(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?j(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?A(`Object expected`):(j(o=s.get)&&(v.get=o),j(o=s.set)&&(v.set=o),j(o=s.init)&&g.unshift(o));return d||sn(e,i),v&&Qt(i,n,v),p?d^4?a:v:i},un=(e,t,n)=>t.has(e)||A(`Cannot `+n),dn=(e,t)=>Object(t)===t?e.has(t):A(`Cannot use the "in" operator on this value`),fn=(e,t,n)=>(un(e,t,`read from private field`),n?n.call(e):t.get(e)),pn=(e,t,n,r)=>(un(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),mn=(e,t,n)=>(un(e,t,`access private method`),n),hn=[o(`demo-bind-custom-event-section`)],gn,_n,vn=class extends (_n=a){color=n(`seagreen`);lastEvent=n(`(none yet)`);template(){return t`
			<section class="demo-bind-block" id="custom-event">
				<h2>Custom event</h2>
				<p class="desc">
					<code>&lt;demo-bind-swatch&gt;</code> has a <code>.color</code> property but fires
					<code>swatch-picked</code>, not the default <code>color-change</code>. Pass
					<code>{ event: 'swatch-picked' }</code> to <code>bind()</code>.
				</p>
				<demo-bind-swatch
					.color=${r(this.color,{event:`swatch-picked`})}
					@swatch-picked=${e=>this.lastEvent.set(String(e.detail))}
				></demo-bind-swatch>
				<p class="demo-bind-mirror">Model: <code>${this.color()}</code></p>
				<p class="demo-bind-mirror">Last <code>swatch-picked</code> detail: <code>${this.lastEvent()}</code></p>
				<div class="demo-actions">
					<button type="button" @click=${()=>this.color.set(`tomato`)}>set model to tomato</button>
					<button type="button" class="tonal" @click=${()=>this.color.set(`royalblue`)}>set model to royalblue</button>
				</div>
			</section>
		`}};gn=rn(_n),vn=ln(gn,0,`DemoBindCustomEventSection`,hn,vn),cn(gn,1,vn);function yn(e,t){let n=Array.isArray(t)?t:[t];if(!e&&n.length===1)return n[0];let r=e??(()=>!0),i=e=>{if(!r())return null;let t=[];for(let r of n){let n=r(e);n&&(Array.isArray(n)?t.push(...n):t.push(n))}return t};return n.some(e=>e.pending)&&(i.pending=e=>{if(!r())return!1;let t=!1;for(let r of n)r.pending?.(e)&&(t=!0);return t}),i}function bn(e,t=`At least ${e} characters`){return g(n=>n&&n.length<e?{flag:l.tooShort,message:t}:null,l.tooShort)}var xn=Object.create,Sn=Object.defineProperty,Cn=Object.getOwnPropertyDescriptor,wn=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),M=e=>{throw TypeError(e)},Tn=(e,t,n)=>t in e?Sn(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,En=(e,t)=>Sn(e,`name`,{value:t,configurable:!0}),Dn=e=>[,,,xn(e?.[wn(`metadata`)]??null)],On=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],N=e=>e!==void 0&&typeof e!=`function`?M(`Function expected`):e,kn=(e,t,n,r,i)=>({kind:On[e],name:t,metadata:r,addInitializer:e=>n._?M(`Already initialized`):i.push(N(e||null))}),An=(e,t)=>Tn(t,wn(`metadata`),e[3]),jn=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},Mn=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=On[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&Cn(d<4?i:{get[n](){return Fn(this,a)},set[n](e){return In(this,a,e)}},n));d?p&&d<4&&En(a,(d>2?`set `:d>1?`get `:``)+n):En(i,n);for(var y=r.length-1;y>=0;y--)l=kn(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>Pn(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Fn:Ln)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>In(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?N(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?M(`Object expected`):(N(o=s.get)&&(v.get=o),N(o=s.set)&&(v.set=o),N(o=s.init)&&g.unshift(o));return d||An(e,i),v&&Sn(i,n,v),p?d^4?a:v:i},Nn=(e,t,n)=>t.has(e)||M(`Cannot `+n),Pn=(e,t)=>Object(t)===t?e.has(t):M(`Cannot use the "in" operator on this value`),Fn=(e,t,n)=>(Nn(e,t,`read from private field`),n?n.call(e):t.get(e)),In=(e,t,n,r)=>(Nn(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Ln=(e,t,n)=>(Nn(e,t,`access private method`),n),Rn,zn,Bn,P=e=>t=>t?void 0:{flag:`valueMissing`,message:e},F=f(s(n({name:``,age:5})));F.name.check.validators.set([P(`Name is required`),e=>String(e).length>=3?void 0:{flag:`tooShort`,message:`At least 3 characters`}]),F.age.check.validators.set([e=>e>=2&&e<=8?void 0:{flag:`rangeOverflow`,message:`Age must be between 2 and 8`}]);var I=f(s(n({start:``,end:``})));I.start.check.validators.set([P(`Start required`)]),I.end.check.validators.set([P(`End required`)]);var L=f(s(n({first:``,last:``})));L.first.check.validators.set([P(`First name required`)]),L.last.check.validators.set([P(`Last name required`)]);var R=e=>e.check.errors().map(e=>e.message).join(`, `)||`none`;Rn=[o(`demo-bind-validation-section`)];var Vn=class extends (Bn=a){status=n(``);#e(e){let t=this.querySelector(e);if(!t)return;let n=Object.keys(ValidityState.prototype).filter(e=>e!==`valid`&&t.validity[e]);this.status.set([`checkValidity(): ${t.checkValidity()}`,`flags: ${n.join(`, `)||`(none)`}`,`validationMessage:`,t.validationMessage||`(empty)`].join(`
`))}template(){return t`
			<section class="demo-bind-block" id="validation">
				<h2>Validation</h2>
				<p class="desc">
					When the bound state has validators, <code>formBind()</code> copies its errors onto the target's
					constraint validation: <code>:invalid</code>, <code>validity</code>, <code>validationMessage</code>,
					<code>checkValidity()</code> and form submission follow the model. Plain <code>bind()</code> only
					syncs the value; for touched, readonly and disabled see the <em>Form UI</em> demo below.
				</p>

				<h3>1. Native controls</h3>
				<p class="desc">Only <code>customError</code> is available to script; the message carries the detail.</p>
				<label class="demo-bind-field">
					Name
					<input type="text" .value=${c(F.name)} />
				</label>
				<p class="demo-bind-mirror">Errors: <code>${R(F.name)}</code></p>
				<label class="demo-bind-field">
					Age
					<input type="number" .value=${c(F.age)} />
				</label>
				<p class="demo-bind-mirror">Errors: <code>${R(F.age)}</code></p>
				<div class="demo-actions">
					<button type="button" @click=${()=>F.name.set(``)}>clear name from model</button>
					<button type="button" class="tonal" @click=${()=>alert([...this.querySelectorAll(`input[type=text]:not([data-field]), input[type=number]`)].map(e=>e.checkValidity()?`valid`:e.validationMessage).join(`
`))}>
						checkValidity()
					</button>
				</div>

				<h3>2. FormElement: errors merged into one state</h3>
				<p class="desc">
					Both <code>.first</code> and <code>.last</code> report into the same host. The real flags
					(<code>valueMissing</code>…) are unioned, messages are grouped per property, and the single
					anchor is <code>validationAnchor</code> (the error icon on the right, shown once the host is touched
					and invalid). Fill only one: the host stays invalid for the other.
				</p>
				<demo-bind-merged id="merged" .first=${c(L.first)} .last=${c(L.last)}></demo-bind-merged>
				<p class="demo-bind-mirror">first: <code>${R(L.first)}</code> · last: <code>${R(L.last)}</code></p>
				<div class="demo-actions">
					<button type="button" class="tonal" @click=${()=>this.#e(`#merged`)}>inspect host validity</button>
					<button type="button" class="tonal" @click=${()=>this.querySelector(`#merged`)?.reportValidity()}>reportValidity()</button>
				</div>

				<h3>3. FormGroup: errors routed to inner controls</h3>
				<p class="desc">
					<code>validationErrorTarget(property)</code> links each bound property to the inner input that owns
					it. Each input gets its own validity and bubble; the host itself stays valid. Fill only
					<em>end</em>: <em>start</em> stays invalid. <code>reportValidity()</code> fires
					<code>invalid</code> on every routed input (both messages show) and leaves the bubble on the first.
				</p>
				<demo-bind-range id="range" .start=${c(I.start)} .end=${c(I.end)}></demo-bind-range>
				<p class="demo-bind-mirror">start: <code>${R(I.start)}</code> · end: <code>${R(I.end)}</code></p>
				<div class="demo-actions">
					<button type="button" class="tonal" @click=${()=>this.#e(`#range`)}>inspect host validity</button>
					<button type="button" class="tonal" @click=${()=>this.querySelector(`#range`)?.reportValidity()}>reportValidity()</button>
				</div>

				<pre class="demo-bind-mirror">${this.status()||`Press “inspect host validity” to see flags and message.`}</pre>
			</section>
		`}};zn=Dn(Bn),Vn=Mn(zn,0,`DemoBindValidationSection`,Rn,Vn),jn(zn,1,Vn);var Hn=Object.create,Un=Object.defineProperty,Wn=Object.getOwnPropertyDescriptor,Gn=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),z=e=>{throw TypeError(e)},Kn=(e,t,n)=>t in e?Un(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,qn=(e,t)=>Un(e,`name`,{value:t,configurable:!0}),Jn=e=>[,,,Hn(e?.[Gn(`metadata`)]??null)],Yn=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],B=e=>e!==void 0&&typeof e!=`function`?z(`Function expected`):e,Xn=(e,t,n,r,i)=>({kind:Yn[e],name:t,metadata:r,addInitializer:e=>n._?z(`Already initialized`):i.push(B(e||null))}),Zn=(e,t)=>Kn(t,Gn(`metadata`),e[3]),Qn=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},$n=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=Yn[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&Wn(d<4?i:{get[n](){return nr(this,a)},set[n](e){return rr(this,a,e)}},n));d?p&&d<4&&qn(a,(d>2?`set `:d>1?`get `:``)+n):qn(i,n);for(var y=r.length-1;y>=0;y--)l=Xn(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>tr(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?nr:ir)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>rr(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?B(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?z(`Object expected`):(B(o=s.get)&&(v.get=o),B(o=s.set)&&(v.set=o),B(o=s.init)&&g.unshift(o));return d||Zn(e,i),v&&Un(i,n,v),p?d^4?a:v:i},er=(e,t,n)=>t.has(e)||z(`Cannot `+n),tr=(e,t)=>Object(t)===t?e.has(t):z(`Cannot use the "in" operator on this value`),nr=(e,t,n)=>(er(e,t,`read from private field`),n?n.call(e):t.get(e)),rr=(e,t,n,r)=>(er(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),ir=(e,t,n)=>(er(e,t,`access private method`),n),ar,or,sr,V=n({vat:``,email:``,address:``}).with(s).with(f),H=n(!1);V.check.fields({vat:[yn(H,[p(`VAT number is required`),bn(8),m(/^[A-Z]{2}/,`Must start with 2 capital letters, e.g. DE123456789`)])],email:[p(`Email is required`),m(/@/,`Not an email address`)],address:[p(`Address is required`)]}),V.email.check.enabled.set(!1),V.address.formUi.disabled.own.set(!0);var cr=e=>e.check.errors()[0]?.message??``,lr=(e,n,r)=>t`<label class="demo-bind-field"><input type="checkbox" .checked=${n} @change=${e=>r(e.target.checked)} /> ${e}</label>`,ur=(e,n,r)=>t`
	<div style="border: 1px solid var(--outline, #cfcfcf); border-radius: 8px; padding: 12px 16px; margin: 12px 0">
		<div style="font-weight: 600">${e}</div>
		<small style="opacity: .6; display: block; margin-bottom: 8px">${n}</small>
		${r}
	</div>
`,dr=e=>t`<small style="color: var(--danger, #c62828); min-height: 1.2em; display: block">${cr(e)}</small>`;ar=[o(`demo-bind-conditional-section`)];var fr=class extends (sr=a){template(){return t`
			<section class="demo-bind-block" id="conditional">
				<h2>Conditional validation</h2>

				${ur(`when()`,`VAT rules apply only to companies. Switch the type.`,t`
				<div class="demo-actions">
					<button type="button" class=${H()?``:`tonal`} @click=${()=>H.set(!1)}>Personal</button>
					<button type="button" class=${H()?`tonal`:``} @click=${()=>H.set(!0)}>Company</button>
				</div>
				<label class="demo-bind-field">
					VAT number${H()?` *`:``}
					<input type="text" .value=${c(V.vat)} />
				</label>
				${dr(V.vat)}`)}

				${ur(`check.enabled`,`Email is checked only while this is on.`,t`
				${lr(`Notify me by email`,V.email.check.enabled(),e=>V.email.check.enabled.set(e))}
				<label class="demo-bind-field">
					Email
					<input type="text" .value=${c(V.email)} />
				</label>
				${dr(V.email)}`)}

				${ur(`formUi.disabled`,`A disabled input is not validated.`,t`
				${lr(`Ship to another address`,!V.address.formUi.disabled.own(),e=>V.address.formUi.disabled.own.set(!e))}
				<label class="demo-bind-field">
					Address
					<input type="text" .value=${c(V.address)} />
				</label>
				${dr(V.address)}`)}

				<div class="demo-actions">
					<button type="button" ?disabled=${!V.check.valid()}>Submit</button>
				</div>
			</section>
		`}};or=Jn(sr),fr=$n(or,0,`DemoBindConditionalSection`,ar,fr),Qn(or,1,fr);var pr=Object.create,mr=Object.defineProperty,hr=Object.getOwnPropertyDescriptor,gr=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),U=e=>{throw TypeError(e)},_r=(e,t,n)=>t in e?mr(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,vr=(e,t)=>mr(e,`name`,{value:t,configurable:!0}),yr=e=>[,,,pr(e?.[gr(`metadata`)]??null)],br=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],W=e=>e!==void 0&&typeof e!=`function`?U(`Function expected`):e,xr=(e,t,n,r,i)=>({kind:br[e],name:t,metadata:r,addInitializer:e=>n._?U(`Already initialized`):i.push(W(e||null))}),Sr=(e,t)=>_r(t,gr(`metadata`),e[3]),Cr=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},wr=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=br[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&hr(d<4?i:{get[n](){return Dr(this,a)},set[n](e){return Or(this,a,e)}},n));d?p&&d<4&&vr(a,(d>2?`set `:d>1?`get `:``)+n):vr(i,n);for(var y=r.length-1;y>=0;y--)l=xr(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>Er(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Dr:kr)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Or(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?W(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?U(`Object expected`):(W(o=s.get)&&(v.get=o),W(o=s.set)&&(v.set=o),W(o=s.init)&&g.unshift(o));return d||Sr(e,i),v&&mr(i,n,v),p?d^4?a:v:i},Tr=(e,t,n)=>t.has(e)||U(`Cannot `+n),Er=(e,t)=>Object(t)===t?e.has(t):U(`Cannot use the "in" operator on this value`),Dr=(e,t,n)=>(Tr(e,t,`read from private field`),n?n.call(e):t.get(e)),Or=(e,t,n,r)=>(Tr(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),kr=(e,t,n)=>(Tr(e,t,`access private method`),n),Ar,jr,Mr,G=n({tags:[`ab`],labels:{en:`Hello`,de:``},profile:{name:``,age:5}}).with(s);G.tags.check.eachValidators.set([p(`Tag is empty`),bn(3)]),G.labels.check.eachValidators.set([p(`Label is empty`)]),G.profile.check.fields({name:[p(`Name is required`),bn(3)],age:[e=>e>=18?void 0:{flag:`rangeUnderflow`,message:`Must be 18 or older`}]});var Nr=1,Pr=(e,n,r)=>t`
	<div style="border: 1px solid var(--outline, #cfcfcf); border-radius: 8px; padding: 12px 16px; margin: 12px 0">
		<div style="font-weight: 600">${e}</div>
		<small style="opacity: .6; display: block; margin-bottom: 8px">${n}</small>
		${r}
	</div>
`,Fr=e=>t`<small style="color: var(--danger, #c62828); min-height: 1.2em; display: block">${e.check.errors()[0]?.message??``}</small>`;Ar=[o(`demo-bind-parent-kept-validation-rule-section`)];var Ir=class extends (Mr=a){template(){let e=G.tags.check.valid()&&G.labels.check.valid()&&G.profile.check.valid();return t`
			<section class="demo-bind-block" id="parent-kept-validation-rule">
				<h2>Rules kept on the parent</h2>

				${Pr(`array.check.eachValidators`,`Every tag needs 3+ characters, also new ones.`,t`
				${G.tags.deep().map((e,n)=>t`
					<label class="demo-bind-field">
						Tag ${n+1}
						<input type="text" .value=${c(G.tags.at(n))} />
						<button type="button" class="tonal" @click=${()=>G.tags.splice(n,1)}>remove</button>
					</label>
					${Fr(G.tags.at(n))}
				`)}
				<div class="demo-actions">
					<button type="button" class="tonal" @click=${()=>G.tags.push(``)}>add tag</button>
				</div>`)}

				${Pr(`object.check.eachValidators`,`Every label is required, also new languages.`,t`
				${Object.keys(G.labels.deep()).map(e=>t`
					<label class="demo-bind-field">
						${e}
						<input type="text" .value=${c(G.labels[e])} />
					</label>
					${Fr(G.labels[e])}
				`)}
				<div class="demo-actions">
					<button type="button" class="tonal" @click=${()=>G.labels.set({[`lang${Nr++}`]:``})}>add language</button>
				</div>`)}

				${Pr(`object.check.fields`,`A different rule per key, set in one call.`,t`
				<label class="demo-bind-field">
					Name
					<input type="text" .value=${c(G.profile.name)} />
				</label>
				${Fr(G.profile.name)}
				<label class="demo-bind-field">
					Age
					<input type="number" .value=${c(G.profile.age)} />
				</label>
				${Fr(G.profile.age)}`)}

				<div class="demo-actions">
					<button type="button" ?disabled=${!e}>Save</button>
				</div>
			</section>
		`}};jr=yr(Mr),Ir=wr(jr,0,`DemoBindParentKeptValidationRuleSection`,Ar,Ir),Cr(jr,1,Ir);var Lr=Object.create,Rr=Object.defineProperty,zr=Object.getOwnPropertyDescriptor,Br=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),K=e=>{throw TypeError(e)},Vr=(e,t,n)=>t in e?Rr(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Hr=(e,t)=>Rr(e,`name`,{value:t,configurable:!0}),Ur=e=>[,,,Lr(e?.[Br(`metadata`)]??null)],Wr=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],q=e=>e!==void 0&&typeof e!=`function`?K(`Function expected`):e,Gr=(e,t,n,r,i)=>({kind:Wr[e],name:t,metadata:r,addInitializer:e=>n._?K(`Already initialized`):i.push(q(e||null))}),Kr=(e,t)=>Vr(t,Br(`metadata`),e[3]),qr=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},Jr=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=Wr[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&zr(d<4?i:{get[n](){return Zr(this,a)},set[n](e){return Qr(this,a,e)}},n));d?p&&d<4&&Hr(a,(d>2?`set `:d>1?`get `:``)+n):Hr(i,n);for(var y=r.length-1;y>=0;y--)l=Gr(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>Xr(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Zr:$r)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Qr(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?q(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?K(`Object expected`):(q(o=s.get)&&(v.get=o),q(o=s.set)&&(v.set=o),q(o=s.init)&&g.unshift(o));return d||Kr(e,i),v&&Rr(i,n,v),p?d^4?a:v:i},Yr=(e,t,n)=>t.has(e)||K(`Cannot `+n),Xr=(e,t)=>Object(t)===t?e.has(t):K(`Cannot use the "in" operator on this value`),Zr=(e,t,n)=>(Yr(e,t,`read from private field`),n?n.call(e):t.get(e)),Qr=(e,t,n,r)=>(Yr(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),$r=(e,t,n)=>(Yr(e,t,`access private method`),n),ei,ti,ni,J=n({account:{email:`ada@example.com`,name:`Ada`},address:{city:`London`,notes:``}}).with(s).with(f);J.account.email.check.validators.set([e=>String(e).includes(`@`)?void 0:{flag:`typeMismatch`,message:`Not an email`}]),J.account.name.check.validators.set([e=>e?void 0:{flag:`valueMissing`,message:`Name is required`}]);var ri=e=>e?`yes`:`no`;function Y(e,n,i){let a=n.formUi;return t`
		<tr class="depth-${i}">
			<th scope="row">${e}</th>
			<td><input type="checkbox" aria-label="${e} readonly" .checked=${r(a.readonly.own)} /></td>
			<td><input type="checkbox" aria-label="${e} disabled" .checked=${r(a.disabled.own)} /></td>
			<td><code>${ri(a.readonly())}</code></td>
			<td><code>${ri(a.disabled())}</code></td>
			<td><code>${ri(a.touched.own())}</code></td>
			<td><code>${ri(a.touched())}</code></td>
		</tr>
	`}ei=[o(`demo-bind-form-ui-section`)];var ii=class extends (ni=a){static styles=i`
		.demo-bind-mirror {
			margin: 0.5rem 0 0;
			font-size: 0.875rem;
		}

		.demo-bind-flags-table {
			border-collapse: collapse;
			width: 100%;
			max-width: 42rem;
			font-variant-numeric: tabular-nums;
		}

		.demo-bind-flags-table :is(th, td) {
			padding: 0.4rem 0.65rem;
			border-bottom: 1px solid var(--std-sys-color-outline-variant);
			text-align: center;
			vertical-align: middle;
		}

		.demo-bind-flags-table thead th {
			font-weight: 500;
			font-size: 0.8125rem;
			color: var(--std-sys-color-on-surface-variant);
			border-bottom-width: 2px;
		}

		.demo-bind-flags-table tbody th[scope='row'] {
			text-align: left;
			font-weight: 500;
			color: var(--std-sys-color-on-surface);
			background: var(--std-sys-color-surface-container-lowest);
		}

		.demo-bind-flags-table tr.depth-0 th[scope='row'] {
			font-weight: 600;
		}

		.demo-bind-flags-table tr.depth-1 th[scope='row'] {
			padding-left: 1.35rem;
			border-top: 1px solid var(--std-sys-color-outline-variant);
		}

		.demo-bind-flags-table tr.depth-2 th[scope='row'] {
			padding-left: 2.5rem;
			font-weight: 400;
			font-size: 0.8125rem;
			color: var(--std-sys-color-on-surface-variant);
		}

		/* Interleaved column bands: own flags · effective · touched */
		.demo-bind-flags-table :is(th, td):nth-child(2),
		.demo-bind-flags-table :is(th, td):nth-child(3),
		.demo-bind-flags-table :is(th, td):nth-child(6),
		.demo-bind-flags-table :is(th, td):nth-child(7) {
			background: color-mix(in srgb, var(--std-sys-color-secondary-container) 42%, transparent);
		}

		.demo-bind-flags-table :is(th, td):nth-child(4),
		.demo-bind-flags-table :is(th, td):nth-child(5) {
			background: color-mix(in srgb, var(--std-sys-color-tertiary-container) 38%, transparent);
		}

		.demo-bind-flags-table td input[type='checkbox'] {
			display: block;
			margin: 0 auto;
		}

		input:read-only,
		textarea:read-only {
			background-color: var(--std-sys-color-surface-container-high);
			color: var(--std-sys-color-on-surface-variant);
		}

		input:disabled,
		textarea:disabled {
			opacity: 0.65;
			cursor: not-allowed;
		}
	`;template(){return t`
			<section class="demo-bind-block" id="form-ui">
				<h2>Form UI: touched, readonly, disabled</h2>
				<p class="desc">
					<code>formUi</code> keeps the flags on the state; <code>formBind()</code> shows them on the
					bound element (<code>readOnly</code> / <code>disabled</code>, <code>aria-*</code>, and
					<code>[data-touched]</code> for the error outline). Tick a box on the <em>account</em> row: both
					account fields follow, <em>address</em> does not.
				</p>

				<form @submit=${e=>{e.preventDefault(),J.formUi.touchAll()}}>
					<fieldset class="demo-bind-field">
						<legend>account</legend>
						<label class="demo-bind-field">
							Email
							<input type="text" .value=${c(J.account.email)} />
						</label>
						<label class="demo-bind-field">
							Name
							<input type="text" .value=${c(J.account.name)} />
						</label>
					</fieldset>

					<fieldset class="demo-bind-field">
						<legend>address</legend>
						<label class="demo-bind-field">
							City
							<input type="text" .value=${c(J.address.city)} />
						</label>
						<label class="demo-bind-field">
							Notes (textarea)
							<textarea .value=${c(J.address.notes)}></textarea>
						</label>
					</fieldset>

					<div class="demo-actions">
						<button type="submit">Submit (touchAll)</button>
						<button type="button" class="tonal" @click=${()=>J.formUi.untouchAll()}>untouchAll()</button>
						<button type="button" class="tonal" @click=${()=>J.account.name.set(``)}>clear name (invalid)</button>
					</div>
				</form>

				<h3>State flags</h3>
				<table class="demo-bind-mirror demo-bind-flags-table">
					<colgroup>
						<col class="band-label" />
						<col span="2" class="band-a" />
						<col span="2" class="band-b" />
						<col span="2" class="band-a" />
					</colgroup>
					<thead>
						<tr>
							<th></th><th>readonly.own</th><th>disabled.own</th>
							<th>readonly()</th><th>disabled()</th><th>touched.own</th><th>touched()</th>
						</tr>
					</thead>
					<tbody>
						${Y(`form (root)`,J,0)}
						${Y(`account`,J.account,1)}
						${Y(`account.email`,J.account.email,2)}
						${Y(`account.name`,J.account.name,2)}
						${Y(`address`,J.address,1)}
						${Y(`address.city`,J.address.city,2)}
						${Y(`address.notes`,J.address.notes,2)}
					</tbody>
				</table>
				<p class="desc">
					Focus a field and tab away: its <code>touched.own</code> turns on and the invalid outline appears.
					<code>touched()</code> on a parent is true as soon as one member is touched, while its
					<code>touched.own</code> stays off.
				</p>
			</section>
		`}};ti=Ur(ni),ii=Jr(ti,0,`DemoBindFormUiSection`,ei,ii),qr(ti,1,ii);var ai=Object.create,oi=Object.defineProperty,si=Object.getOwnPropertyDescriptor,ci=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),X=e=>{throw TypeError(e)},li=(e,t,n)=>t in e?oi(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,ui=(e,t)=>oi(e,`name`,{value:t,configurable:!0}),di=e=>[,,,ai(e?.[ci(`metadata`)]??null)],fi=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],Z=e=>e!==void 0&&typeof e!=`function`?X(`Function expected`):e,pi=(e,t,n,r,i)=>({kind:fi[e],name:t,metadata:r,addInitializer:e=>n._?X(`Already initialized`):i.push(Z(e||null))}),mi=(e,t)=>li(t,ci(`metadata`),e[3]),hi=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},gi=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=fi[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&si(d<4?i:{get[n](){return yi(this,a)},set[n](e){return bi(this,a,e)}},n));d?p&&d<4&&ui(a,(d>2?`set `:d>1?`get `:``)+n):ui(i,n);for(var y=r.length-1;y>=0;y--)l=pi(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>vi(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?yi:xi)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>bi(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?Z(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?X(`Object expected`):(Z(o=s.get)&&(v.get=o),Z(o=s.set)&&(v.set=o),Z(o=s.init)&&g.unshift(o));return d||mi(e,i),v&&oi(i,n,v),p?d^4?a:v:i},_i=(e,t,n)=>t.has(e)||X(`Cannot `+n),vi=(e,t)=>Object(t)===t?e.has(t):X(`Cannot use the "in" operator on this value`),yi=(e,t,n)=>(_i(e,t,`read from private field`),n?n.call(e):t.get(e)),bi=(e,t,n,r)=>(_i(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),xi=(e,t,n)=>(_i(e,t,`access private method`),n),Si,Ci,wi,Q=n({name:`Ada`,email:`ada@example.com`}).with(s).with(u).with(f);Q.name.check.validators.set([p(`Name is required`),bn(3)]),Q.email.check.validators.set([p(`Email is required`),_(),d(async(e,{abortSignal:t})=>(await new Promise(e=>setTimeout(e,900)),t.aborted?null:e===`taken@example.com`?{flag:`customError`,message:`Already registered`}:null),{debounce:300})]);var Ti=[{id:`flags-name`,label:`Name`},{id:`flags-email`,label:`Email`}],Ei=[`data-touched`,`data-dirty`,`data-pending`,`aria-invalid`,`aria-required`,`aria-busy`],Di=[`:invalid`,`[data-touched]:invalid`],Oi=e(0);Si=[o(`demo-bind-form-flags-section`)];var ki=class extends (wi=a){static styles=i`
		.demo-flags-error {
			display: block;
			min-height: 1.25rem;
			font-size: 0.8125rem;
			color: #b3261e;
		}

		/* aria-errormessage text is always in the DOM; show it only after touched */
		input:not([data-touched]) + .demo-flags-error {
			visibility: hidden;
		}

		/* an async check is running */
		input[data-pending] {
			outline: 2px dashed var(--std-sys-color-primary);
			cursor: progress;
		}

		/* edited since the initial value */
		input[data-dirty] {
			border-left: 4px solid var(--std-sys-color-tertiary);
		}

		.demo-flags-scroll {
			overflow-x: auto;
		}

		.demo-flags-table {
			border-collapse: collapse;
			font-size: 0.8125rem;
			margin-top: 0.75rem;
		}

		.demo-flags-table :is(th, td) {
			padding: 0.35rem 0.65rem;
			border-bottom: 1px solid var(--std-sys-color-outline-variant);
			text-align: center;
		}

		.demo-flags-table tbody th {
			text-align: left;
			font-weight: 500;
		}

		.demo-flags-table td.on code {
			font-weight: 700;
			color: var(--std-sys-color-primary);
		}
	`;#e;firstUpdated(){let e=()=>Oi.set(Oi.peek()+1);this.#e=new MutationObserver(e);for(let{id:e}of Ti){let t=this.renderRoot.querySelector(`#${e}`);t&&this.#e.observe(t,{attributes:!0})}e()}disconnect(){this.#e?.disconnect()}#t(e){let n=this.renderRoot.querySelector(`#${e.id}`);return t`
			<tr>
				<th scope="row">${e.label}</th>
				${Ei.map(e=>{let r=n?.getAttribute(e);return t`<td class=${r==null?``:`on`}><code>${r==null?`-`:r||`present`}</code></td>`})}
				${Di.map(e=>{let r=n?.matches(e)??!1;return t`<td class=${r?`on`:``}><code>${r?`matches`:`-`}</code></td>`})}
			</tr>
		`}template(){return Oi(),t`
			<section class="demo-bind-block" id="form-flags">
				<h2>Form flags and aria</h2>
				<p class="desc">
					Everything below is set by <code>formBind()</code> from the state. Edit a field (<code>dirty</code>),
					tab away (<code>touched</code>), or type <code>taken@example.com</code> in Email to see
					<code>pending</code> while the async check runs, then <code>aria-invalid</code> and the error text.
				</p>

				<form novalidate @submit=${e=>{e.preventDefault(),Q.formUi.touchAll()}}>
					<label class="demo-bind-field">
						Name
						<input id="flags-name" type="text" aria-errormessage="flags-name-error" .value=${c(Q.name)} />
						<span id="flags-name-error" class="demo-flags-error"></span>
					</label>
					<label class="demo-bind-field">
						Email
						<input id="flags-email" type="text" aria-errormessage="flags-email-error" .value=${c(Q.email)} />
						<span id="flags-email-error" class="demo-flags-error"></span>
					</label>

					<div class="demo-actions">
						<button type="submit">Submit (touchAll)</button>
						<button type="button" class="tonal" @click=${()=>Q.formUi.untouchAll()}>untouchAll()</button>
						<button
							type="button"
							class="tonal"
							@click=${()=>{Q.name.changes.reset(Q.name.peek()),Q.email.changes.reset(Q.email.peek())}}
						>
							Mark as saved (reset)
						</button>
					</div>
				</form>

				<h3>Attributes and pseudo-classes on the inputs</h3>
				<div class="demo-flags-scroll">
				<table class="demo-flags-table">
					<thead>
						<tr>
							<th></th>
							${Ei.map(e=>t`<th><code>${e}</code></th>`)}
							${Di.map(e=>t`<th><code>${e}</code></th>`)}
						</tr>
					</thead>
					<tbody>
						${Ti.map(e=>this.#t(e))}
					</tbody>
				</table>
				</div>
				<p class="desc">
					<code>:invalid</code> is on as soon as the state has errors (it comes from the constraint validation
					<code>formBind</code> fills), while <code>[data-touched]:invalid</code> waits for the user, which is
					what the red outline uses.
				</p>
				<p class="desc">
					<code>aria-required</code> comes from the <code>required()</code> validator, not from the native
					<code>required</code> attribute, so the browser adds no second error.
				</p>
			</section>
		`}};Ci=di(wi),ki=gi(Ci,0,`DemoBindFormFlagsSection`,Si,ki),hi(Ci,1,ki);var Ai=`// Two-way bind on native form controls: .value, .checked, programmatic reset, re-render while typing.\r
import { bind, t, tag, UIElement, state } from '@std-ui/core';\r
\r
@tag('demo-bind-form-section')\r
export class DemoBindFormSection extends UIElement {\r
	readonly search = state('hello');\r
	readonly agreed = state(false);\r
	readonly renderPasses = state(0);\r
\r
	protected override template() {\r
		return t\`\r
			<section class="demo-bind-block" id="form">\r
				<h2>Native form controls</h2>\r
				<p class="desc">\r
					<code>bind()</code> replaces <code>.value</code> + <code>@input</code>. Edits update the\r
					bound signal; other re-renders should not stomp the field while values stay in sync.\r
				</p>\r
				<label class="demo-bind-field">\r
					Text\r
					<input .value=\${bind(this.search)} type="text" />\r
				</label>\r
				<p class="demo-bind-mirror">Model: <code>\${this.search()}</code></p>\r
				<label class="demo-bind-field demo-bind-field--inline">\r
					<input type="checkbox" .checked=\${bind(this.agreed)} />\r
					I agree\r
				</label>\r
				<p class="demo-bind-mirror">Agreed: <code>\${String(this.agreed())}</code></p>\r
				<div class="demo-actions">\r
					<button type="button" @click=\${() => this.search.set('')}>clear query from model</button>\r
					<button type="button" class="tonal" @click=\${() => this.renderPasses.update(n => n + 1)}>\r
						bump render counter (\${this.renderPasses()})\r
					</button>\r
				</div>\r
			</section>\r
		\`;\r
	}\r
}\r
`,ji=`// Custom element property + default \`level-change\` event.\r
import { bind, t, state, tag, UIElement } from '@std-ui/core';\r
import './knob-control.js';\r
import './signal-knob-control.js';\r
\r
@tag('demo-bind-custom-section')\r
export class DemoBindCustomSection extends UIElement {\r
	level = state(2);\r
\r
	protected override template() {\r
		return t\`\r
			<section class="demo-bind-block" id="custom">\r
				<h2>Custom <code>.level</code></h2>\r
				<p class="desc">\r
					<code>&lt;demo-bind-knob&gt;</code> updates <code>.level</code> and bubbles\r
					<code>level-change</code> (the default for a property named <code>level</code>).\r
				</p>\r
				<demo-bind-knob .level=\${bind(this.level)}></demo-bind-knob>\r
				<p class="demo-bind-mirror">Parent <code>state()</code> level: <code>\${this.level()}</code></p>\r
				<h3>Signal property</h3>\r
				<p class="desc">\r
					<code>&lt;demo-bind-signal-knob&gt;</code> exposes <code>.level</code> as a <code>state()</code>;\r
					<code>bind()</code> reads it with <code>()</code> and writes it with <code>.set()</code>.\r
				</p>\r
				<demo-bind-signal-knob .level=\${bind(this.level)}></demo-bind-signal-knob>\r
				<div class="demo-actions">\r
					<button type="button" @click=\${() => this.level.set(0)}>set parent level to 0</button>\r
					<button type="button" class="tonal" @click=\${() => this.level.update(n => n + 5)}>parent +5</button>\r
				</div>\r
			</section>\r
		\`;\r
	}\r
}\r
`,Mi=`// Toy control for the bind demo: exposes \`.level\` and emits \`level-change\` on user edits only.\r
import { tag } from '@std-ui/core';\r
\r
@tag('demo-bind-knob')\r
export class DemoBindKnob extends HTMLElement {\r
	#level = 0;\r
	#readout: HTMLElement | null = null;\r
\r
	get level(): number {\r
		return this.#level;\r
	}\r
\r
	set level(v: number) {\r
		const next = Number(v);\r
		if (Number.isNaN(next)) return;\r
		this.#level = next;\r
		this.#paint();\r
	}\r
\r
	connectedCallback(): void {\r
		if (this.childElementCount > 0) return;\r
		const down = document.createElement('button');\r
		down.type = 'button';\r
		down.textContent = '−';\r
		const up = document.createElement('button');\r
		up.type = 'button';\r
		up.textContent = '+';\r
		this.#readout = document.createElement('span');\r
		this.#readout.className = 'demo-bind-knob__readout';\r
		down.addEventListener('click', () => this.#bump(-1));\r
		up.addEventListener('click', () => this.#bump(1));\r
		this.append(down, this.#readout, up);\r
		this.#paint();\r
	}\r
\r
	#bump(delta: number): void {\r
		this.#level += delta;\r
		this.#paint();\r
		this.dispatchEvent(new Event('level-change', { bubbles: true }));\r
	}\r
\r
	#paint(): void {\r
		if (this.#readout) this.#readout.textContent = \`level \${this.#level}\`;\r
	}\r
}\r
`,Ni=`// Toy control whose \`.level\` property is itself a \`state()\` signal; \`bind()\` reads it by calling it
// and writes it with \`.set()\`. Emits \`level-change\` on user edits only.
import { state, t, tag, UIElement } from '@std-ui/core';

@tag('demo-bind-signal-knob')
export class DemoBindSignalKnob extends UIElement {
	level = state(0);

	#bump(delta: number): void {
		this.level.update(n => n + delta);
		this.dispatchEvent(new Event('level-change', { bubbles: true }));
	}

	protected override template() {
		return t\`
			<button type="button" @click=\${() => this.#bump(-1)}>−</button>
			<span class="demo-bind-knob__readout">level \${this.level()}</span>
			<button type="button" @click=\${() => this.#bump(1)}>+</button>
		\`;
	}
}
`,Pi=`// bind() on a custom element whose change event is not the default: \`bind(state, { event })\`.
import { bind, t, state, tag, UIElement } from '@std-ui/core';
import './swatch-control.js';

@tag('demo-bind-custom-event-section')
export class DemoBindCustomEventSection extends UIElement {
	color = state('seagreen');
	lastEvent = state('(none yet)');

	protected override template() {
		return t\`
			<section class="demo-bind-block" id="custom-event">
				<h2>Custom event</h2>
				<p class="desc">
					<code>&lt;demo-bind-swatch&gt;</code> has a <code>.color</code> property but fires
					<code>swatch-picked</code>, not the default <code>color-change</code>. Pass
					<code>{ event: 'swatch-picked' }</code> to <code>bind()</code>.
				</p>
				<demo-bind-swatch
					.color=\${bind(this.color, { event: 'swatch-picked' })}
					@swatch-picked=\${(e: Event) => this.lastEvent.set(String((e as CustomEvent).detail))}
				></demo-bind-swatch>
				<p class="demo-bind-mirror">Model: <code>\${this.color()}</code></p>
				<p class="demo-bind-mirror">Last <code>swatch-picked</code> detail: <code>\${this.lastEvent()}</code></p>
				<div class="demo-actions">
					<button type="button" @click=\${() => this.color.set('tomato')}>set model to tomato</button>
					<button type="button" class="tonal" @click=\${() => this.color.set('royalblue')}>set model to royalblue</button>
				</div>
			</section>
		\`;
	}
}
`,Fi=`// Toy control for the bind demo: exposes \`.color\` but emits a non-default \`swatch-picked\` event.
import { tag } from '@std-ui/core';

const COLORS = ['tomato', 'gold', 'seagreen', 'royalblue'];

@tag('demo-bind-swatch')
export class DemoBindSwatch extends HTMLElement {
	#color = COLORS[0];
	#buttons: HTMLButtonElement[] = [];

	get color(): string {
		return this.#color;
	}

	set color(v: string) {
		this.#color = String(v);
		this.#paint();
	}

	connectedCallback(): void {
		if (this.childElementCount > 0) return;
		for (const c of COLORS) {
			const b = document.createElement('button');
			b.type = 'button';
			b.title = c;
			b.style.cssText = \`background:\${c};width:1.5rem;height:1.5rem;border-radius:50%;margin-right:.25rem\`;
			b.addEventListener('click', () => {
				this.#color = c;
				this.#paint();
				this.dispatchEvent(new CustomEvent('swatch-picked', { bubbles: true, detail: c }));
			});
			this.#buttons.push(b);
			this.append(b);
		}
		this.#paint();
	}

	#paint(): void {
		for (const b of this.#buttons) {
			b.style.outline = b.title === this.#color ? '2px solid currentColor' : 'none';
		}
	}
}
`,Ii=`// formBind() = bind() + form UI: it mirrors a state's validator errors into the element's constraint\r
// validation, and shows the state's \`formUi\` (touched / readonly / disabled) on the element.\r
// Three targets: native controls, a plain FormElement (merged state) and a FormGroup (routed to inner controls).\r
import { t, tag, UIElement, state } from '@std-ui/core';
import { check, formBind, formUi } from '@std-ui/ext';\r
import './range-control.js';\r
import './merged-control.js';\r
\r
const required = (message: string) => (v: unknown) => (v ? undefined : { flag: 'valueMissing' as const, message });\r
\r
const form = formUi(check(state({ name: '', age: 5 })));\r
form.name.check.validators.set([\r
	required('Name is required'),\r
	v => (String(v).length >= 3 ? undefined : { flag: 'tooShort', message: 'At least 3 characters' }),\r
]);\r
form.age.check.validators.set([\r
	v => (v >= 2 && v <= 8 ? undefined : { flag: 'rangeOverflow', message: 'Age must be between 2 and 8' }),\r
]);\r
\r
const range = formUi(check(state({ start: '', end: '' })));\r
range.start.check.validators.set([required('Start required')]);\r
range.end.check.validators.set([required('End required')]);\r
\r
const person = formUi(check(state({ first: '', last: '' })));\r
person.first.check.validators.set([required('First name required')]);\r
person.last.check.validators.set([required('Last name required')]);\r
\r
const errorsOf = (node: { check: { errors(): { message: string }[] } }) =>\r
	node.check.errors().map(e => e.message).join(', ') || 'none';\r
\r
type Validatable = HTMLElement & { checkValidity(): boolean; reportValidity(): boolean; validationMessage: string; validity: ValidityState };\r
\r
@tag('demo-bind-validation-section')\r
export class DemoBindValidationSection extends UIElement {\r
	/** Snapshot of an element's validity, rendered under it (host \`validationMessage\` shows the grouped format). */\r
	readonly status = state('');\r
\r
	#snapshot(selector: string): void {\r
		const el = this.querySelector<Validatable>(selector);\r
		if (!el) return;\r
		const flags = Object.keys(ValidityState.prototype).filter(k => k !== 'valid' && (el.validity as never)[k]);\r
		this.status.set([\r
			\`checkValidity(): \${el.checkValidity()}\`,\r
			\`flags: \${flags.join(', ') || '(none)'}\`,\r
			\`validationMessage:\`,\r
			el.validationMessage || '(empty)',\r
		].join('\\n'));\r
	}\r
\r
	protected override template() {\r
		return t\`\r
			<section class="demo-bind-block" id="validation">\r
				<h2>Validation</h2>\r
				<p class="desc">\r
					When the bound state has validators, <code>formBind()</code> copies its errors onto the target's\r
					constraint validation: <code>:invalid</code>, <code>validity</code>, <code>validationMessage</code>,\r
					<code>checkValidity()</code> and form submission follow the model. Plain <code>bind()</code> only\r
					syncs the value; for touched, readonly and disabled see the <em>Form UI</em> demo below.\r
				</p>\r
\r
				<h3>1. Native controls</h3>\r
				<p class="desc">Only <code>customError</code> is available to script; the message carries the detail.</p>\r
				<label class="demo-bind-field">\r
					Name\r
					<input type="text" .value=\${formBind(form.name)} />\r
				</label>\r
				<p class="demo-bind-mirror">Errors: <code>\${errorsOf(form.name)}</code></p>\r
				<label class="demo-bind-field">\r
					Age\r
					<input type="number" .value=\${formBind(form.age)} />\r
				</label>\r
				<p class="demo-bind-mirror">Errors: <code>\${errorsOf(form.age)}</code></p>\r
				<div class="demo-actions">\r
					<button type="button" @click=\${() => form.name.set('')}>clear name from model</button>\r
					<button type="button" class="tonal" @click=\${() => alert(\r
						[...this.querySelectorAll<HTMLInputElement>('input[type=text]:not([data-field]), input[type=number]')]\r
							.map(i => i.checkValidity() ? 'valid' : i.validationMessage).join('\\n'))}>\r
						checkValidity()\r
					</button>\r
				</div>\r
\r
				<h3>2. FormElement: errors merged into one state</h3>\r
				<p class="desc">\r
					Both <code>.first</code> and <code>.last</code> report into the same host. The real flags\r
					(<code>valueMissing</code>…) are unioned, messages are grouped per property, and the single\r
					anchor is <code>validationAnchor</code> (the error icon on the right, shown once the host is touched\r
					and invalid). Fill only one: the host stays invalid for the other.\r
				</p>\r
				<demo-bind-merged id="merged" .first=\${formBind(person.first)} .last=\${formBind(person.last)}></demo-bind-merged>\r
				<p class="demo-bind-mirror">first: <code>\${errorsOf(person.first)}</code> · last: <code>\${errorsOf(person.last)}</code></p>\r
				<div class="demo-actions">\r
					<button type="button" class="tonal" @click=\${() => this.#snapshot('#merged')}>inspect host validity</button>\r
					<button type="button" class="tonal" @click=\${() => this.querySelector<Validatable>('#merged')?.reportValidity()}>reportValidity()</button>\r
				</div>\r
\r
				<h3>3. FormGroup: errors routed to inner controls</h3>\r
				<p class="desc">\r
					<code>validationErrorTarget(property)</code> links each bound property to the inner input that owns\r
					it. Each input gets its own validity and bubble; the host itself stays valid. Fill only\r
					<em>end</em>: <em>start</em> stays invalid. <code>reportValidity()</code> fires\r
					<code>invalid</code> on every routed input (both messages show) and leaves the bubble on the first.\r
				</p>\r
				<demo-bind-range id="range" .start=\${formBind(range.start)} .end=\${formBind(range.end)}></demo-bind-range>\r
				<p class="demo-bind-mirror">start: <code>\${errorsOf(range.start)}</code> · end: <code>\${errorsOf(range.end)}</code></p>\r
				<div class="demo-actions">\r
					<button type="button" class="tonal" @click=\${() => this.#snapshot('#range')}>inspect host validity</button>\r
					<button type="button" class="tonal" @click=\${() => this.querySelector<Validatable>('#range')?.reportValidity()}>reportValidity()</button>\r
				</div>\r
\r
				<pre class="demo-bind-mirror">\${this.status() || 'Press “inspect host validity” to see flags and message.'}</pre>\r
			</section>\r
		\`;\r
	}\r
}\r
`,Li=`// Conditional validation in a small order form. Nothing to read: click the switches and watch the\r
// errors and the Submit button react.\r
//   VAT        when(isCompany, ...)             rules apply only for companies\r
//   Email      check.enabled                    validated only while "Notify me" is on\r
//   Address    formUi.disabled                  a disabled input is not validated\r
// All three are configured in one call with \`form.check.fields({...})\`.\r
import { t, tag, UIElement, state } from '@std-ui/core';\r
import { check, formBind, formUi, minLength, pattern, required, when } from '@std-ui/ext';\r
\r
const form = state({ vat: '', email: '', address: '' }).with(check).with(formUi);\r
const isCompany = state(false);\r
\r
// FEATURE 4: check.fields({...}) sets the rules of several members in one call (here for all\r
// three fields), instead of \`form.vat.check.validators.set(...)\` for each.\r
form.check.fields({\r
	// FEATURE 1: when(condition, validators). The rules run only while \`condition()\` is true; any\r
	// signal or \`() => boolean\` works. Flipping it re-evaluates errors / valid automatically.\r
	vat: [\r
		when(isCompany, [\r
			required<string>('VAT number is required'),\r
			minLength<string>(8),\r
			pattern(/^[A-Z]{2}/, 'Must start with 2 capital letters, e.g. DE123456789'),\r
		]),\r
	],\r
	// FEATURE 2 (below): node.check.enabled switches ALL of one node's own validators on/off.\r
	email: [required<string>('Email is required'), pattern(/@/, 'Not an email address')],\r
	address: [required<string>('Address is required')],\r
});\r
form.email.check.enabled.set(false); // off until "Notify me" is ticked\r
\r
// FEATURE 3: formUi.disabled. A node disabled in its form UI (or under a disabled parent) is not\r
// validated, like a native disabled input. No extra wiring: \`check\` follows the flag.\r
form.address.formUi.disabled.own.set(true);\r
type Node = { check: { errors(): { message: string }[] } };\r
const error = (node: Node) => node.check.errors()[0]?.message ?? '';\r
\r
const toggle = (label: string, checked: boolean, onChange: (on: boolean) => void) =>\r
	t\`<label class="demo-bind-field"><input type="checkbox" .checked=\${checked} @change=\${(e: Event) => onChange((e.target as HTMLInputElement).checked)} /> \${label}</label>\`;\r
\r
/** One sub-demo: a titled box, so each feature reads as its own group. */\r
const card = (title: string, hint: string, body: unknown) => t\`\r
	<div style="border: 1px solid var(--outline, #cfcfcf); border-radius: 8px; padding: 12px 16px; margin: 12px 0">\r
		<div style="font-weight: 600">\${title}</div>\r
		<small style="opacity: .6; display: block; margin-bottom: 8px">\${hint}</small>\r
		\${body}\r
	</div>\r
\`;\r
\r
const fieldError = (node: Node) => t\`<small style="color: var(--danger, #c62828); min-height: 1.2em; display: block">\${error(node)}</small>\`;\r
\r
@tag('demo-bind-conditional-section')\r
export class DemoBindConditionalSection extends UIElement {\r
	protected override template() {\r
		return t\`\r
			<section class="demo-bind-block" id="conditional">\r
				<h2>Conditional validation</h2>\r
\r
				\${card('when()', 'VAT rules apply only to companies. Switch the type.', t\`\r
				<div class="demo-actions">\r
					<button type="button" class=\${isCompany() ? '' : 'tonal'} @click=\${() => isCompany.set(false)}>Personal</button>\r
					<button type="button" class=\${isCompany() ? 'tonal' : ''} @click=\${() => isCompany.set(true)}>Company</button>\r
				</div>\r
				<label class="demo-bind-field">\r
					VAT number\${isCompany() ? ' *' : ''}\r
					<input type="text" .value=\${formBind(form.vat)} />\r
				</label>\r
				\${fieldError(form.vat)}\`)}\r
\r
				\${card('check.enabled', 'Email is checked only while this is on.', t\`\r
				\${toggle('Notify me by email', form.email.check.enabled(), on => form.email.check.enabled.set(on))}\r
				<label class="demo-bind-field">\r
					Email\r
					<input type="text" .value=\${formBind(form.email)} />\r
				</label>\r
				\${fieldError(form.email)}\`)}\r
\r
				\${card('formUi.disabled', 'A disabled input is not validated.', t\`\r
				\${toggle('Ship to another address', !form.address.formUi.disabled.own(), on => form.address.formUi.disabled.own.set(!on))}\r
				<label class="demo-bind-field">\r
					Address\r
					<input type="text" .value=\${formBind(form.address)} />\r
				</label>\r
				\${fieldError(form.address)}\`)}\r
\r
				<div class="demo-actions">\r
					<button type="button" ?disabled=\${!form.check.valid()}>Submit</button>\r
				</div>\r
			</section>\r
		\`;\r
	}\r
}\r
`,Ri=`// Validation rules kept on the PARENT, applied to its members:\r
//   check.eachValidators   one rule set for every member of an array / record-like object\r
//   check.fields({...})    rules per member key, in one call\r
// Existing and later-added members get them; each member reports its own errors and the parent's\r
// \`valid\` includes them.\r
import { t, tag, UIElement, state } from '@std-ui/core';\r
import { check, formBind, minLength, required } from '@std-ui/ext';\r
\r
const form = state({\r
	tags: ['ab'] as string[],\r
	labels: { en: 'Hello', de: '' } as Record<string, string>,\r
	profile: { name: '', age: 5 },\r
}).with(check);\r
\r
// eachValidators on an array: every tag, including ones added later.\r
form.tags.check.eachValidators.set([required<string>('Tag is empty'), minLength<string>(3)]);\r
// eachValidators on an object: every label (language), including languages added later.\r
form.labels.check.eachValidators.set([required<string>('Label is empty')]);\r
// fields: different rules per key, all kept on \`profile\` instead of on each member.\r
form.profile.check.fields({\r
	name: [required<string>('Name is required'), minLength<string>(3)],\r
	age: [v => (v >= 18 ? undefined : { flag: 'rangeUnderflow', message: 'Must be 18 or older' })],\r
});\r
let nextLang = 1;\r
\r
type Node = { check: { errors(): { message: string }[] } };\r
/** One sub-demo: a titled box, so each feature reads as its own group. */\r
const card = (title: string, hint: string, body: unknown) => t\`\r
	<div style="border: 1px solid var(--outline, #cfcfcf); border-radius: 8px; padding: 12px 16px; margin: 12px 0">\r
		<div style="font-weight: 600">\${title}</div>\r
		<small style="opacity: .6; display: block; margin-bottom: 8px">\${hint}</small>\r
		\${body}\r
	</div>\r
\`;\r
const fieldError = (node: Node) =>\r
	t\`<small style="color: var(--danger, #c62828); min-height: 1.2em; display: block">\${node.check.errors()[0]?.message ?? ''}</small>\`;\r
\r
@tag('demo-bind-parent-kept-validation-rule-section')\r
export class DemoBindParentKeptValidationRuleSection extends UIElement {\r
	protected override template() {\r
		const all = form.tags.check.valid() && form.labels.check.valid() && form.profile.check.valid();\r
		return t\`\r
			<section class="demo-bind-block" id="parent-kept-validation-rule">\r
				<h2>Rules kept on the parent</h2>\r
\r
				\${card('array.check.eachValidators', 'Every tag needs 3+ characters, also new ones.', t\`\r
				\${form.tags.deep().map((_, i) => t\`\r
					<label class="demo-bind-field">\r
						Tag \${i + 1}\r
						<input type="text" .value=\${formBind(form.tags.at(i)!)} />\r
						<button type="button" class="tonal" @click=\${() => form.tags.splice(i, 1)}>remove</button>\r
					</label>\r
					\${fieldError(form.tags.at(i)!)}\r
				\`)}\r
				<div class="demo-actions">\r
					<button type="button" class="tonal" @click=\${() => form.tags.push('')}>add tag</button>\r
				</div>\`)}\r
\r
				\${card('object.check.eachValidators', 'Every label is required, also new languages.', t\`\r
				\${Object.keys(form.labels.deep()).map(key => t\`\r
					<label class="demo-bind-field">\r
						\${key}\r
						<input type="text" .value=\${formBind(form.labels[key])} />\r
					</label>\r
					\${fieldError(form.labels[key])}\r
				\`)}\r
				<div class="demo-actions">\r
					<button type="button" class="tonal" @click=\${() => form.labels.set({ [\`lang\${nextLang++}\`]: '' })}>add language</button>\r
				</div>\`)}\r
\r
				\${card('object.check.fields', 'A different rule per key, set in one call.', t\`\r
				<label class="demo-bind-field">\r
					Name\r
					<input type="text" .value=\${formBind(form.profile.name)} />\r
				</label>\r
				\${fieldError(form.profile.name)}\r
				<label class="demo-bind-field">\r
					Age\r
					<input type="number" .value=\${formBind(form.profile.age)} />\r
				</label>\r
				\${fieldError(form.profile.age)}\`)}\r
\r
				<div class="demo-actions">\r
					<button type="button" ?disabled=\${!all}>Save</button>\r
				</div>\r
			</section>\r
		\`;\r
	}\r
}\r
`,zi=`// formUi: touched / readonly / disabled held as state, shown on the element by formBind().\r
//   - flags are plain signals, so the controls below bind to them with \`bind()\`\r
//   - \`flag()\` reads the resolved value, \`flag.own\` writes this node's own flag\r
//   - readonly / disabled: set when the node or any ancestor is; touched(): when the node or any descendant is\r
//   - mark a whole subtree with \`touchAll()\`\r
import { bind, css, t, tag, UIElement, state } from '@std-ui/core';\r
import { check, formBind, formUi } from '@std-ui/ext';\r
\r
const form = state({\r
	account: { email: 'ada@example.com', name: 'Ada' },\r
	address: { city: 'London', notes: '' },\r
}).with(check).with(formUi);\r
\r
form.account.email.check.validators.set([\r
	v => (String(v).includes('@') ? undefined : { flag: 'typeMismatch' as const, message: 'Not an email' }),\r
]);\r
form.account.name.check.validators.set([\r
	v => (v ? undefined : { flag: 'valueMissing' as const, message: 'Name is required' }),\r
]);\r
\r
const yes = (value: boolean) => (value ? 'yes' : 'no');\r
\r
/** Tree depth in the mirror: 0 = root, 1 = object (account / address), 2 = leaf field. */\r
type FlagDepth = 0 | 1 | 2;\r
\r
/** One row of flag controls for a node: its own readonly / disabled, and what it effectively is. */\r
function flagRow(label: string, node: { formUi: typeof form.formUi }, depth: FlagDepth) {\r
	const ui = node.formUi;\r
	return t\`\r
		<tr class="depth-\${depth}">\r
			<th scope="row">\${label}</th>\r
			<td><input type="checkbox" aria-label="\${label} readonly" .checked=\${bind(ui.readonly.own)} /></td>\r
			<td><input type="checkbox" aria-label="\${label} disabled" .checked=\${bind(ui.disabled.own)} /></td>\r
			<td><code>\${yes(ui.readonly())}</code></td>\r
			<td><code>\${yes(ui.disabled())}</code></td>\r
			<td><code>\${yes(ui.touched.own())}</code></td>\r
			<td><code>\${yes(ui.touched())}</code></td>\r
		</tr>\r
	\`;\r
}\r
\r
@tag('demo-bind-form-ui-section')\r
export class DemoBindFormUiSection extends UIElement {\r
	static override styles = css\`\r
		.demo-bind-mirror {\r
			margin: 0.5rem 0 0;\r
			font-size: 0.875rem;\r
		}\r
\r
		.demo-bind-flags-table {\r
			border-collapse: collapse;\r
			width: 100%;\r
			max-width: 42rem;\r
			font-variant-numeric: tabular-nums;\r
		}\r
\r
		.demo-bind-flags-table :is(th, td) {\r
			padding: 0.4rem 0.65rem;\r
			border-bottom: 1px solid var(--std-sys-color-outline-variant);\r
			text-align: center;\r
			vertical-align: middle;\r
		}\r
\r
		.demo-bind-flags-table thead th {\r
			font-weight: 500;\r
			font-size: 0.8125rem;\r
			color: var(--std-sys-color-on-surface-variant);\r
			border-bottom-width: 2px;\r
		}\r
\r
		.demo-bind-flags-table tbody th[scope='row'] {\r
			text-align: left;\r
			font-weight: 500;\r
			color: var(--std-sys-color-on-surface);\r
			background: var(--std-sys-color-surface-container-lowest);\r
		}\r
\r
		.demo-bind-flags-table tr.depth-0 th[scope='row'] {\r
			font-weight: 600;\r
		}\r
\r
		.demo-bind-flags-table tr.depth-1 th[scope='row'] {\r
			padding-left: 1.35rem;\r
			border-top: 1px solid var(--std-sys-color-outline-variant);\r
		}\r
\r
		.demo-bind-flags-table tr.depth-2 th[scope='row'] {\r
			padding-left: 2.5rem;\r
			font-weight: 400;\r
			font-size: 0.8125rem;\r
			color: var(--std-sys-color-on-surface-variant);\r
		}\r
\r
		/* Interleaved column bands: own flags · effective · touched */\r
		.demo-bind-flags-table :is(th, td):nth-child(2),\r
		.demo-bind-flags-table :is(th, td):nth-child(3),\r
		.demo-bind-flags-table :is(th, td):nth-child(6),\r
		.demo-bind-flags-table :is(th, td):nth-child(7) {\r
			background: color-mix(in srgb, var(--std-sys-color-secondary-container) 42%, transparent);\r
		}\r
\r
		.demo-bind-flags-table :is(th, td):nth-child(4),\r
		.demo-bind-flags-table :is(th, td):nth-child(5) {\r
			background: color-mix(in srgb, var(--std-sys-color-tertiary-container) 38%, transparent);\r
		}\r
\r
		.demo-bind-flags-table td input[type='checkbox'] {\r
			display: block;\r
			margin: 0 auto;\r
		}\r
\r
		input:read-only,\r
		textarea:read-only {\r
			background-color: var(--std-sys-color-surface-container-high);\r
			color: var(--std-sys-color-on-surface-variant);\r
		}\r
\r
		input:disabled,\r
		textarea:disabled {\r
			opacity: 0.65;\r
			cursor: not-allowed;\r
		}\r
	\`;\r
\r
	protected override template() {\r
		return t\`\r
			<section class="demo-bind-block" id="form-ui">\r
				<h2>Form UI: touched, readonly, disabled</h2>\r
				<p class="desc">\r
					<code>formUi</code> keeps the flags on the state; <code>formBind()</code> shows them on the\r
					bound element (<code>readOnly</code> / <code>disabled</code>, <code>aria-*</code>, and\r
					<code>[data-touched]</code> for the error outline). Tick a box on the <em>account</em> row: both\r
					account fields follow, <em>address</em> does not.\r
				</p>\r
\r
				<form @submit=\${(e: Event) => { e.preventDefault(); form.formUi.touchAll(); }}>\r
					<fieldset class="demo-bind-field">\r
						<legend>account</legend>\r
						<label class="demo-bind-field">\r
							Email\r
							<input type="text" .value=\${formBind(form.account.email)} />\r
						</label>\r
						<label class="demo-bind-field">\r
							Name\r
							<input type="text" .value=\${formBind(form.account.name)} />\r
						</label>\r
					</fieldset>\r
\r
					<fieldset class="demo-bind-field">\r
						<legend>address</legend>\r
						<label class="demo-bind-field">\r
							City\r
							<input type="text" .value=\${formBind(form.address.city)} />\r
						</label>\r
						<label class="demo-bind-field">\r
							Notes (textarea)\r
							<textarea .value=\${formBind(form.address.notes)}></textarea>\r
						</label>\r
					</fieldset>\r
\r
					<div class="demo-actions">\r
						<button type="submit">Submit (touchAll)</button>\r
						<button type="button" class="tonal" @click=\${() => form.formUi.untouchAll()}>untouchAll()</button>\r
						<button type="button" class="tonal" @click=\${() => form.account.name.set('')}>clear name (invalid)</button>\r
					</div>\r
				</form>\r
\r
				<h3>State flags</h3>\r
				<table class="demo-bind-mirror demo-bind-flags-table">\r
					<colgroup>\r
						<col class="band-label" />\r
						<col span="2" class="band-a" />\r
						<col span="2" class="band-b" />\r
						<col span="2" class="band-a" />\r
					</colgroup>\r
					<thead>\r
						<tr>\r
							<th></th><th>readonly.own</th><th>disabled.own</th>\r
							<th>readonly()</th><th>disabled()</th><th>touched.own</th><th>touched()</th>\r
						</tr>\r
					</thead>\r
					<tbody>\r
						\${flagRow('form (root)', form, 0)}\r
						\${flagRow('account', form.account, 1)}\r
						\${flagRow('account.email', form.account.email, 2)}\r
						\${flagRow('account.name', form.account.name, 2)}\r
						\${flagRow('address', form.address, 1)}\r
						\${flagRow('address.city', form.address.city, 2)}\r
						\${flagRow('address.notes', form.address.notes, 2)}\r
					</tbody>\r
				</table>\r
				<p class="desc">\r
					Focus a field and tab away: its <code>touched.own</code> turns on and the invalid outline appears.\r
					<code>touched()</code> on a parent is true as soon as one member is touched, while its\r
					<code>touched.own</code> stays off.\r
				</p>\r
			</section>\r
		\`;\r
	}\r
}\r
`,Bi=`// formBind(): the flags and aria attributes it puts on a bound element, all driven by state.\r
//   - touched   \`formUi.touched\`   → [data-touched] / :state(touched)   (focusout, or submit → touchAll)\r
//   - dirty     \`changes.dirty\`    → [data-dirty]   / :state(dirty)\r
//   - pending   \`check.pending.own\` → [data-pending] / :state(pending), aria-busy   (async validator)\r
//   - invalid   \`check.errors\`       → aria-invalid, and the text of the element named by aria-errormessage\r
//   - required  a \`required()\` validator (its \`flag\` is 'valueMissing') → aria-required\r
// The table reads the attributes straight off the inputs, so it shows what is really on the element.\r
import { css, signal, state, t, tag, UIElement } from '@std-ui/core';\r
import { asyncValidator, changes, check, email, formBind, formUi, minLength, required } from '@std-ui/ext';\r
\r
const form = state({ name: 'Ada', email: 'ada@example.com' }).with(check).with(changes).with(formUi);\r
\r
form.name.check.validators.set([required('Name is required'), minLength(3)]);\r
form.email.check.validators.set([\r
	required('Email is required'),\r
	email(),\r
	// Stands in for a server round trip: this address is "taken".\r
	asyncValidator<string>(\r
		async (value, { abortSignal }) => {\r
			await new Promise((resolve) => setTimeout(resolve, 900));\r
			if (abortSignal.aborted) return null;\r
			return value === 'taken@example.com' ? { flag: 'customError' as const, message: 'Already registered' } : null;\r
		},\r
		{ debounce: 300 },\r
	),\r
]);\r
\r
const FIELDS = [\r
	{ id: 'flags-name', label: 'Name' },\r
	{ id: 'flags-email', label: 'Email' },\r
] as const;\r
\r
const ATTRIBUTES = ['data-touched', 'data-dirty', 'data-pending', 'aria-invalid', 'aria-required', 'aria-busy'] as const;\r
\r
/**\r
 * Pseudo-classes are not attributes, so they are read with \`matches()\`. They only change together\r
 * with an attribute above (\`aria-invalid\` follows validity), so the table re-renders in time.\r
 */\r
const PSEUDO_CLASSES = [':invalid', '[data-touched]:invalid'] as const;\r
\r
/** Bumped whenever an attribute on an observed input changes, so the table re-reads them. */\r
const attributesChanged = signal(0);\r
\r
@tag('demo-bind-form-flags-section')\r
export class DemoBindFormFlagsSection extends UIElement {\r
	static override styles = css\`\r
		.demo-flags-error {\r
			display: block;\r
			min-height: 1.25rem;\r
			font-size: 0.8125rem;\r
			color: #b3261e;\r
		}\r
\r
		/* aria-errormessage text is always in the DOM; show it only after touched */\r
		input:not([data-touched]) + .demo-flags-error {\r
			visibility: hidden;\r
		}\r
\r
		/* an async check is running */\r
		input[data-pending] {\r
			outline: 2px dashed var(--std-sys-color-primary);\r
			cursor: progress;\r
		}\r
\r
		/* edited since the initial value */\r
		input[data-dirty] {\r
			border-left: 4px solid var(--std-sys-color-tertiary);\r
		}\r
\r
		.demo-flags-scroll {\r
			overflow-x: auto;\r
		}\r
\r
		.demo-flags-table {\r
			border-collapse: collapse;\r
			font-size: 0.8125rem;\r
			margin-top: 0.75rem;\r
		}\r
\r
		.demo-flags-table :is(th, td) {\r
			padding: 0.35rem 0.65rem;\r
			border-bottom: 1px solid var(--std-sys-color-outline-variant);\r
			text-align: center;\r
		}\r
\r
		.demo-flags-table tbody th {\r
			text-align: left;\r
			font-weight: 500;\r
		}\r
\r
		.demo-flags-table td.on code {\r
			font-weight: 700;\r
			color: var(--std-sys-color-primary);\r
		}\r
	\`;\r
\r
	#observer?: MutationObserver;\r
\r
	protected override firstUpdated(): void {\r
		const bump = () => attributesChanged.set(attributesChanged.peek() + 1);\r
		this.#observer = new MutationObserver(bump);\r
		for (const { id } of FIELDS) {\r
			const input = this.renderRoot.querySelector(\`#\${id}\`);\r
			if (input) this.#observer.observe(input, { attributes: true });\r
		}\r
		bump();\r
	}\r
\r
	protected override disconnect(): void {\r
		this.#observer?.disconnect();\r
	}\r
\r
	#row(field: (typeof FIELDS)[number]) {\r
		const input = this.renderRoot.querySelector(\`#\${field.id}\`);\r
		return t\`\r
			<tr>\r
				<th scope="row">\${field.label}</th>\r
				\${ATTRIBUTES.map((name) => {\r
					const value = input?.getAttribute(name);\r
					return t\`<td class=\${value === null || value === undefined ? '' : 'on'}><code>\${value === null || value === undefined ? '-' : value || 'present'}</code></td>\`;\r
				})}\r
				\${PSEUDO_CLASSES.map((selector) => {\r
					const on = input?.matches(selector) ?? false;\r
					return t\`<td class=\${on ? 'on' : ''}><code>\${on ? 'matches' : '-'}</code></td>\`;\r
				})}\r
			</tr>\r
		\`;\r
	}\r
\r
	protected override template() {\r
		attributesChanged(); // tracked: re-render when an observed attribute changes\r
		return t\`\r
			<section class="demo-bind-block" id="form-flags">\r
				<h2>Form flags and aria</h2>\r
				<p class="desc">\r
					Everything below is set by <code>formBind()</code> from the state. Edit a field (<code>dirty</code>),\r
					tab away (<code>touched</code>), or type <code>taken@example.com</code> in Email to see\r
					<code>pending</code> while the async check runs, then <code>aria-invalid</code> and the error text.\r
				</p>\r
\r
				<form novalidate @submit=\${(e: Event) => { e.preventDefault(); form.formUi.touchAll(); }}>\r
					<label class="demo-bind-field">\r
						Name\r
						<input id="flags-name" type="text" aria-errormessage="flags-name-error" .value=\${formBind(form.name)} />\r
						<span id="flags-name-error" class="demo-flags-error"></span>\r
					</label>\r
					<label class="demo-bind-field">\r
						Email\r
						<input id="flags-email" type="text" aria-errormessage="flags-email-error" .value=\${formBind(form.email)} />\r
						<span id="flags-email-error" class="demo-flags-error"></span>\r
					</label>\r
\r
					<div class="demo-actions">\r
						<button type="submit">Submit (touchAll)</button>\r
						<button type="button" class="tonal" @click=\${() => form.formUi.untouchAll()}>untouchAll()</button>\r
						<button\r
							type="button"\r
							class="tonal"\r
							@click=\${() => {\r
								form.name.changes.reset(form.name.peek());\r
								form.email.changes.reset(form.email.peek());\r
							}}\r
						>\r
							Mark as saved (reset)\r
						</button>\r
					</div>\r
				</form>\r
\r
				<h3>Attributes and pseudo-classes on the inputs</h3>\r
				<div class="demo-flags-scroll">\r
				<table class="demo-flags-table">\r
					<thead>\r
						<tr>\r
							<th></th>\r
							\${ATTRIBUTES.map((name) => t\`<th><code>\${name}</code></th>\`)}\r
							\${PSEUDO_CLASSES.map((selector) => t\`<th><code>\${selector}</code></th>\`)}\r
						</tr>\r
					</thead>\r
					<tbody>\r
						\${FIELDS.map((field) => this.#row(field))}\r
					</tbody>\r
				</table>\r
				</div>\r
				<p class="desc">\r
					<code>:invalid</code> is on as soon as the state has errors (it comes from the constraint validation\r
					<code>formBind</code> fills), while <code>[data-touched]:invalid</code> waits for the user, which is\r
					what the red outline uses.\r
				</p>\r
				<p class="desc">\r
					<code>aria-required</code> comes from the <code>required()</code> validator, not from the native\r
					<code>required</code> attribute, so the browser adds no second error.\r
				</p>\r
			</section>\r
		\`;\r
	}\r
}\r
`,Vi=Object.create,Hi=Object.defineProperty,Ui=Object.getOwnPropertyDescriptor,Wi=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),$=e=>{throw TypeError(e)},Gi=(e,t,n)=>t in e?Hi(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Ki=(e,t)=>Hi(e,`name`,{value:t,configurable:!0}),qi=e=>[,,,Vi(e?.[Wi(`metadata`)]??null)],Ji=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],Yi=e=>e!==void 0&&typeof e!=`function`?$(`Function expected`):e,Xi=(e,t,n,r,i)=>({kind:Ji[e],name:t,metadata:r,addInitializer:e=>n._?$(`Already initialized`):i.push(Yi(e||null))}),Zi=(e,t)=>Gi(t,Wi(`metadata`),e[3]),Qi=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},$i=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=Ji[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&Ui(d<4?i:{get[n](){return na(this,a)},set[n](e){return ra(this,a,e)}},n));d?p&&d<4&&Ki(a,(d>2?`set `:d>1?`get `:``)+n):Ki(i,n);for(var y=r.length-1;y>=0;y--)l=Xi(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>ta(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?na:ia)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>ra(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?Yi(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?$(`Object expected`):(Yi(o=s.get)&&(v.get=o),Yi(o=s.set)&&(v.set=o),Yi(o=s.init)&&g.unshift(o));return d||Zi(e,i),v&&Hi(i,n,v),p?d^4?a:v:i},ea=(e,t,n)=>t.has(e)||$(`Cannot `+n),ta=(e,t)=>Object(t)===t?e.has(t):$(`Cannot use the "in" operator on this value`),na=(e,t,n)=>(ea(e,t,`read from private field`),n?n.call(e):t.get(e)),ra=(e,t,n,r)=>(ea(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),ia=(e,t,n)=>(ea(e,t,`access private method`),n),aa,oa,sa,ca={"form-section.ts":Ai},la={"custom-section.ts":ji,"knob-control.ts":Mi,"signal-knob-control.ts":Ni},ua={"custom-event-section.ts":Pi,"swatch-control.ts":Fi},da={"validation-section.ts":Ii,"merged-control.ts (FormElement)":h,"range-control.ts (FormGroup)":v},fa={"conditional-section.ts":Li},pa={"parent-kept-validation-rule-section.ts":Ri},ma={"form-ui-section.ts":zi},ha={"form-flags-section.ts":Bi};aa=[o(`demo-bind-page`)];var ga=class extends (sa=a){template(){return t`
			<code-preview .files=${ca}><demo-bind-form-section></demo-bind-form-section></code-preview>
			<code-preview .files=${la}><demo-bind-custom-section></demo-bind-custom-section></code-preview>
			<code-preview .files=${ua}><demo-bind-custom-event-section></demo-bind-custom-event-section></code-preview>
			<code-preview .files=${da}>
				<demo-bind-validation-section></demo-bind-validation-section>
			</code-preview>
			<code-preview .files=${fa}><demo-bind-conditional-section></demo-bind-conditional-section></code-preview>
			<code-preview .files=${pa}><demo-bind-parent-kept-validation-rule-section></demo-bind-parent-kept-validation-rule-section></code-preview>
			<code-preview .files=${ma}><demo-bind-form-ui-section></demo-bind-form-ui-section></code-preview>
			<code-preview .files=${ha}>
				<demo-bind-form-flags-section></demo-bind-form-flags-section>
			</code-preview>
		`}};oa=qi(sa),ga=$i(oa,0,`DemoBindPage`,aa,ga),Qi(oa,1,ga);