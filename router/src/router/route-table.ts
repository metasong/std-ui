import type { RouteDef } from '../types.js';

/** Config-table routes plus routes registered at runtime (`<std-route>`). */
export class RouteTable {
	readonly #config: RouteDef[];
	readonly #markup: RouteDef[] = [];
	readonly #onChange: () => void;

	constructor(config: RouteDef[], onChange: () => void) {
		this.#config = config;
		this.#onChange = onChange;
	}

	get all(): RouteDef[] {
		return [...this.#config, ...this.#markup];
	}

	/** Registers a route (markup routes pass their parent's def). Returns an unregister function. */
	add(def: RouteDef, parent?: RouteDef): () => void {
		const list = parent ? (parent.children ??= []) : this.#markup;
		list.push(def);
		this.#onChange();
		return () => {
			const i = list.indexOf(def);
			if (i >= 0) list.splice(i, 1);
			this.#onChange();
		};
	}
}
