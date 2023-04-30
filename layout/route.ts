import { Area } from "./area.js";
import { Router } from "./router.js";
import { Section } from "./section.js";

export class Route {
	in: Section;
	out: Section;
	
	constructor(
		public name: string,
		public router: Router,
	) {}
	
	dump() {
		console.log(this.name);
	}
}