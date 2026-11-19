/**
 * One navigation attempt. Superseded (by a newer navigation, `stop()`, or the browser aborting
 * the event) means `signal.aborted`, so "stale" is a single concept.
 */
export class Transaction {
	readonly #ctrl = new AbortController();

	/** `parent` is the browser's navigate-event signal, when there is one. */
	constructor(parent?: AbortSignal) {
		if (parent?.aborted) this.#ctrl.abort();
		else parent?.addEventListener('abort', () => this.#ctrl.abort(), { once: true });
	}

	get signal(): AbortSignal {
		return this.#ctrl.signal;
	}

	get stale(): boolean {
		return this.#ctrl.signal.aborted;
	}

	abort(): void {
		this.#ctrl.abort();
	}
}
