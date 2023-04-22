import { Area } from "./area.js";
import { Route } from "./route.js";
import { Section } from "./section.js";

export class Router {
	routes: Route[] = [];
	
	constructor(
		public name: string,
		public parent: Area | Section
	) {}
	
	dump() {
		console.log(this.name);
	}
	
	toDotReference() {
		return `router_${this.name.replace(/-/g, '_')}_${this.parent.toDotReference()}`;
	}
}