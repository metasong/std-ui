// Default landing page: pitch (from the root README), design goals, and a key feature demo with code preview.
import { css, t, tag, UIElement } from '@std-ui/core';
import '../../shared/code-preview.js';
import keyFeature from './sections/key-feature-section.ts?raw';

const files = { 'key-feature-section.ts': keyFeature };

const stats: readonly (readonly [number, string, string])[] = [
	[14, ' kB', 'core, gzip'], [10, ' kB', 'add-ons, gzip'], [0, '', 'virtual DOM'], [0, '', 'build steps required'],
];

const goals: readonly (readonly [string, string])[] = [
	['Real Web Components', 'Extend <code>UIElement</code> and it works anywhere HTML works.'],
	['Fine-grained reactivity', '<code>state</code>, <code>computed</code> and <code>effect</code> update exactly the DOM that changed. No diffing, no change-detection loop.'],
	['No compiler, no runtime', 'Load one <code>&lt;script&gt;</code> and build. Decorators are optional; <code>defineElement</code> needs no compiler.'],
	['Reactive state trees', 'Wrap objects and arrays in <code>stateTree(...)</code> for deeply reactive, typed stores.'],
	['Type-safe by design', 'Fields are the store itself, so there are no decorator type lies and IntelliSense just works.'],
	['Fully extensible', 'Hooks, registries and tree extensions. <code>@std-ui/ext</code> (context, forms, change tracking) is built only on them.'],
];

@tag('demo-home-page')
export class DemoHomePage extends UIElement {
	/** Apple-style product-page motion. */
	static override styles = css`
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
	`;

	protected override firstUpdated(): void {
		const els = this.querySelectorAll<HTMLElement>('.reveal');
		const io = new IntersectionObserver((entries) => {
			for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
		}, { threshold: 0.15 });
		els.forEach((el) => io.observe(el));
		// Apple-style info cards: tilt toward the pointer and track a spotlight; neighbours recede via CSS `:has(:hover)`.
		if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
			this.querySelectorAll<HTMLElement>('.home-card').forEach((card) => {
				card.addEventListener('pointermove', (e) => {
					const r = card.getBoundingClientRect();
					const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height;
					card.classList.add('tracking');
					card.style.setProperty('--ry', `${(x - 0.5) * 16}deg`);
					card.style.setProperty('--rx', `${(0.5 - y) * 16}deg`);
					card.style.setProperty('--mx', `${x * 100}%`);
					card.style.setProperty('--my', `${y * 100}%`);
				});
				card.addEventListener('pointerleave', () => {
					card.classList.remove('tracking');
					card.style.removeProperty('--rx'); card.style.removeProperty('--ry');
				});
			});
		}		// Count the numeric stats up when they appear.
		this.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
			const end = Number(el.dataset.count); const suffix = el.dataset.suffix ?? '';
			if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
			new IntersectionObserver(([e], o) => {
				if (!e.isIntersecting) return;
				o.disconnect();
				const t0 = performance.now();
				const tick = (now: number): void => {
					const p = Math.min(1, (now - t0) / 1400);
					el.textContent = Math.round(end * (1 - (1 - p) ** 3)) + suffix;
					if (p < 1) requestAnimationFrame(tick);
				};
				requestAnimationFrame(tick);
			}).observe(el);
		});
	}

	protected override template() {
				return t`
			<div style="min-height: 130vh">
			<section id="purpose" style="scroll-margin-top: 4rem" class="home-hero">
				<h2 class="reveal">Build UI with the platform. Not around it.</h2>
				<p class="desc tagline reveal" style="--d:.15s"><strong>Signals. Tagged templates. Custom Elements.</strong> No virtual DOM. No framework runtime. No lock-in.</p>
				<p class="desc reveal" style="--d:.3s">std-ui is a tiny, standards-first UI toolkit: your components are real Web Components, your reactivity is fine-grained signals, and your templates are plain tagged template literals.</p>
				<div style="display:flex;flex-wrap:wrap;gap:2rem;margin:2rem 0">
					${stats.map(([n, s, l], i) => t`<div class="home-stat reveal" style="--d:${0.4 + i * 0.1}s;min-width:8rem;text-align:center"><b data-count="${n}" data-suffix="${s}">${n}${s}</b><small>${l}</small></div>`)}
				</div>
				<div class="demo-actions reveal" style="--d:.8s">
					<a href="#key-feature"><button type="button">Get a taste</button></a>
					<a href="/tour"><button type="button" class="tonal">Take the tour</button></a>
				</div>
			</section>
			<section id="goals" style="scroll-margin-top: 4rem">
				<h2 class="reveal">Why std-ui?</h2>
				<div class="home-cards">
					${goals.map(([h, d], i) => t`<div class="home-card reveal" style="--d:${i * 0.08}s"><h3>${h}</h3><p class="desc" .innerHTML=${d}></p></div>`)}
				</div>
			</section>
			<div class="reveal"><code-preview .files=${files}><demo-home-key-section></demo-home-key-section></code-preview></div>
			</div>
		`;
	}
}





