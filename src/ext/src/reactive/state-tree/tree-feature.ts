// Shared typing for tree features (`check`, `changes`, `formUi`, ...): each one adds a mixin to every
// node of a state tree. A feature registers itself by augmenting `TreeFeatures` (the mixin for a node
// holding `T`) and, if it has array-only / object-only members, `ArrayExtras` / `ObjectExtras`; then `WithFeature<S, 'name'>` types
// the tree with it, keeping whatever other features are already on `S`.

import type { StateArray, StateObject } from '@std-ui/core';

/** Mixin per feature for a node whose value is `T`. Augmented by each feature's module. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface TreeFeatures<T> {}
/** Extra members per feature on array nodes whose items are `U`. Augmented by features that need them. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ArrayExtras<U> {}
/** Extra members per feature on object nodes whose value is `T`. Augmented by features that need them. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ObjectExtras<T> {}

/** The item node type of an array tree `S`, read from `S` itself so features already on the items are kept. */
export type ItemOf<S> = S extends { readonly [index: number]: infer I } ? NonNullable<I> : never;

type Feature = keyof TreeFeatures<any>;
type Mixin<K extends Feature, T> = TreeFeatures<T>[K];
type Extra<K extends Feature, U> = K extends keyof ArrayExtras<U> ? ArrayExtras<U>[K] : unknown;
type ObjExtra<K extends Feature, T> = K extends keyof ObjectExtras<T> ? ObjectExtras<T>[K] : unknown;

/**
 * A state tree `S` with feature `K` on every node (members and items too). Built on `S` itself, not
 * rebuilt, so other features already on it are kept.
 */
export type WithFeature<S, K extends Feature> =
	S extends StateArray<infer U, any>
		? {
				at(index: number): WithFeature<ItemOf<S>, K> | undefined;
				readonly [index: number]: WithFeature<ItemOf<S>, K> | undefined;
			} & S &
				Mixin<K, U[]> &
				Extra<K, U>
		: S extends StateObject<infer T, infer M, any>
			? { readonly _: { readonly [P in keyof M]: WithFeature<M[P], K> } } & {
					readonly [P in keyof T]: WithFeature<S[P & keyof S], K>;
				} & S &
					Mixin<K, T> &
					ObjExtra<K, T>
			: S extends { peek(): infer T }
				? S & Mixin<K, T>
				: S;
