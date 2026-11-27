import { describe, expect, it } from 'vitest';
import { state } from '../signal/state.js';
import { effect } from './effect.js';
import { whenFlushed } from './scheduler.js';

declare const process: {
	on(event: 'uncaughtException', listener: (error: Error) => void): void;
	off(event: 'uncaughtException', listener: (error: Error) => void): void;
};

/** Triggers a two-effect cycle and returns the message of the cycle error the flush throws. */
async function cycleMessage(options?: { name?: string }): Promise<string> {
	const a = state(0);
	const b = state(0);
	const disposeA = effect(() => { b.set(a.get() + 1); }, null, options);
	const disposeB = effect(() => { a.set(b.get() + 1); }, null, options);
	const errors: unknown[] = [];
	const onError = (err: unknown) => { errors.push(err); };
	process.on('uncaughtException', onError);
	try {
		await whenFlushed();
		await new Promise(r => setTimeout(r, 0));
	} finally {
		process.off('uncaughtException', onError);
		disposeA();
		disposeB();
	}
	const error = errors.flatMap(e => (e instanceof AggregateError ? e.errors : [e])).find(e => /re-ran more than/.test(String((e as Error).message)));
	expect(error).toBeDefined();
	return (error as Error).message;
}

describe('effect cycle guard', () => {
	it('stops a cycle between two effects and names the signals they read', async () => {
		const message = await cycleMessage();
		expect(message).toMatch(/re-ran more than 100 times/);
		expect(message).toMatch(/reads: state\(\d+\)/);
	});

	it('prints the effect name instead of a creation stack', async () => {
		const message = await cycleMessage({ name: 'my-effect' });
		expect(message).toContain('effect "my-effect"');
		expect(message).not.toMatch(/\n\s+at /);
	});
});
