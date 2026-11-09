import { Committer } from '../../parts/committers/committer.js';
import { KeyedRows, type KeyedEntries } from '../keyed-rows/index.js';

export type MapByKeyEntries = KeyedEntries;

export class MapByKeyCommitter extends Committer<MapByKeyEntries> {
	#rows = new KeyedRows(this.anchor);
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
