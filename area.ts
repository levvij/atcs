import { PowerDistrict } from "./power-district.js";
import { Route } from "./route.js";
import { Router } from "./router.js";
import { Section } from "./section.js";

export class Area {
	children: Area[] = [];
	
	powerDistricts: PowerDistrict[] = [];
	sections: Section[] = [];
	routers: Router[] = [];
	
	constructor(
		public name: string,
		public parent?: Area
	) {}
	
	dump() {
		console.group(`Area ${this.name}`);
		
		if (this.powerDistricts.length) {
			console.log('power districts');
			
			for (let district of this.powerDistricts) {
				district.dump();
			}
		}
		
		if (this.sections.length) {
			console.log('sections');
			
			for (let section of this.sections) {
				section.dump();
			}
		}
		
		if (this.children.length) {
			console.log('children');
			
			for (let area of this.children) {
				area.dump();
			}
		}
		
		console.groupEnd();
	}
	
	toDotReference() {
		return `cluster_${this.name.replace(/-/g, '_')}${this.parent ? this.parent.toDotReference() : ''}`;
	}
	
	toDotDefinition() {
		return `
			subgraph ${this.toDotReference()} {
				label = ${JSON.stringify(this.name)}
				
				${this.sections.map(section => section.toDotDefinition()).join('')}
				${this.routers.map(router => router.toDotDefinition()).join('')}
				
				${this.children.map(child => child.toDotDefinition()).join('')}
			}
		`;
	}
	
	toDotConnection() {
		return `
			${this.sections.map(section => section.toDotConnection()).join('')}
			${this.routers.map(router => router.toDotConnection()).join('')}
				
			${this.children.map(child => child.toDotConnection()).join('')}
		`;
	}
}