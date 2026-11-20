export const abortError = (): DOMException => new DOMException('Navigation blocked', 'AbortError');

/** Navigation promises reject with AbortError when superseded or blocked; that is not a failure. */
export function swallowAbort(p: Promise<unknown> | undefined): Promise<void> {
	return Promise.resolve(p).then(
		() => undefined,
		(err: { name?: string }) => {
			if (err?.name !== 'AbortError') throw err;
		},
	);
}
