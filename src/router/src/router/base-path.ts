/** Maps between full pathnames and app-relative paths for an app mounted under `base`. */
export class BasePath {
	readonly #base: string;

	constructor(base = '') {
		this.#base = base.replace(/\/+$/, '');
	}

	/** The normalised prefix (no trailing slash); empty when unmounted. */
	get prefix(): string {
		return this.#base;
	}

	/** App-relative path for a full pathname, or null when outside `base`. */
	toApp(pathname: string): string | null {
		if (!this.#base) return pathname;
		if (pathname === this.#base) return '/';
		return pathname.startsWith(this.#base + '/') ? pathname.slice(this.#base.length) : null;
	}

	href(appPath: string): string {
		return this.#base + appPath;
	}

	/** Full URL (path + search + hash) for an app location. */
	url(loc: { pathname: string; search: string; hash: string }): string {
		return this.href(loc.pathname) + loc.search + loc.hash;
	}
}
