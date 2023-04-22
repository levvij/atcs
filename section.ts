import { Area } from "./area.js";
import { PowerDistrict } from "./power-district.js";
import { Route } from "./route.js";
import { Router } from "./router.js";
import { Track } from "./track.js";

export class Section {
	powerDistrict: PowerDistrict;
	
	tracks: Track[] = [];
	
	next: Section | Router | Route;
	
	constructor(
		public name: string,
		public area: Area
	) {}
	
	dump() {
		console.group(`Section ${this.name}`);
		console.log(`tracks`);
		
		for (let track of this.tracks) {
			track.dump();
		}
		
		if (this.next) {
			console.log('next', this.next.name);
		}
		
		console.groupEnd();
	}
	
	get length() {
		return this.tracks.reduce((accumulator, track) => accumulator + track.length, 0);
	}
	
	toDotReference() {
		return `section_${this.name.replace(/-/g, '_')}_${this.area.name.replace(/-/g, '_')}`;
	}
	
	toDot() {
		return `
			${this.toDotReference()}[label = ${JSON.stringify(`${this.name} ${this.length}`)}, shape = box];
			
			${(this.next instanceof Section) ? `
				${this.toDotReference()} -> ${this.next.toDotReference()}
			` : ''}
			
			${(this.next instanceof Router) ? `
				${this.next.toDotReference()}[label = ${JSON.stringify(this.next.name)}, shape = trapezium]
				${this.toDotReference()} -> ${this.next.toDotReference()}
				
				${this.next.routes.map(route => `${(this.next as Router).toDotReference()} -> ${route.destination.toDotReference()}[taillabel = ${JSON.stringify(route.name)}]`).join('')}
			` : ''}
			
			${(this.next instanceof Route) ? `
				${this.next.router.toDotReference()}[label = ${JSON.stringify(this.next.router.name)}, shape = invtrapezium]
				${this.next.router.toDotReference()} -> ${this.next.source.toDotReference()}
				
				${this.toDotReference()} -> ${this.next.router.toDotReference()}[headlabel = ${JSON.stringify(this.next.name)}]
			` : ''}
		`;
	}
}