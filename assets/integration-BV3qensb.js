import{U as e,b as t,d as n,j as r,m as i,y as a}from"./index-DsT9IMgw.js";import"./code-preview-BoRCt_Z-.js";import{a as o,c as s,l as c,t as l}from"./src-vkAovAHS.js";import{a as u,n as d,r as f,t as p}from"./range-control-DVcb85EW.js";import{t as m}from"./virtualize-list-styles-DuOPBH_K.js";var h=Object.create,g=Object.defineProperty,_=Object.getOwnPropertyDescriptor,v=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),y=e=>{throw TypeError(e)},ee=(e,t,n)=>t in e?g(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,te=(e,t)=>g(e,`name`,{value:t,configurable:!0}),b=e=>[,,,h(e?.[v(`metadata`)]??null)],x=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],S=e=>e!==void 0&&typeof e!=`function`?y(`Function expected`):e,ne=(e,t,n,r,i)=>({kind:x[e],name:t,metadata:r,addInitializer:e=>n._?y(`Already initialized`):i.push(S(e||null))}),re=(e,t)=>ee(t,v(`metadata`),e[3]),C=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},ie=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=x[d+5],v=d>3&&(e[m-1]=[]),ee=e[m]||(e[m]=[]),b=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&_(d<4?i:{get[n](){return T(this,a)},set[n](e){return E(this,a,e)}},n));d?p&&d<4&&te(a,(d>2?`set `:d>1?`get `:``)+n):te(i,n);for(var C=r.length-1;C>=0;C--)l=ne(d,n,c={},e[3],ee),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>ae(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?T:oe)(e,i,d^4?a:b.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>E(e,i,t,d^4?a:b.set):(e,t)=>e[n]=t)),s=(0,r[C])(d?d<4?p?a:b[h]:d>4?void 0:{get:b.get,set:b.set}:i,l),c._=1,d^4||s===void 0?S(s)&&(d>4?v.unshift(s):d?p?a=s:b[h]=s:i=s):typeof s!=`object`||!s?y(`Object expected`):(S(o=s.get)&&(b.get=o),S(o=s.set)&&(b.set=o),S(o=s.init)&&v.unshift(o));return d||re(e,i),b&&g(i,n,b),p?d^4?a:b:i},w=(e,t,n)=>t.has(e)||y(`Cannot `+n),ae=(e,t)=>Object(t)===t?e.has(t):y(`Cannot use the "in" operator on this value`),T=(e,t,n)=>(w(e,t,`read from private field`),n?n.call(e):t.get(e)),E=(e,t,n,r)=>(w(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),oe=(e,t,n)=>(w(e,t,`access private method`),n),D,O,se,k=t({email:``,first:``,last:``,start:``,end:``}).with(o).with(l);k.email.check.validators.set([u(`Email is required`),f(`Not a valid email`)]),k.first.check.validators.set([u(`First name required`)]),k.last.check.validators.set([u(`Last name required`)]),k.start.check.validators.set([u(`Start required`)]),k.end.check.validators.set([u(`End required`),e=>!e||!k.start()||String(e)>=String(k.start())?void 0:{flag:`rangeUnderflow`,message:`End is before start`}]),D=[a(`demo-integration-signup`)];var A=class extends (se=i){static styles=r`
		input:read-only:not([type='checkbox']):not([type='radio']),
		textarea:read-only {
			background-color: var(--std-sys-color-surface-container-high);
			color: var(--std-sys-color-on-surface-variant);
		}

		input:disabled:not([type='checkbox']):not([type='radio']),
		textarea:disabled {
			opacity: 0.65;
			cursor: not-allowed;
		}

		.demo-form-toggles {
			display: flex;
			flex-wrap: wrap;
			gap: 0.75rem 1rem;
			margin: 0.5rem 0 0;
			font-size: 0.875rem;
		}

		.demo-form-toggles label {
			display: inline-flex;
			align-items: center;
			gap: 0.35rem;
		}
	`;submitted=t(``);#e(e){e.preventDefault(),k.formUi.touchAll(),this.submitted.set(JSON.stringify(k(),null,2))}#t(){k.email.set(``),k.first.set(``),k.last.set(``),k.start.set(``),k.end.set(``),k.formUi.untouchAll(),this.submitted.set(``)}template(){let t=k.check.errors.all();return e`
			<section class="demo-bind-block" id="signup">
				<h2>Sign-up form: binding + validation + form elements</h2>
				<p class="desc">
					One model, three kinds of control. Press <em>Submit</em> with empty fields: the browser blocks the
					submit and points at the first invalid control. Errors show on a control once it has been touched.
				</p>

				<form @submit=${e=>this.#e(e)}>
					<label class="demo-bind-field">
						Email (native input)
						<input type="text" .value=${s(k.email)} title=${k.email.check.errors().map(e=>e.message).join(`
`)} />
					</label>

					<p class="desc">Name (<code>FormElement</code>, errors merged into one state)</p>
					<demo-bind-merged .first=${s(k.first)} .last=${s(k.last)}></demo-bind-merged>

					<p class="desc">Stay (<code>FormGroup</code>, errors routed to each inner input)</p>
					<demo-bind-range .start=${s(k.start)} .end=${s(k.end)}></demo-bind-range>

					<div class="demo-actions">
						<button type="submit">Submit</button>
						<button type="button" class="tonal" @click=${()=>this.#t()}>Reset model</button>
					</div>
					<p class="demo-form-toggles">
						<label><input type="checkbox" .checked=${n(k.formUi.readonly.own)} /> Read-only (<code>formUi.readonly.own</code>)</label>
						<label><input type="checkbox" .checked=${n(k.formUi.disabled.own)} /> Disable form (<code>formUi.disabled.own</code>)</label>
					</p>
				</form>

				<p class="demo-bind-mirror">Model valid: <code>${String(k.check.valid())}</code></p>
				<pre class="demo-bind-mirror">${t.length?t.map(e=>`${e.path.join(`.`)}: ${e.message}`).join(`
`):`No errors`}</pre>
				<pre class="demo-bind-mirror">${this.submitted()||`Nothing submitted yet.`}</pre>
			</section>
		`}};O=b(se),A=ie(O,0,`DemoIntegrationSignup`,D,A),C(O,1,A);var ce=Object.create,j=Object.defineProperty,le=Object.getOwnPropertyDescriptor,M=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),N=e=>{throw TypeError(e)},ue=(e,t,n)=>t in e?j(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,P=(e,t)=>j(e,`name`,{value:t,configurable:!0}),de=e=>[,,,ce(e?.[M(`metadata`)]??null)],F=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],I=e=>e!==void 0&&typeof e!=`function`?N(`Function expected`):e,fe=(e,t,n,r,i)=>({kind:F[e],name:t,metadata:r,addInitializer:e=>n._?N(`Already initialized`):i.push(I(e||null))}),pe=(e,t)=>ue(t,M(`metadata`),e[3]),me=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},he=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=F[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&le(d<4?i:{get[n](){return R(this,a)},set[n](e){return z(this,a,e)}},n));d?p&&d<4&&P(a,(d>2?`set `:d>1?`get `:``)+n):P(i,n);for(var y=r.length-1;y>=0;y--)l=fe(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>ge(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?R:_e)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>z(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?I(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?N(`Object expected`):(I(o=s.get)&&(v.get=o),I(o=s.set)&&(v.set=o),I(o=s.init)&&g.unshift(o));return d||pe(e,i),v&&j(i,n,v),p?d^4?a:v:i},L=(e,t,n)=>t.has(e)||N(`Cannot `+n),ge=(e,t)=>Object(t)===t?e.has(t):N(`Cannot use the "in" operator on this value`),R=(e,t,n)=>(L(e,t,`read from private field`),n?n.call(e):t.get(e)),z=(e,t,n,r)=>(L(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),_e=(e,t,n)=>(L(e,t,`access private method`),n),B,V,H,U=[`Ada`,`Alan`,`Grace`,`Linus`,`Margaret`,`Dennis`,`Barbara`,`Ken`,`Edsger`,`Radia`],ve=()=>Array.from({length:5e3},(e,t)=>({id:t,name:`${U[t%U.length]} #${t}`,age:18+t%60})),W=t({name:``,age:30}).with(o).with(l);W.name.check.validators.set([e=>e?void 0:{flag:`valueMissing`,message:`Name is required`},e=>String(e).length>=3?void 0:{flag:`tooShort`,message:`At least 3 characters`}]),W.age.check.validators.set([e=>e>=18&&e<=120?void 0:{flag:`rangeOverflow`,message:`Age must be 18–120`}]),B=[a(`demo-integration-directory`)];var G=class extends (H=i){static styles=m;people=t(ve());search=t(``);#e=5e3;#t(){let e=this.search().trim().toLowerCase(),t=this.people();return e?t.filter(t=>t.name.toLowerCase().includes(e)):t}#n(){if(W.formUi.touchAll(),!W.check.valid()){this.querySelector(`form`)?.reportValidity();return}let e={id:this.#e++,name:W.name(),age:Number(W.age())};this.people.update(t=>[e,...t]),W.name.set(``),W.formUi.untouchAll()}template(){let t=this.#t();return e`
			<section class="demo-bind-block" id="directory">
				<h2>People directory</h2>
				<p class="desc">
					<code>bind()</code> drives the search box, <code>formBind()</code> the form: validators on the model
					are mirrored onto the inputs and <code>formUi</code> tracks touched, and <code>virtualize()</code> keeps the list small however many people match.
				</p>

				<label class="demo-bind-field">
					Search
					<input type="search" placeholder="filter by name" .value=${n(this.search)} />
				</label>
				<p class="demo-bind-mirror">Showing <code>${t.length}</code> of <code>${this.people().length}</code></p>

				<div class="demo-v-scroller demo-v-scroller-y">
					<div>
						${c(t,{itemSize:36,gap:0,overscan:4,keyFn:e=>e.id,renderItem:t=>e`
								<div class="demo-v-row ${t.id%2==0?`demo-v-row-even`:``}" style="height: 36px; box-sizing: border-box">
									<span>${t.name} · ${t.age}</span>
								</div>
							`})}
					</div>
				</div>

				<h3>Add a person</h3>
				<form @submit=${e=>{e.preventDefault(),this.#n()}}>
					<label class="demo-bind-field">
						Name
						<input type="text" .value=${s(W.name)} />
					</label>
					<label class="demo-bind-field">
						Age
						<input type="number" .value=${s(W.age)} />
					</label>
					<div class="demo-actions">
						<button type="submit">Add</button>
					</div>
				</form>
			</section>
		`}};V=de(H),G=he(V,0,`DemoIntegrationDirectory`,B,G),me(V,1,G);var ye=`// Integration: one <form> mixing a native control, a plain FormElement and a FormGroup, all bound to the\r
// same \`state\` model whose validators drive every control's constraint validation.\r
//   - native <input>         → formBind() mirrors errors via setCustomValidity\r
//   - FormElement (merged)   → first/last errors unioned into the host's single validity state\r
//   - FormGroup (range)      → each property's errors routed to its own inner input\r
// The browser's own submit validation then blocks the submit while any control is invalid.\r
import { bind, css, t, tag, UIElement, state } from '@std-ui/core';
import { check, formBind, formUi, required, email } from '@std-ui/ext';\r
import '../../bind/sections/validation/merged-control.js';\r
import '../../bind/sections/validation/range-control.js';\r
\r
const model = state({ email: '', first: '', last: '', start: '', end: '' }).with(check).with(formUi);\r
model.email.check.validators.set([required('Email is required'), email('Not a valid email')]);\r
model.first.check.validators.set([required('First name required')]);\r
model.last.check.validators.set([required('Last name required')]);\r
model.start.check.validators.set([required('Start required')]);\r
model.end.check.validators.set([\r
	required('End required'),\r
	v => (!v || !model.start() || String(v) >= String(model.start()) ? undefined : { flag: 'rangeUnderflow' as const, message: 'End is before start' }),\r
]);\r
\r
@tag('demo-integration-signup')\r
export class DemoIntegrationSignup extends UIElement {\r
	static override styles = css\`\r
		input:read-only:not([type='checkbox']):not([type='radio']),\r
		textarea:read-only {\r
			background-color: var(--std-sys-color-surface-container-high);\r
			color: var(--std-sys-color-on-surface-variant);\r
		}\r
\r
		input:disabled:not([type='checkbox']):not([type='radio']),\r
		textarea:disabled {\r
			opacity: 0.65;\r
			cursor: not-allowed;\r
		}\r
\r
		.demo-form-toggles {\r
			display: flex;\r
			flex-wrap: wrap;\r
			gap: 0.75rem 1rem;\r
			margin: 0.5rem 0 0;\r
			font-size: 0.875rem;\r
		}\r
\r
		.demo-form-toggles label {\r
			display: inline-flex;\r
			align-items: center;\r
			gap: 0.35rem;\r
		}\r
	\`;\r
\r
	readonly submitted = state('');\r
\r
	#submit(e: Event): void {\r
		e.preventDefault();\r
		model.formUi.touchAll();\r
		this.submitted.set(JSON.stringify(model(), null, 2));\r
	}\r
\r
	#reset(): void {\r
		model.email.set('');\r
		model.first.set('');\r
		model.last.set('');\r
		model.start.set('');\r
		model.end.set('');\r
		model.formUi.untouchAll();\r
		this.submitted.set('');\r
	}\r
\r
	protected override template() {\r
		const errors = model.check.errors.all();\r
		return t\`\r
			<section class="demo-bind-block" id="signup">\r
				<h2>Sign-up form: binding + validation + form elements</h2>\r
				<p class="desc">\r
					One model, three kinds of control. Press <em>Submit</em> with empty fields: the browser blocks the\r
					submit and points at the first invalid control. Errors show on a control once it has been touched.\r
				</p>\r
\r
				<form @submit=\${(e: Event) => this.#submit(e)}>\r
					<label class="demo-bind-field">\r
						Email (native input)\r
						<input type="text" .value=\${formBind(model.email)} title=\${model.email.check.errors().map(e => e.message).join('\\n')} />\r
					</label>\r
\r
					<p class="desc">Name (<code>FormElement</code>, errors merged into one state)</p>\r
					<demo-bind-merged .first=\${formBind(model.first)} .last=\${formBind(model.last)}></demo-bind-merged>\r
\r
					<p class="desc">Stay (<code>FormGroup</code>, errors routed to each inner input)</p>\r
					<demo-bind-range .start=\${formBind(model.start)} .end=\${formBind(model.end)}></demo-bind-range>\r
\r
					<div class="demo-actions">\r
						<button type="submit">Submit</button>\r
						<button type="button" class="tonal" @click=\${() => this.#reset()}>Reset model</button>\r
					</div>\r
					<p class="demo-form-toggles">\r
						<label><input type="checkbox" .checked=\${bind(model.formUi.readonly.own)} /> Read-only (<code>formUi.readonly.own</code>)</label>\r
						<label><input type="checkbox" .checked=\${bind(model.formUi.disabled.own)} /> Disable form (<code>formUi.disabled.own</code>)</label>\r
					</p>\r
				</form>\r
\r
				<p class="demo-bind-mirror">Model valid: <code>\${String(model.check.valid())}</code></p>\r
				<pre class="demo-bind-mirror">\${errors.length ? errors.map(e => \`\${e.path.join('.')}: \${e.message}\`).join('\\n') : 'No errors'}</pre>\r
				<pre class="demo-bind-mirror">\${this.submitted() || 'Nothing submitted yet.'}</pre>\r
			</section>\r
		\`;\r
	}\r
}\r
`,be=`// Integration: a people directory combining several features at once.\r
//   - \`state\` + validators      → the "add person" form model\r
//   - \`bind()\` / \`formBind()\`   → two-way search box; form fields with validation + touched mirrored onto the inputs\r
//   - \`virtualize()\`                  → the (filtered) list stays windowed however many people exist\r
//   - \`state\` + \`UIElement\`/\`t\` → the list itself and re-rendering\r
import { bind, t, tag, UIElement, state } from '@std-ui/core';
import { check, formBind, formUi, virtualize } from '@std-ui/ext';\r
import { virtualizeListStyles } from '../../../shared/virtualize-list-styles.js';\r
\r
type Person = { id: number; name: string; age: number };\r
\r
const NAMES = ['Ada', 'Alan', 'Grace', 'Linus', 'Margaret', 'Dennis', 'Barbara', 'Ken', 'Edsger', 'Radia'];\r
const seed = (): Person[] =>\r
	Array.from({ length: 5_000 }, (_, id) => ({ id, name: \`\${NAMES[id % NAMES.length]} #\${id}\`, age: 18 + (id % 60) }));\r
\r
const draft = state({ name: '', age: 30 }).with(check).with(formUi);\r
draft.name.check.validators.set([\r
	v => (v ? undefined : { flag: 'valueMissing' as const, message: 'Name is required' }),\r
	v => (String(v).length >= 3 ? undefined : { flag: 'tooShort' as const, message: 'At least 3 characters' }),\r
]);\r
draft.age.check.validators.set([\r
	v => (v >= 18 && v <= 120 ? undefined : { flag: 'rangeOverflow' as const, message: 'Age must be 18–120' }),\r
]);\r
\r
@tag('demo-integration-directory')\r
export class DemoIntegrationDirectory extends UIElement {\r
	static override styles = virtualizeListStyles;\r
\r
	readonly people = state<Person[]>(seed());\r
	readonly search = state('');\r
	#nextId = 5_000;\r
\r
	#visible(): Person[] {\r
		const q = this.search().trim().toLowerCase();\r
		const all = this.people();\r
		return q ? all.filter(p => p.name.toLowerCase().includes(q)) : all;\r
	}\r
\r
	#add(): void {\r
		draft.formUi.touchAll();\r
		if (!draft.check.valid()) {\r
			this.querySelector<HTMLFormElement>('form')?.reportValidity();\r
			return;\r
		}\r
		const person: Person = { id: this.#nextId++, name: draft.name(), age: Number(draft.age()) };\r
		this.people.update(list => [person, ...list]);\r
		draft.name.set('');\r
		draft.formUi.untouchAll();\r
	}\r
\r
	protected override template() {\r
		const visible = this.#visible();\r
		return t\`\r
			<section class="demo-bind-block" id="directory">\r
				<h2>People directory</h2>\r
				<p class="desc">\r
					<code>bind()</code> drives the search box, <code>formBind()</code> the form: validators on the model\r
					are mirrored onto the inputs and <code>formUi</code> tracks touched, and <code>virtualize()</code> keeps the list small however many people match.\r
				</p>\r
\r
				<label class="demo-bind-field">\r
					Search\r
					<input type="search" placeholder="filter by name" .value=\${bind(this.search)} />\r
				</label>\r
				<p class="demo-bind-mirror">Showing <code>\${visible.length}</code> of <code>\${this.people().length}</code></p>\r
\r
				<div class="demo-v-scroller demo-v-scroller-y">\r
					<div>\r
						\${virtualize(visible, {\r
							itemSize: 36,\r
							gap: 0,\r
							overscan: 4,\r
							keyFn: (p: Person) => p.id,\r
							renderItem: (p: Person) => t\`\r
								<div class="demo-v-row \${p.id % 2 === 0 ? 'demo-v-row-even' : ''}" style="height: 36px; box-sizing: border-box">\r
									<span>\${p.name} · \${p.age}</span>\r
								</div>\r
							\`,\r
						})}\r
					</div>\r
				</div>\r
\r
				<h3>Add a person</h3>\r
				<form @submit=\${(e: Event) => { e.preventDefault(); this.#add(); }}>\r
					<label class="demo-bind-field">\r
						Name\r
						<input type="text" .value=\${formBind(draft.name)} />\r
					</label>\r
					<label class="demo-bind-field">\r
						Age\r
						<input type="number" .value=\${formBind(draft.age)} />\r
					</label>\r
					<div class="demo-actions">\r
						<button type="submit">Add</button>\r
					</div>\r
				</form>\r
			</section>\r
		\`;\r
	}\r
}\r
`,xe=Object.create,K=Object.defineProperty,Se=Object.getOwnPropertyDescriptor,q=(e,t)=>(t=Symbol[e])?t:Symbol.for(`Symbol.`+e),J=e=>{throw TypeError(e)},Ce=(e,t,n)=>t in e?K(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,we=(e,t)=>K(e,`name`,{value:t,configurable:!0}),Te=e=>[,,,xe(e?.[q(`metadata`)]??null)],Ee=[`class`,`method`,`getter`,`setter`,`accessor`,`field`,`value`,`get`,`set`],Y=e=>e!==void 0&&typeof e!=`function`?J(`Function expected`):e,De=(e,t,n,r,i)=>({kind:Ee[e],name:t,metadata:r,addInitializer:e=>n._?J(`Already initialized`):i.push(Y(e||null))}),Oe=(e,t)=>Ce(t,q(`metadata`),e[3]),ke=(e,t,n,r)=>{for(var i=0,a=e[t>>1],o=a&&a.length;i<o;i++)t&1?a[i].call(n):r=a[i].call(n,r);return r},Ae=(e,t,n,r,i,a)=>{var o,s,c,l,u,d=t&7,f=!!(t&8),p=!!(t&16),m=d>3?e.length+1:d?f?1:2:0,h=Ee[d+5],g=d>3&&(e[m-1]=[]),_=e[m]||(e[m]=[]),v=d&&(!p&&!f&&(i=i.prototype),d<5&&(d>3||!p)&&Se(d<4?i:{get[n](){return Me(this,a)},set[n](e){return Z(this,a,e)}},n));d?p&&d<4&&we(a,(d>2?`set `:d>1?`get `:``)+n):we(i,n);for(var y=r.length-1;y>=0;y--)l=De(d,n,c={},e[3],_),d&&(l.static=f,l.private=p,u=l.access={has:p?e=>je(i,e):e=>n in e},d^3&&(u.get=p?e=>(d^1?Me:Ne)(e,i,d^4?a:v.get):e=>e[n]),d>2&&(u.set=p?(e,t)=>Z(e,i,t,d^4?a:v.set):(e,t)=>e[n]=t)),s=(0,r[y])(d?d<4?p?a:v[h]:d>4?void 0:{get:v.get,set:v.set}:i,l),c._=1,d^4||s===void 0?Y(s)&&(d>4?g.unshift(s):d?p?a=s:v[h]=s:i=s):typeof s!=`object`||!s?J(`Object expected`):(Y(o=s.get)&&(v.get=o),Y(o=s.set)&&(v.set=o),Y(o=s.init)&&g.unshift(o));return d||Oe(e,i),v&&K(i,n,v),p?d^4?a:v:i},X=(e,t,n)=>t.has(e)||J(`Cannot `+n),je=(e,t)=>Object(t)===t?e.has(t):J(`Cannot use the "in" operator on this value`),Me=(e,t,n)=>(X(e,t,`read from private field`),n?n.call(e):t.get(e)),Z=(e,t,n,r)=>(X(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Ne=(e,t,n)=>(X(e,t,`access private method`),n),Pe,Q,Fe,Ie={"signup-form-section.ts":ye,"merged-control.ts (FormElement)":d,"range-control.ts (FormGroup)":p},Le={"directory-section.ts":be};Pe=[a(`demo-integration-page`)];var $=class extends (Fe=i){template(){return e`
			<code-preview .files=${Ie}>
				<demo-integration-signup></demo-integration-signup>
			</code-preview>
			<code-preview .files=${Le}>
				<demo-integration-directory></demo-integration-directory>
			</code-preview>
		`}};Q=Te(Fe),$=Ae(Q,0,`DemoIntegrationPage`,Pe,$),ke(Q,1,$);