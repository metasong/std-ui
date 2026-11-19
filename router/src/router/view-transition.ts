interface ViewTransitionLike {
	ready: Promise<void>;
	finished: Promise<void>;
	updateCallbackDone: Promise<void>;
}

type StartViewTransition = (update: () => void | Promise<void>) => ViewTransitionLike;

/** Lets effects (the outlet's render) flush: they run in a microtask after a signal write. */
const flushEffects = (): Promise<void> => new Promise((r) => queueMicrotask(() => queueMicrotask(r)));

export function canViewTransition(): boolean {
	return (
		typeof document !== 'undefined' &&
		typeof (document as { startViewTransition?: unknown }).startViewTransition === 'function' &&
		!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches
	);
}

/**
 * Runs `update` (the commit) inside a View Transition when supported, otherwise plainly.
 * Resolves once the DOM has updated, not when the animation ends, so navigation scroll/focus
 * handling is not delayed by it. Style with `::view-transition-*` pseudo-elements.
 */
export async function withViewTransition(update: () => void): Promise<void> {
	if (!canViewTransition()) {
		update();
		return;
	}
	const start = (document as unknown as { startViewTransition: StartViewTransition }).startViewTransition.bind(document);
	const t = start(async () => {
		update();
		await flushEffects();
	});
	// Only one view transition runs per document: a newer one (another router, or a quick second navigation)
	// aborts the older, rejecting its `ready`/`finished` promises. Nobody awaits those, so swallow them or they
	// surface as `Uncaught (in promise) InvalidStateError`. A skipped transition still runs the callback.
	t.ready.catch(() => {});
	t.finished.catch(() => {});
	await t.updateCallbackDone.catch(() => {});
}
