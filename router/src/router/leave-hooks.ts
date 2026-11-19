import type { BeforeLeaveHook, BeforeLeaveOptions, LeaveContext } from '../types.js';

interface Entry {
	hook: BeforeLeaveHook;
	unload?: () => boolean;
}

/** `beforeLeave` hooks, and the `beforeunload` prompt for hooks that report unsaved work. */
export class LeaveHooks {
	readonly #entries = new Set<Entry>();
	#active = false;
	#listener: ((e: BeforeUnloadEvent) => void) | null = null;

	add(hook: BeforeLeaveHook, options: BeforeLeaveOptions = {}): () => void {
		const entry: Entry = { hook, unload: options.unload };
		this.#entries.add(entry);
		this.#syncListener();
		return () => {
			this.#entries.delete(entry);
			this.#syncListener();
		};
	}

	/** The prompt is only wanted while the router is started. */
	setActive(active: boolean): void {
		this.#active = active;
		this.#syncListener();
	}

	/** Runs hooks in registration order; `false` from any blocks. */
	async run(ctx: LeaveContext, isStale: () => boolean): Promise<'ok' | 'block' | 'stale'> {
		for (const { hook } of [...this.#entries]) {
			const verdict = await hook(ctx);
			if (isStale()) return 'stale';
			if (verdict === false) return 'block';
		}
		return 'ok';
	}

	// Attached only while active and some hook has an `unload` check, so idle routers never add a prompt.
	#syncListener(): void {
		if (typeof window === 'undefined') return;
		const wanted = this.#active && [...this.#entries].some((e) => e.unload);
		if (wanted && !this.#listener) {
			this.#listener = (e) => {
				if (![...this.#entries].some((x) => x.unload?.())) return;
				e.preventDefault();
				e.returnValue = ''; // legacy browsers still require it to show the prompt
			};
			window.addEventListener('beforeunload', this.#listener);
		} else if (!wanted && this.#listener) {
			window.removeEventListener('beforeunload', this.#listener);
			this.#listener = null;
		}
	}
}
