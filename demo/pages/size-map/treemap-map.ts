import { computed, css, signal, state, styleMap, t, tag, UIElement } from '@std-ui/core';
import { formatKb, type SizeNode } from './data.js';
import { displayName, groupHue, labelPath, layoutTree, type LayoutBox } from './treemap-layout.js';

const H = 600; // virtual height; width = aspect * H. 1 unit = 100/W cqw, so text scales with the map.

@tag('demo-treemap-map')
export class DemoTreemapMap extends UIElement {
	static override shadowRootOptions = { mode: 'open' } as const;

	static override styles = css`
		:host { display: block; }
		.map {
			position: relative; width: 100%; container-type: inline-size; overflow: hidden;
			border-radius: var(--md-shape-corner-medium, 12px);
			border: 1px solid var(--md-sys-color-outline-variant, #cac4d0);
			background: var(--md-sys-color-surface-container-low, #f7f2fa);
			font-family: var(--md-ref-typeface-plain, Roboto, sans-serif);
		}
		.map:focus-visible { outline: 2px solid var(--md-sys-color-primary, #6750a4); outline-offset: 2px; }
		.block {
			position: absolute; box-sizing: border-box; overflow: hidden; cursor: pointer;
			border: 1px solid rgb(255 255 255 / 0.75);
			transition: filter 0.12s;
		}
		.block.leaf:hover { filter: brightness(1.12) saturate(1.1); }
		/* Drawn last, above every block, so the selected block's border is never covered by its children or neighbours. */
		.ring {
			position: absolute; box-sizing: border-box; pointer-events: none;
			border: 3px solid #1d1b20;
			box-shadow: 0 0 0 1px rgb(255 255 255 / 0.9), inset 0 0 0 1px rgb(255 255 255 / 0.9);
		}
		.head {
			position: absolute; left: 0; right: 0; top: 0; padding: 0 0.6em; overflow: hidden;
			display: flex; align-items: center; gap: 0.6em; white-space: nowrap;
			font-weight: 600; color: rgb(0 0 0 / 0.78); pointer-events: none;
		}
		.head .kb { margin-left: auto; font-weight: 400; opacity: 0.65; }
		.name, .kb { overflow: hidden; text-overflow: ellipsis; }
		.leaf-label {
			position: absolute; inset: 0; padding: 0.35em 0.5em; overflow: hidden; line-height: 1.15;
			color: #fff; text-shadow: 0 1px 2px rgb(0 0 0 / 0.35); pointer-events: none;
			font-family: var(--md-ref-typeface-mono, 'Roboto Mono', monospace);
		}
		.leaf-label b { display: block; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
		.leaf-label span { display: block; opacity: 0.85; font-size: 0.8em; }
		.legend { display: flex; flex-wrap: wrap; gap: 0.35rem 1rem; margin: 0.6rem 0 0; padding: 0; list-style: none; font-size: 0.8125rem; }
		.legend li { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--md-sys-color-on-surface-variant, #49454f); }
		.legend i { width: 0.8rem; height: 0.8rem; border-radius: 3px; }
		.detail {
			margin-top: 0.5rem; min-height: 2.6rem; padding: 0.5rem 0.85rem; box-sizing: border-box;
			border-radius: var(--md-shape-corner-medium, 12px); background: var(--md-sys-color-surface-container, #f3edf7);
			font-size: 0.8125rem; line-height: 1.4; color: var(--md-sys-color-on-surface, #1d1b20);
		}
		.detail code { font-family: 'Roboto Mono', ui-monospace, monospace; font-size: 0.95em; }
	`;

	/** Inputs, set with `.tree=${...}` etc. They are signals/state so the host re-renders when a parent binds them. */
	readonly tree = signal<SizeNode | null>(null);
	readonly aspect = state(2.2);
	readonly showLeafKb = state(true);
	/** Folder/group totals in header bars and legend. Off when the groups are just labels (e.g. core / ext bundles). */
	readonly showFolderKb = state(true);
	/** Draw the root as a folder level (named header bar with its total) rather than an invisible frame. */
	readonly showRoot = state(false);

