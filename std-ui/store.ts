// Generic, app-agnostic observable state container. Nothing in this file knows
// anything about fireworks specifically - it's safe to lift into any project.
//
// Built on top of `./signal.ts`: `state` is backed by a `Signal<State>`, so besides the classic
// `subscribe()` API below, `store.state` can also be read from inside a `computed()`/`effect()`,
// which will auto-track it and re-run whenever `setState()` runs.

import { signal, type Signal } from './signal.js';

/** Listener called with the new state and the previous state whenever `setState()` runs. */
export type StoreListener<State> = (state: State, prevState: State) => void;

/**
 * A minimal observable state container: holds `state`, shallow-merges updates via
 * `setState()`, and notifies subscribers. That's it - no persistence, no app-specific
 * shape. Meant to be used directly or subclassed (see `../core/store.ts` for an example that
 * adds localStorage persistence on top).
 */
export class Store<State extends object> {
	#listeners = new Set<StoreListener<State>>();
	#state: Signal<State>;

	constructor(initialState: State) {
		this.#state = signal(initialState);
	}

	/** The current state. Read from inside a `computed()`/`effect()`, it auto-tracks as a dependency. */
	get state(): State {
		return this.#state();
	}

	/** Shallow-merges `nextState` into `state`, updates the backing signal, and notifies subscribers. */
	setState(nextState: Partial<State>): void {
		const prevState = this.#state.peek();
		const nextStateFull = Object.assign({}, prevState, nextState);
		this.#state.set(nextStateFull);
		this.#listeners.forEach(listener => listener(nextStateFull, prevState));
	}

	/**
	 * @returns Unsubscribe function.
	 *
	 * Fires synchronously on every `setState()` (unlike a `computed()`/`effect()` tracking
	 * `store.state`, which is microtask-batched) - `UIElement.render()` relies on that.
	 */
	subscribe(listener: StoreListener<State>): () => void {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	}
}
