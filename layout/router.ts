import { Area } from "./area.js";
import { Route } from "./route.js";

export class Router {
	routes: Route[] = [];
	
	constructor(
		public name: string,
		public area: Area
	) {}

	get domainName() {
		return `${this.name}.${this.area.domainName}`;
	}
	
	dump() {
		console.group(`Router ${this.domainName}`);

		for (let route of this.routes) {
			route.dump();
		}

		console.groupEnd();
	}
	
	toDotReference() {
		return `router_${this.name.replace(/-/g, '_')}_${this.area.toDotReference()}`;
	}
	
	toDotDefinition() {
		return `
			${this.toDotReference()} [ label = ${JSON.stringify(this.name)}, shape = diamond ]
		`;
	}
	
	toDotConnection() {
		return `
			${this.routes.map(route => `
				${route.in.toDotReference()} -> ${this.toDotReference()} [ headlabel = ${JSON.stringify(route.name)} ]
				${this.toDotReference()} -> ${route.out.toDotReference()} [ taillabel = ${JSON.stringify(route.name)} ]
			`).join('')}
		`;
	}
}