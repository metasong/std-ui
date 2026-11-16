import { Committer } from '../../parts/committers/committer.js';
import { KeyedRows, type KeyedEntries } from '../_lib/keyed-rows/index.js';

export type MapByKeyEntries = KeyedEntries;

export class MapByKeyCommitter extends Committer<MapByKeyEntries> {
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
