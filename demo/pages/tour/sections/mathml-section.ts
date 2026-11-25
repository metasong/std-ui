// Demonstrates: the `math` tag — composing MathML from small reusable *fragments* (no `<math>` ancestor in
// each template string): fractions, roots, superscripts, sums, integrals and matrices, driven by live state.
import { tag, t, math, UIElement } from '@std-ui/core';
import { stateTree } from '@std-ui/ext';

// --- Reusable MathML fragments (each is parsed in the MathML namespace) -----------------------------
const mi = (x: string) => math`<mi>${x}</mi>`;
const mn = (x: number | string) => math`<mn>${x}</mn>`;
const mo = (x: string) => math`<mo>${x}</mo>`;
const row = (...xs: unknown[]) => math`<mrow>${xs}</mrow>`;
const frac = (num: unknown, den: unknown) => math`<mfrac>${row(num)}${row(den)}</mfrac>`;
const sqrt = (x: unknown) => math`<msqrt>${x}</msqrt>`;
const sup = (base: unknown, exp: unknown) => math`<msup>${row(base)}${row(exp)}</msup>`;
const sub = (base: unknown, s: unknown) => math`<msub>${row(base)}${row(s)}</msub>`;
const sum = (from: unknown, to: unknown, body: unknown) =>
	math`<mrow><munderover><mo>&sum;</mo>${row(from)}${row(to)}</munderover>${body}</mrow>`;
const integral = (from: unknown, to: unknown, body: unknown) =>
	math`<mrow><msubsup><mo>&int;</mo>${row(from)}${row(to)}</msubsup>${body}</mrow>`;
const matrix = (rows: unknown[][]) =>
	math`<mrow><mo>(</mo><mtable>${rows.map(
		(r) => math`<mtr>${r.map((c) => math`<mtd>${c}</mtd>`)}</mtr>`,
	)}</mtable><mo>)</mo></mrow>`;

// What a plain `t` fragment does instead: HTMLUnknownElement, not typeset.
const plainFrac = (n: string, d: string) => t`<mfrac><mi>${n}</mi><mi>${d}</mi></mfrac>`;

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(3));

@tag('demo-mathml-section')
export class DemoMathmlSection extends UIElement {
	readonly a = stateTree(1);
	readonly b = stateTree(-3);
	readonly c = stateTree(2);
	readonly report = stateTree('');

	protected override template() {
		const [a, b, c] = [this.a.get(), this.b.get(), this.c.get()];
		const disc = b * b - 4 * a * c;

		// x = (-b ± sqrt(b^2 - 4ac)) / 2a, built from fragments
		const quadratic = math`<math display="block">
			${mi('x')}${mo('=')}
			${frac(
				[mo('\u2212'), mi('b'), mo('\u00b1'), sqrt([sup(mi('b'), mn(2)), mo('\u2212'), mn(4), mi('a'), mi('c')])],
				[mn(2), mi('a')],
			)}
		</math>`;

		// the same formula with this page's coefficients substituted
		const roots =
			a === 0
				? 'a must not be 0'
				: disc >= 0
					? `x\u2081 = ${fmt((-b + Math.sqrt(disc)) / (2 * a))},  x\u2082 = ${fmt((-b - Math.sqrt(disc)) / (2 * a))}`
					: `x = ${fmt(-b / (2 * a))} \u00b1 ${fmt(Math.sqrt(-disc) / (2 * a))}i`;

		return t`
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
				<label>a = ${a} <input type="range" min="-5" max="5" step="1" .value=${String(a)} @input=${(e: Event) => this.a.set(+(e.target as HTMLInputElement).value)} /></label>
				<label>b = ${b} <input type="range" min="-10" max="10" step="1" .value=${String(b)} @input=${(e: Event) => this.b.set(+(e.target as HTMLInputElement).value)} /></label>
				<label>c = ${c} <input type="range" min="-10" max="10" step="1" .value=${String(c)} @input=${(e: Event) => this.c.set(+(e.target as HTMLInputElement).value)} /></label>
			</div>

			<div style="background:#e6f4ea;border:1px solid #34a853;border-radius:12px;padding:0.5rem 1rem;margin:1rem 0">
			<p style="color:#137333;font-weight:500">&#10004; <code>math</code> fragments - typeset</p>
			<h3>Quadratic formula</h3>
			<div id="math-rich" style="font-size:1.6rem">
				${quadratic}
				<math display="block">
					${row(mi('a'), sup(mi('x'), mn(2)), mo('+'), mi('b'), mi('x'), mo('+'), mi('c'), mo('='), mn(0))}
					<mspace width="2em"></mspace>
					${row(mi('a'), mo('='), mn(a), mo(','), mi('b'), mo('='), mn(b), mo(','), mi('c'), mo('='), mn(c))}
				</math>
			</div>
			<p>Discriminant <strong>${fmt(disc)}</strong> &rarr; <strong>${roots}</strong></p>

			<h3>Matrix and determinant</h3>
			<div style="font-size:1.6rem">
				<math display="block">
					${row(mi('M'), mo('='), matrix([[mn(a), mn(b)], [mn(b), mn(c)]]), mo(','), mspaceRow())}
					${row(mi('det'), mo('\u2061'), mi('M'), mo('='), mi('a'), mi('c'), mo('\u2212'), sup(mi('b'), mn(2)), mo('='), mn(a * c - b * b))}
				</math>
			</div>

			<h3>Sums and integrals</h3>
			<div style="font-size:1.6rem">
				<math display="block">
					${row(sum([mi('n'), mo('='), mn(1)], mo('\u221e'), frac(mn(1), sup(mi('n'), mn(2)))), mo('='), frac(sup(mi('\u03c0'), mn(2)), mn(6)))}
				</math>
				<math display="block">
					${row(integral(mo('\u2212\u221e'), mo('\u221e'), [sup(mi('e'), row(mo('\u2212'), sup(mi('x'), mn(2)))), mi('d'), mi('x')]), mo('='), sqrt(mi('\u03c0')))}
				</math>
				<math display="block">
					${row(sub(mi('F'), mi('n')), mo('='), frac(sup(row(mo('('), mn(1), mo('+'), sqrt(mn(5)), mo(')')), mi('n')), row(sup(mn(2), mi('n')), sqrt(mn(5)))))}
				</math>
			</div>

			</div>

			<div style="background:#fce8e6;border:1px solid #ea4335;border-radius:12px;padding:0.5rem 1rem;margin:1rem 0">
				<p style="color:#c5221f;font-weight:500">&#10008; plain <code>t</code> fragment - not typeset</p>
				<div style="font-size:1.6rem">
					<math id="math-plain">${plainFrac('a', 'b')}</math>
					<small>&larr; a/b should render as a fraction, but renders nothing</small>
				</div>
			</div>
			<pre style="white-space:pre-wrap;font-size:0.8rem">${this.report.get()}</pre>
		`;
	}

	protected override firstUpdated(): void {
		requestAnimationFrame(() => this.report.set(this.describe()));
	}

	private describe(): string {
		const count = (selector: string) => {
			const tally = new Map<string, number>();
			for (const el of this.querySelectorAll(selector)) {
				const key = `${el.constructor.name} (${el.namespaceURI})`;
				tally.set(key, (tally.get(key) ?? 0) + 1);
			}
			return [...tally].map(([k, n]) => `  ${n} x ${k}`).join('\n');
		};
		return `plain t, elements under #math-plain:\n${count('#math-plain *')}\n\nmath, elements under #math-rich:\n${count('#math-rich *')}`;
	}
}

function mspaceRow() {
	return math`<mspace width="2em"></mspace>`;
}
