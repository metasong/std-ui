// The router's view of the Navigation API: a `Pick` of the lib.dom types (requires a TS DOM lib that
// includes Navigation; TS 7 does), so JSDoc on the original members is inherited and tests can supply
// `createMemoryNavigation()` in place of `window.navigation`.

export type NavigationEntryLike = Pick<NavigationHistoryEntry, 'key' | 'url' | 'getState'>;

export type PrecommitControllerLike = Pick<NavigationPrecommitController, 'redirect'>;

export type NavigateEventLike = Event &
	Pick<
		NavigateEvent,
		'canIntercept' | 'hashChange' | 'downloadRequest' | 'formData' | 'navigationType' | 'signal' | 'intercept' | 'info'
	> & {
		readonly destination: Pick<NavigationDestination, 'url' | 'getState'>;
	};

export type NavigationResultLike = NavigationResult;

export type NavigationLike = EventTarget &
	Pick<Navigation, 'currentEntry' | 'navigate' | 'back' | 'forward' | 'traverseTo'>;
