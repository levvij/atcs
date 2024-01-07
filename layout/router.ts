import { District } from "./area";
import { Route } from "./route";

export class Router {
	activeRoute?: Route;

	routes: Route[] = [];
	
	constructor(
		public name: string,
		public district: District
	) {}

	get domainName() {
		return `${this.name}.${this.district.domainName}`;
	}
	
	dump() {
		console.group(`Router ${this.domainName}`);

		for (let route of this.routes) {
			route.dump();
		}

		console.groupEnd();
	}
	
	toDotReference() {
		return `router_${this.name.replace(/-/g, '_')}_${this.district.toDotReference()}`;
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