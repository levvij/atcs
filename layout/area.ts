import { Layout } from ".";
import { PowerDistrict } from "./power-district";
import { Router } from "./router";
import { Section } from "./section";

export class District {
	children: District[] = [];
	
	powerDistricts: PowerDistrict[] = [];
	sections: Section[] = [];
	routers: Router[] = [];
	
	constructor(
		public name: string,
		public parent: District | Layout
	) {}

	get domainName() {
		if (this.parent instanceof Layout) {
			return `${this.name}.${this.parent.name}`;
		}

		return `${this.name}.${this.parent.domainName}`;
	}
	
	dump() {
		console.group(`District ${this.domainName}`);
		
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
			
			for (let district of this.children) {
				district.dump();
			}

			console.groupEnd();
		}
		
		console.groupEnd();
	}
	
	toDotReference() {
		return `cluster_${this.name.replace(/-/g, '_')}${this.parent instanceof District ? this.parent.toDotReference() : ''}`;
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

	toSVG() {
		return `
			<g id=${JSON.stringify(this.domainName)}>
				${this.sections.map(section => section.toSVG()).join('')}

				${this.children.map(child => child.toSVG()).join('')}
			</g>
		`;
	}

	findSVGPositions() {
		return [
			...this.sections.map(section => section.findSVGPositions()), 
			...this.children.map(child => child.findSVGPositions())
		];
	}
}