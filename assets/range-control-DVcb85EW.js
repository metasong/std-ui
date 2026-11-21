import{U as e,j as t,y as n}from"./index-DsT9IMgw.js";import{d as r,i,u as a}from"./src-vkAovAHS.js";function o(e,t){return Object.assign(e,{flag:t})}function s(e=`Required`){return o(t=>t==null||typeof t==`string`&&t===``||Array.isArray(t)&&t.length===0?{flag:i.valueMissing,message:e}:null,i.valueMissing)}function c(e,t=`Invalid format`){return o(n=>n?(e.lastIndex=0,e.test(n)?null:{flag:i.patternMismatch,message:t}):null,i.patternMismatch)}function l(e=`Invalid email`){let t=c(/^[^\s@]+@[^\s@]+\.[^\s@]+$/,e);return o(e=>{let n=t(e);return n?{flag:i.typeMismatch,message:n.message}:null},i.typeMismatch)}var u=Object.create,d=Object.defineProperty,f=Object.getOwnPropertyDescriptor,p=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),m=e=>{throw TypeError(e)},h=(e,t,n)=>t in e?d(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,g=(e,t)=>d(e,`name`,{value:t,configurable:!0}),_=e=>[,,,u(e?.[p(`metadata`)]??null)],v=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],y=e=>e!==void 0&&typeof e!=`function`?m(`Function expected`):e,ee=(e,t,n,r,i)=>({kind:v[e],name:t,metadata:r,addInitializer:e=>n._?m(`Already initialized`):i.push(y(e||null))}),b=(e,t)=>h(t,p(`metadata`),e[3]),x=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},S=(e,t,n,r,i,a)=>{var o,s,c,l,u,p=t&7,h=!!(t&8),_=!!(t&16),x=p>3?e.length+1:p?h?1:2:0,S=v[p+5],C=p>3&&(e[x-1]=[]),D=e[x]||(e[x]=[]),O=p&&(!_&&!h&&(i=i.prototype),p<5&&(p>3||!_)&&f(p<4?i:{get[n](){return w(this,a)},set[n](e){return T(this,a,e)}},n));p?_&&p<4&&g(a,(p>2?`set `:p>1?`get `:``)+n):g(i,n);for(var k=r.length-1;k>=0;k--)l=ee(p,n,c={},e[3],D),p&&(l.static=h,l.private=_,u=l.access={has:_?e=>te(i,e):e=>n in e},p^3&&(u.get=_?e=>(p^1?w:E)(e,i,p^4?a:O.get):e=>e[n]),p>2&&(u.set=_?(e,t)=>T(e,i,t,p^4?a:O.set):(e,t)=>e[n]=t)),s=(0,r[k])(p?p<4?_?a:O[S]:p>4?void 0:{get:O.get,set:O.set}:i,l),c._=1,p^4||s===void 0?y(s)&&(p>4?C.unshift(s):p?_?a=s:O[S]=s:i=s):typeof s!=`object`||!s?m(`Object expected`):(y(o=s.get)&&(O.get=o),y(o=s.set)&&(O.set=o),y(o=s.init)&&C.unshift(o));return p||b(e,i),O&&d(i,n,O),_?p^4?a:O:i},C=(e,t,n)=>t.has(e)||m(`Cannot `+n),te=(e,t)=>Object(t)===t?e.has(t):m(`Cannot use the "in" operator on this value`),w=(e,t,n)=>(C(e,t,`read from private field`),n?n.call(e):t.get(e)),T=(e,t,n,r)=>(C(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),E=(e,t,n)=>(C(e,t,`access private method`),n),D=[n(`demo-bind-range`)],O,k,A=class extends (k=a){#e=``;#t=``;get start(){return this.#e}set start(e){this.#n(`start`,e)}get end(){return this.#t}set end(e){this.#n(`end`,e)}#n(e,t){let n=String(t??``);e===`start`?this.#e=n:this.#t=n;let r=this.querySelector(`[data-field="${e}"]`);r&&r.value!==n&&(r.value=n)}validationErrorTarget(e){return this.querySelector(`[data-field="${e}"]`)}#r(e,t){this.#n(e,t.target.value),this.dispatchEvent(new Event(`${e}-change`,{bubbles:!0})),this.querySelector(`[data-message="${e}"]`)?.textContent&&this.#i(e)}#i(e){let t=this.querySelector(`[data-field="${e}"]`),n=this.querySelector(`[data-message="${e}"]`);t&&n&&(n.textContent=t.validationMessage)}template(){return e`
			<input data-field="start" placeholder="start" .value=${this.#e}
				@input=${e=>this.#r(`start`,e)} @invalid=${()=>this.#i(`start`)} />
			<small data-message="start" style="color: var(--std-sys-color-error, #b3261e)"></small>
			–
			<input data-field="end" placeholder="end" .value=${this.#t}
				@input=${e=>this.#r(`end`,e)} @invalid=${()=>this.#i(`end`)} />
			<small data-message="end" style="color: var(--std-sys-color-error, #b3261e)"></small>
		`}};O=_(k),A=S(O,0,`DemoBindRange`,D,A),x(O,1,A);var j=Object.create,M=Object.defineProperty,N=Object.getOwnPropertyDescriptor,P=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),F=e=>{throw TypeError(e)},I=(e,t,n)=>t in e?M(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,L=(e,t)=>M(e,`name`,{value:t,configurable:!0}),R=e=>[,,,j(e?.[P(`metadata`)]??null)],z=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],B=e=>e!==void 0&&typeof e!=`function`?F(`Function expected`):e,V=(e,t,n,r,i)=>({kind:z[e],name:t,metadata:r,addInitializer:e=>n._?F(`Already initialized`):i.push(B(e||null))}),H=(e,t)=>I(t,P(`metadata`),e[3]),U=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},W=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=z[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&N(d<4?i:{get[n](){return q(this,a)},set[n](e){return J(this,a,e)}},n));d?p&&d<4&&L(a,(d>2?`set `:d>1?`get `:``)+n):L(i,n);for(var y=r.length-1;y>=0;y--)l=V(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>K(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?q:Y)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>J(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?B(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?F(`Object expected`):(B(o=s.get)&&(v.get=o),B(o=s.set)&&(v.set=o),B(o=s.init)&&g.unshift(o));return d||H(e,i),v&&M(i,n,v),p?d^4?a:v:i},G=(e,t,n)=>t.has(e)||F(`Cannot `+n),K=(e,t)=>Object(t)===t?e.has(t):F(`Cannot use the "in" operator on this value`),q=(e,t,n)=>(G(e,t,`read from private field`),n?n.call(e):t.get(e)),J=(e,t,n,r)=>(G(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Y=(e,t,n)=>(G(e,t,`access private method`),n),X=[n(`demo-bind-merged`)],Z,Q,$=class extends (Q=r){static styles=t`
		:host { position: relative; display: inline-block; }
		.error-icon {
			position: absolute; left: 100%; top: 50%; translate: 0 -50%;
			display: inline-flex; align-items: center; justify-content: center;
			width: 18px; height: 18px; margin-left: 8px; border-radius: 50%;
			background: #b3261e; color: #fff; font: 700 12px/1 sans-serif;
			vertical-align: middle; opacity: 0; pointer-events: none; outline: none;
		}
		:host(:state(touched):invalid) .error-icon, :host([data-touched]:invalid) .error-icon { opacity: 1; }
	`;#e={first:``,last:``};get first(){return this.#e.first}set first(e){this.#t(`first`,e)}get last(){return this.#e.last}set last(e){this.#t(`last`,e)}#t(e,t){let n=String(t??``);this.#e[e]=n;let r=this.querySelector(`[data-field="${e}"]`);r&&r.value!==n&&(r.value=n)}get validationAnchor(){return this.querySelector(`[data-anchor]`)}#n(e,t){this.#t(e,t.target.value),this.dispatchEvent(new Event(`${e}-change`,{bubbles:!0}))}template(){return e`
			<input data-field="first" placeholder="first name" .value=${this.#e.first} @input=${e=>this.#n(`first`,e)} />
			<input data-field="last" placeholder="last name" .value=${this.#e.last} @input=${e=>this.#n(`last`,e)} />
			<span data-anchor class="error-icon" tabindex="-1" aria-hidden="true">!</span>
		`}};Z=R(Q),$=W(Z,0,`DemoBindMerged`,X,$),U(Z,1,$);var ne=`// Plain \`FormElement\` with two bound properties and NO routing: errors of both properties are merged\r
// into the host's single validity state (flags unioned, message grouped per property), anchored on\r
// \`validationAnchor\` (an error icon after the inputs, visible once touched and invalid).\r
import { css, t, tag } from '@std-ui/core';
import { FormElement } from '@std-ui/ext';\r
\r
type Key = 'first' | 'last';\r
\r
@tag('demo-bind-merged')\r
export class DemoBindMerged extends FormElement {\r
	/** The error icon is always laid out (it is the validation anchor), only visible when touched + invalid. */\r
	static override styles = css\`\r
		:host { position: relative; display: inline-block; }\r
		.error-icon {\r
			position: absolute; left: 100%; top: 50%; translate: 0 -50%;\r
			display: inline-flex; align-items: center; justify-content: center;\r
			width: 18px; height: 18px; margin-left: 8px; border-radius: 50%;\r
			background: #b3261e; color: #fff; font: 700 12px/1 sans-serif;\r
			vertical-align: middle; opacity: 0; pointer-events: none; outline: none;\r
		}\r
		:host(:state(touched):invalid) .error-icon, :host([data-touched]:invalid) .error-icon { opacity: 1; }\r
	\`;\r
\r
	#values: Record<Key, string> = { first: '', last: '' };\r
\r
	get first(): string { return this.#values.first; }\r
	set first(v: string) { this.#set('first', v); }\r
	get last(): string { return this.#values.last; }\r
	set last(v: string) { this.#set('last', v); }\r
\r
	#set(key: Key, v: string): void {\r
		const next = String(v ?? '');\r
		this.#values[key] = next;\r
		const input = this.querySelector<HTMLInputElement>(\`[data-field="\${key}"]\`);\r
		if (input && input.value !== next) input.value = next;\r
	}\r
\r
	/** One anchor for the whole host: the error icon on the right; the bubble points at it. */\r
	override get validationAnchor(): HTMLElement | null {\r
		return this.querySelector<HTMLElement>('[data-anchor]');\r
	}\r
\r
	#edit(key: Key, e: Event): void {\r
		this.#set(key, (e.target as HTMLInputElement).value);\r
		this.dispatchEvent(new Event(\`\${key}-change\`, { bubbles: true }));\r
	}\r
\r
	protected override template() {\r
		return t\`\r
			<input data-field="first" placeholder="first name" .value=\${this.#values.first} @input=\${(e: Event) => this.#edit('first', e)} />\r
			<input data-field="last" placeholder="last name" .value=\${this.#values.last} @input=\${(e: Event) => this.#edit('last', e)} />\r
			<span data-anchor class="error-icon" tabindex="-1" aria-hidden="true">!</span>\r
		\`;\r
	}\r
}\r
`,re=`// FormGroup with two inner inputs: exposes \`.start\` / \`.end\`, emits \`start-change\` / \`end-change\`,\r
// and routes each bound property's validation errors to its own inner input (\`validationErrorTarget\`).\r
import { t, tag } from '@std-ui/core';
import { FormGroup } from '@std-ui/ext';\r
\r
@tag('demo-bind-range')\r
export class DemoBindRange extends FormGroup {\r
	#start = '';\r
	#end = '';\r
\r
	get start(): string { return this.#start; }\r
	set start(v: string) { this.#set('start', v); }\r
	get end(): string { return this.#end; }\r
	set end(v: string) { this.#set('end', v); }\r
\r
	#set(key: 'start' | 'end', v: string): void {\r
		const next = String(v ?? '');\r
		if (key === 'start') this.#start = next; else this.#end = next;\r
		const input = this.querySelector<HTMLInputElement>(\`[data-field="\${key}"]\`);\r
		if (input && input.value !== next) input.value = next;\r
	}\r
\r
	/** Each bound property's errors go to its own inner input (its own validity state and bubble). */\r
	override validationErrorTarget(property: string): HTMLInputElement | null {\r
		return this.querySelector<HTMLInputElement>(\`[data-field="\${property}"]\`);\r
	}\r
\r
	#edit(key: 'start' | 'end', e: Event): void {\r
		this.#set(key, (e.target as HTMLInputElement).value);\r
		this.dispatchEvent(new Event(\`\${key}-change\`, { bubbles: true }));\r
		// Model validators have updated the input's validity by now; refresh a message already shown.\r
		const message = this.querySelector<HTMLElement>(\`[data-message="\${key}"]\`);\r
		if (message?.textContent) this.#showMessage(key);\r
	}\r
\r
	/** Every inner input fires \`invalid\` on \`reportValidity()\`, so all errors can show at once. */\r
	#showMessage(key: string): void {\r
		const input = this.querySelector<HTMLInputElement>(\`[data-field="\${key}"]\`);\r
		const message = this.querySelector<HTMLElement>(\`[data-message="\${key}"]\`);\r
		if (input && message) message.textContent = input.validationMessage;\r
	}\r
\r
	protected override template() {\r
		return t\`\r
			<input data-field="start" placeholder="start" .value=\${this.#start}\r
				@input=\${(e: Event) => this.#edit('start', e)} @invalid=\${() => this.#showMessage('start')} />\r
			<small data-message="start" style="color: var(--std-sys-color-error, #b3261e)"></small>\r
			–\r
			<input data-field="end" placeholder="end" .value=\${this.#end}\r
				@input=\${(e: Event) => this.#edit('end', e)} @invalid=\${() => this.#showMessage('end')} />\r
			<small data-message="end" style="color: var(--std-sys-color-error, #b3261e)"></small>\r
		\`;\r
	}\r
}\r
`;export{s as a,c as i,ne as n,o,l as r,re as t};