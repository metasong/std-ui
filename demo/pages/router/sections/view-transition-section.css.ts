import { css } from '@std-ui/core';

// View-transition pseudo-elements hang off `:root`, outside any element scope, so these rules must live on
// `document`. Adopted while the element is connected (see `connect`/`disconnect`).
export default css`
	::view-transition-group(demo-rt) { animation-duration: 500ms; }
	::view-transition-old(demo-rt), ::view-transition-new(demo-rt) { animation-duration: 500ms; animation-fill-mode: both; mix-blend-mode: normal; }

	/* slide */
	:root[data-rt-effect='slide']::view-transition-old(demo-rt) { animation-name: rt-slide-out; }
	:root[data-rt-effect='slide']::view-transition-new(demo-rt) { animation-name: rt-slide-in; }
	@keyframes rt-slide-out { to { opacity: 0; transform: translateX(-120px); } }
	@keyframes rt-slide-in { from { opacity: 0; transform: translateX(120px); } }

	/* zoom */
	:root[data-rt-effect='zoom']::view-transition-old(demo-rt) { animation-name: rt-zoom-out; }
	:root[data-rt-effect='zoom']::view-transition-new(demo-rt) { animation-name: rt-zoom-in; }
	@keyframes rt-zoom-out { to { opacity: 0; transform: scale(1.4); } }
	@keyframes rt-zoom-in { from { opacity: 0; transform: scale(0.6); } }

	/* flip */
	:root[data-rt-effect='flip']::view-transition-old(demo-rt) { animation-name: rt-flip-out; }
	:root[data-rt-effect='flip']::view-transition-new(demo-rt) { animation-name: rt-flip-in; }
	@keyframes rt-flip-out { to { opacity: 0; transform: perspective(600px) rotateY(-90deg); } }
	@keyframes rt-flip-in { from { opacity: 0; transform: perspective(600px) rotateY(90deg); } }

	/* blur */
	:root[data-rt-effect='blur']::view-transition-old(demo-rt) { animation-name: rt-blur-out; }
	:root[data-rt-effect='blur']::view-transition-new(demo-rt) { animation-name: rt-blur-in; }
	@keyframes rt-blur-out { to { opacity: 0; filter: blur(16px); } }
	@keyframes rt-blur-in { from { opacity: 0; filter: blur(16px); } }

	/* wipe: new page revealed left to right */
	:root[data-rt-effect='wipe']::view-transition-old(demo-rt) { animation: none; }
	:root[data-rt-effect='wipe']::view-transition-new(demo-rt) { animation-name: rt-wipe; }
	@keyframes rt-wipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }

	/* spin */
	:root[data-rt-effect='spin']::view-transition-old(demo-rt) { animation-name: rt-spin-out; }
	:root[data-rt-effect='spin']::view-transition-new(demo-rt) { animation-name: rt-spin-in; }
	@keyframes rt-spin-out { to { opacity: 0; transform: rotate(-20deg) scale(0.5); } }
	@keyframes rt-spin-in { from { opacity: 0; transform: rotate(20deg) scale(0.5); } }
`;
