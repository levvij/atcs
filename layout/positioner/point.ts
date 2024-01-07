import { Positioner } from ".";
import { Channel } from "../device/channel";
import { Track } from "../track";
import { ResponderType } from "./responder-type";

export class PointPositioner extends Positioner {
	constructor(
		public track: Track,
		public offset: number,
		public channel: Channel,
		public responder: ResponderType
	) {
		super();
	}
	
	dump() {
		console.group('Point positioner');
		console.log('offset:', this.offset);

		this.channel.dump();

		console.groupEnd();
	}
}