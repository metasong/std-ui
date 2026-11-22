import { ChildRenderer } from '@std-ui/core';
import { KeyedRows, type KeyedEntries } from '../_lib/keyed-rows/index.js';

export type MapByKeyEntries = KeyedEntries;

export class MapByKeyRenderer extends ChildRenderer<MapByKeyEntries> {
	#rows = new KeyedRows(this.anchor, this.host);
	update(entries: MapByKeyEntries): boolean {
		this.#rows.update(entries);
		return true;
	}
	override disconnect(): void {
		this.#rows.disconnect();
	}
	dispose(): void {
		this.#rows.dispose();
	}
}
