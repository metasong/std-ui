import { describe, expect, it } from 'vitest';
import { tag, UIElement } from '../ui-element.js';
import { ownMetadata } from '../decorators/index.js';
import { state } from '../../reactive/index.js';
import { UIFeat } from './ui-feat.js';

function flush(): Promise<void> {
	return new Promise(resolve => queueMicrotask(() => queueMicrotask(resolve)));
}

describe('UIFeat', () => {
	it('receives the host lifecycle in order and cleans up on disconnect', () => {
		const log: string[] = [];

		class LogFeat extends UIFeat {
			protected override connected() {
				log.push('connected');
				return () => log.push('cleanup:connected');
			}
			protected override firstUpdated() {
				log.push('firstUpdated');
				return () => log.push('cleanup:firstUpdated');
			}
			protected override updated() {
				log.push('updated');
			}
		}

		@tag('feat-lifecycle')
		class Host extends UIElement {
			readonly feat = new LogFeat(this);
		}

		const el = document.createElement('feat-lifecycle') as Host;
		document.body.appendChild(el);
		expect(log).toEqual(['connected', 'firstUpdated', 'updated']);

		log.length = 0;
		el.remove();
		expect(log.sort()).toEqual(['cleanup:connected', 'cleanup:firstUpdated']);
	});

	it('runs setup again on reconnect', () => {
		let connects = 0;
		class CountFeat extends UIFeat {
			protected override connected() {
				connects++;
			}
		}

		@tag('feat-reconnect')
		class Host extends UIElement {
			readonly feat = new CountFeat(this);
		}

		const el = document.createElement('feat-reconnect') as Host;
		document.body.appendChild(el);
		el.remove();
		document.body.appendChild(el);
		expect(connects).toBe(2);
		el.remove();
	});

	it('disposes this.effect() on disconnect', async () => {
		const source = state(0);
		const seen: number[] = [];

		class EffectFeat extends UIFeat {
			protected override connected() {
				this.effect(() => {
					seen.push(source.get());
				});
			}
		}

		@tag('feat-effect')
		class Host extends UIElement {
			readonly feat = new EffectFeat(this);
		}

		const el = document.createElement('feat-effect') as Host;
		document.body.appendChild(el);
		source.set(1);
		await flush();
		expect(seen).toEqual([0, 1]);

		el.remove();
		source.set(2);
		await flush();
		expect(seen).toEqual([0, 1]);
	});

	it('re-renders a host whose template reads a feature signal', async () => {
		class CounterFeat extends UIFeat {
			readonly count = state(0);
		}

		const rendered: number[] = [];
		@tag('feat-signal')
		class Host extends UIElement {
			readonly counter = new CounterFeat(this);
			protected override template(): void {
				rendered.push(this.counter.count.get());
			}
		}

		const el = document.createElement('feat-signal') as Host;
		document.body.appendChild(el);
		el.counter.count.set(1);
		await flush();
		expect(rendered).toEqual([0, 1]);
		el.remove();
	});

	it('stops receiving phases after dispose()', () => {
		let connects = 0;
		class CountFeat extends UIFeat {
			protected override connected() {
				connects++;
			}
		}

		@tag('feat-dispose')
		class Host extends UIElement {
			readonly feat = new CountFeat(this);
		}

		const el = document.createElement('feat-dispose') as Host;
		el.feat.dispose();
		document.body.appendChild(el);
		expect(connects).toBe(0);
		el.remove();
	});

	it('throws when effect() is used outside a lifecycle phase', () => {
		class BadFeat extends UIFeat {
			start() {
				this.effect(() => {});
			}
		}

		@tag('feat-bad-effect')
		class Host extends UIElement {
			readonly feat = new BadFeat(this);
		}

		const el = document.createElement('feat-bad-effect') as Host;
		expect(() => el.feat.start()).toThrow(/UIFeat\.effect/);
	});

	it('catches up when attached to an already-connected host', () => {
		const log: string[] = [];
		class LateFeat extends UIFeat {
			protected override connected() {
				log.push('connected');
				return () => log.push('cleanup');
			}
			protected override firstUpdated() {
				log.push('firstUpdated');
			}
		}

		@tag('feat-late')
		class Host extends UIElement {}

		const el = document.createElement('feat-late') as Host;
		document.body.appendChild(el);
		new LateFeat(el);
		expect(log).toEqual(['connected', 'firstUpdated']);
		el.remove();
		expect(log).toContain('cleanup');
	});

	it('attachTo() gives each instance its own feature, with every phase, across reconnects', () => {
		const log: string[] = [];
		const made: object[] = [];
		class ClassFeat extends UIFeat {
			protected override beforeConnect() {
				log.push('beforeConnect');
				return () => log.push('cleanup');
			}
			protected override connected() {
				log.push('connected');
			}
		}

		@tag('feat-class-level')
		class Host extends UIElement {}
		UIFeat.attachTo<Host>(ownMetadata(Host), host => {
			const f = new ClassFeat(host);
			made.push(f);
			return f;
		});

		const el = document.createElement('feat-class-level') as Host;
		document.body.appendChild(el);
		expect(log).toEqual(['beforeConnect', 'connected']);
		el.remove();
		document.body.appendChild(el);
		expect(log).toEqual(['beforeConnect', 'connected', 'cleanup', 'beforeConnect', 'connected']);
		expect(made).toHaveLength(1);

		const other = document.createElement('feat-class-level');
		document.body.appendChild(other);
		expect(made).toHaveLength(2);
		el.remove();
		other.remove();
	});

	it('disconnected() runs after connected() cleanup on every disconnect', () => {
		const log: string[] = [];
		class DiscFeat extends UIFeat {
			protected override connected() {
				return () => log.push('cleanup');
			}
			protected override disconnected() {
				log.push('disconnected');
			}
		}

		@tag('feat-disconnected')
		class Host extends UIElement {
			readonly feat = new DiscFeat(this);
		}

		const el = document.createElement('feat-disconnected') as Host;
		document.body.appendChild(el);
		el.remove();
		document.body.appendChild(el);
		el.remove();
		expect(log).toEqual(['cleanup', 'disconnected', 'cleanup', 'disconnected']);
	});
});
