import { District } from "./area";

export class PowerDistrict {
	constructor(
		public name: string,
		public district: District
	) {}

	get domainName() {
		return `${this.name}.${this.district.domainName}`;
	}
	
	dump() {
		console.log(this.name);
	}
}