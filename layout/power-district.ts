import { Area } from "./area.js";

export class PowerDistrict {
	constructor(
		public name: string,
		public area: Area
	) {}
	
	dump() {
		console.log(this.name);
	}
}