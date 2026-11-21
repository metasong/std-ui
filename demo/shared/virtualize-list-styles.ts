import { css } from '@std-ui/core';

/** Scroller + row styles shared by every demo that renders a virtualized list (virtualize and integration pages). */
export const virtualizeListStyles = css`
	.demo-v-scroller {
		overflow: auto;
		border: 1px solid var(--md-sys-color-outline-variant);
		border-radius: var(--md-shape-corner-small);
		background: var(--md-sys-color-surface);
	}

	.demo-v-scroller-y {
		height: 320px;
	}

	.demo-v-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0 12px;
		border-bottom: 1px solid var(--md-sys-color-outline-variant);
		font-size: 0.875rem;
		font-variant-numeric: tabular-nums;
	}

	.demo-v-row-even {
		background: var(--md-sys-color-surface-container-low);
	}
`;
