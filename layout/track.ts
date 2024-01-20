import { off } from "process";
import { Positioner } from "./positioner";
import { Section } from "./section";
import { SectionPosition } from "../shared/postion";

export class Track {
	positioners: Positioner[] = [];

	constructor(
		public section: Section,
		public length: number,
		public path: string
	) {}

	// the start of the track within the section
	get head() {
		let offset = 0;

		for (let track of this.section.tracks) {
			if (track == this) {
				return new SectionPosition(this.section, offset, false);
			}
			
			offset += track.length;
		}
	}
	
	dump() {
		console.log(this.length);
	}
}