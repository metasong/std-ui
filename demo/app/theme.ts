// Light/dark theme: stored choice, else the OS preference. Applied as `data-theme` on <html> (tokens in std-theme.css).
const KEY = 'std-ui-demo-theme';
export type ThemeMode = 'light' | 'dark';

export const currentTheme = (): ThemeMode => (document.documentElement.dataset.theme as ThemeMode | undefined) ?? 'light';

export const applyTheme = (mode: ThemeMode): void => {
	document.documentElement.dataset.theme = mode;
	try { localStorage.setItem(KEY, mode); } catch { /* storage unavailable */ }
};

export const initTheme = (): void => {
	let mode: ThemeMode | null = null;
	try { mode = localStorage.getItem(KEY) as ThemeMode | null; } catch { /* storage unavailable */ }
	document.documentElement.dataset.theme = mode ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
};
