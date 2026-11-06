/** Wait for microtask-batched effect re-runs (see `./effect.ts`). */
export function flushEffects(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}
