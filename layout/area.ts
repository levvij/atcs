import { PowerDistrict } from "./power-district.js";
import { Route } from "./route.js";
import { Router } from "./router.js";
import { Section } from "./section.js";
import { Layout } from './index.js';

export class Area {
	children: Area[] = [];
	
	powerDistricts: PowerDistrict[] = [];
	sections: Section[] = [];
	routers: Router[] = [];
	
	constructor(
		public name: string,
		public parent: Area | Layout
	) {}

	get domainName() {
		if (this.parent instanceof Layout) {
			return `${this.name}.${this.parent.name}`;
		}

		return `${this.name}.${this.parent.domainName}`;
	}
	
	dump() {
		console.group(`Area ${this.domainName}`);
		
		if (this.powerDistricts.length) {
			console.group('power districts');
			
			for (let district of this.powerDistricts) {
				district.dump();
			}

			console.groupEnd();
		}
		
		if (this.sections.length) {
			console.group('sections');
			
			for (let section of this.sections) {
				section.dump();
			}

			console.groupEnd();
		}
		
		if (this.children.length) {
			console.group('children');
			
			for (let area of this.children) {
				area.dump();
			}

			console.groupEnd();
		}
		
		console.groupEnd();
	}
	
	toDotReference() {
		return `cluster_${this.name.replace(/-/g, '_')}${this.parent instanceof Area ? this.parent.toDotReference() : ''}`;
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