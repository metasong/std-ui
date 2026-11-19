// Toy control for the bind demo: exposes `.level` and emits `level-change` on user edits only.
import { tag } from '@std-ui/core';

@tag('demo-bind-knob')
export class DemoBindKnob extends HTMLElement {
	#level = 0;
	#readout: HTMLElement | null = null;

	get level(): number {
		return this.#level;
	}

	set level(v: number) {
		const next = Number(v);
		if (Number.isNaN(next)) return;
		this.#level = next;
		this.#paint();
	}

	connectedCallback(): void {
		if (this.childElementCount > 0) return;
		const down = document.createElement('button');
		down.type = 'button';
		down.textContent = '−';
		const up = document.createElement('button');
		up.type = 'button';
		up.textContent = '+';
		this.#readout = document.createElement('span');
		this.#readout.className = 'demo-bind-knob__readout';
		down.addEventListener('click', () => this.#bump(-1));
		up.addEventListener('click', () => this.#bump(1));
		this.append(down, this.#readout, up);
		this.#paint();
	}

	#bump(delta: number): void {
		this.#level += delta;
		this.#paint();
		this.dispatchEvent(new Event('level-change', { bubbles: true }));
	}

	#paint(): void {
		if (this.#readout) this.#readout.textContent = `level ${this.#level}`;
	}
}
