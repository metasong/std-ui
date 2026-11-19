export { Router, createRouter, type RouterOptions } from './router/router.js';
export { matchRoutes, fillParams } from './match/matcher.js';
export type { AnnounceFn, AnnounceOption } from './router/announcer.js';
export type { NavigationLike, NavigateEventLike, NavigationEntryLike } from './navigation/types.js';
export type {
	BeforeLeaveHook,
	BeforeLeaveOptions,
	LeaveContext,
	GuardResult,
	NavigateOptions,
	RouteContext,
	RouteDef,
	RouteLocation,
	RouteMatch,
	RouterStatus,
} from './types.js';
export { StdRouter, StdOutlet, StdRoute } from './element/index.js';
export { routeParam, searchParam } from './element/param-decorators.js';
