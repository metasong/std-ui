/** Wait for microtask-batched effect re-runs (see `./main.ts`). */
export function flushEffects(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}
