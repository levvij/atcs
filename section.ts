import { Area } from "./area.js";
import { PowerDistrict } from "./power-district.js";
import { Route } from "./route.js";
import { Router } from "./router.js";
import { Track } from "./track.js";

export class Section {
	powerDistrict: PowerDistrict;
	
	tracks: Track[] = [];
	
	in?: Route | Section;
	out?: Route | Section;
	
	constructor(
		public name: string,
		public area: Area
	) {}
	
	dump() {
		console.group(`Section ${this.name}`);
		
		console.log('in', this.in?.name ?? 'buffer');
		console.log('out', this.out?.name ?? 'buffer');
		
		console.log(`tracks`);
		
		for (let track of this.tracks) {
			track.dump();
		}
		
		console.groupEnd();
	}
	
	get length() {
		return this.tracks.reduce((accumulator, track) => accumulator + track.length, 0);
	}
	
	toDotReference() {
		return `section_${this.name.replace(/-/g, '_')}_${this.area.toDotReference()}`;
	}
	
	toDotDefinition() {
		return `
			${this.toDotReference()} [ label = ${JSON.stringify(`${this.name}\n${this.length}`)}, shape = box ]
		`;
	}
	
	toDotConnection() {
		return `
			${this.out instanceof Section ? `${this.toDotReference()} -> ${this.out.toDotReference()}` : ''}
		`;
	}
}