	/** Layout only depends on the tree and aspect, not on hover, so hovering does not recompute it. */
	readonly #width = computed(() => Math.round(this.aspect() * H));
	readonly #boxes = computed(() => {
		const tree = this.tree();
		return tree ? layoutTree(tree, this.#width(), H, this.showRoot()).filter((b) => b.depth === 0 || (b.w > 2 && b.h > 2)) : [];
	});

	private readonly selected = signal<SizeNode | null>(null);

	/** Keyboard: arrows walk the blocks in paint order (a folder, then its contents), Home/End jump, Esc clears. */
	#onKey = (e: KeyboardEvent): void => {
		const boxes = this.#boxes().slice(this.showRoot() ? 0 : 1); // a bare root is an invisible frame, not a stop
		if (!boxes.length) return;
		const cur = boxes.findIndex((b) => b.node === this.selected.peek());
		let next: number;
		switch (e.key) {
			case 'ArrowRight': case 'ArrowDown': next = Math.min(boxes.length - 1, cur + 1); break;
			case 'ArrowLeft': case 'ArrowUp': next = Math.max(0, cur - 1); break;
			case 'Home': next = 0; break;
			case 'End': next = boxes.length - 1; break;
			case 'Escape': this.selected.set(null); return;
			default: return;
		}
		e.preventDefault();
		this.selected.set(boxes[next]!.node);
	};

	#pos(b: LayoutBox, W: number) {
		return {
			left: `${(b.x / W) * 100}%`, top: `${(b.y / H) * 100}%`,
			width: `${(b.w / W) * 100}%`, height: `${(b.h / H) * 100}%`,
		};
	}

	#box(b: LayoutBox, W: number) {
		const u = 100 / W; // cqw per virtual unit
		const hue = groupHue(b.group);
		const pos = this.#pos(b, W);
		const total = this.tree.peek()?.size ?? 0;
		const tip = `${labelPath(b.node)} - ${formatKb(b.node.size)} gzip${total ? ` (${((b.node.size / total) * 100).toFixed(1)}%)` : ''}`;
		const enter = () => this.selected.set(b.node);
		const leave = () => { if (this.selected.peek() === b.node) this.selected.set(null); };

		if (b.leaf) {
			const fs = Math.min(34, Math.max(8, Math.sqrt(b.w * b.h) / 5.5)); // bigger tiles get bigger text
			const showName = b.w > 28 && b.h > fs * 1.7;
			const showSize = this.showLeafKb() && b.h > fs * 3.2 && b.w > 50;
			return t`
				<div class="block leaf" title="${tip}"
					style=${styleMap({ ...pos, background: `hsl(${hue} 58% ${52 - Math.min(b.depth, 5) * 2}%)` })}
					@pointerenter=${enter} @pointerleave=${leave} @click=${enter}>
					${showName
						? t`<div class="leaf-label" style=${styleMap({ fontSize: `${fs * u}cqw` })}>
							<b>${displayName(b.node)}</b>${showSize ? t`<span>${formatKb(b.node.size)}</span>` : ''}
						</div>`
						: ''}
				</div>
			`;
		}
		const light = 94 - Math.min(b.depth, 6) * 5;
		const bare = b.depth === 0 && !this.showRoot();
		return t`
			<div class="block" title="${tip}"
				style=${styleMap({ ...pos, background: bare ? 'transparent' : b.depth === 0 ? 'hsl(225 16% 90%)' : `hsl(${hue} 45% ${light}%)`, borderColor: bare ? 'transparent' : '' })}
				@pointerenter=${enter} @pointerleave=${leave} @click=${enter}>
				${b.header
					? t`<div class="head" style=${styleMap({ height: `${(b.header / b.h) * 100}%`, fontSize: `${Math.min(15, b.header * 0.62) * u}cqw` })}>
						<span class="name">${displayName(b.node)}</span>${this.showFolderKb() ? t`<span class="kb">${formatKb(b.node.size)}</span>` : ''}
					</div>`
					: ''}
			</div>
		`;
	}

	protected override template() {
		const tree = this.tree();
		if (!tree) return t`<div class="map" aria-hidden="true"></div>`;
		const W = this.#width();
		const boxes = this.#boxes();
		const groups = tree.children ?? [];
		const sel = this.selected();
		const selBox = sel ? boxes.find((b) => b.node === sel) : undefined;
		return t`
			<div class="map" role="group" tabindex="0" aria-label="Treemap of ${tree.name} sizes. Use arrow keys to move between blocks."
				style=${styleMap({ aspectRatio: `${W} / ${H}` })}
				@keydown=${this.#onKey}>
				${boxes.map((b) => this.#box(b, W))}
				${selBox && (selBox.depth > 0 || this.showRoot()) ? t`<div class="ring" style=${styleMap(this.#pos(selBox, W))}></div>` : ''}
			</div>
			<ul class="legend">
				${groups.map((g, i) => t`<li><i style=${styleMap({ background: `hsl(${groupHue(i)} 58% 50%)` })}></i>${g.name}${this.showFolderKb() ? ` ${formatKb(g.size)}` : ''}</li>`)}
			</ul>
			<div class="detail" aria-live="polite">
				${sel
					? t`<code>${labelPath(sel)}</code> - <strong>${formatKb(sel.size)}</strong> gzip
						(${((sel.size / tree.size) * 100).toFixed(1)}% of ${tree.name})${sel.raw ? t`, ${formatKb(sel.raw, 1)} raw` : ''}`
					: 'Hover, tap or click a block - or focus the map and use the arrow keys - for its path and share.'}
			</div>
		`;
	}
}