import { Area } from "./area.js";
import { Router } from "./router.js";
import { Section } from "./section.js";

export class Route {
	constructor(
		public name: string,
		public source: Section,
		public destination: Section,
		public router: Router,
	) {}
	
	dump() {
		console.log(this.name);
	}
}