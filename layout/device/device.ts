import { Channel } from "./channel";

export class Device {
	channels: Channel[] = [];
	
	constructor(
		public identifier: string
	) {}

	dump() {
		console.log(this.identifier);
	}
}