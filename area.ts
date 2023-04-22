import { PowerDistrict } from "./power-district.js";
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
		return `cluster_${this.name.replace(/-/g, '_')}`;
	}
	
	toDot() {
		return `
			subgraph ${this.toDotReference()} {
				label = ${JSON.stringify(this.name)};
				
				${this.children.map(child => child.toDot()).join('')}
				${this.sections.map(section => section.toDot()).join('')}
			}
		`;
	}
}