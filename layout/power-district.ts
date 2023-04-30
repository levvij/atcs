import { Area } from "./area.js";

export class PowerDistrict {
	constructor(
		public name: string,
		public area: Area
	) {}

	get domainName() {
		return `${this.name}.${this.area.domainName}`;
	}
	
	dump() {
		console.log(this.name);
	}
}