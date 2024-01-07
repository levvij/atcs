import { Positioner } from "./positioner";
import { Section } from "./section";

export class Track {
	positioners: Positioner[] = [];

	constructor(
		public section: Section,
		public length: number,
		public path: string
	) {}
	
	dump() {
		console.log(this.length);
	}
}