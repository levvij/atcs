import { Section } from "./section.js";

export class Track {
	constructor(
		public section: Section,
		public length: number,
		public path: string
	) {}
	
	dump() {
		console.log(this.length);
	}
}