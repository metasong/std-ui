// Toy control for the bind demo: exposes `.color` but emits a non-default `swatch-picked` event.
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
			b.style.cssText = `background:${c};width:1.5rem;height:1.5rem;border-radius:50%;margin-right:.25rem`;
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
