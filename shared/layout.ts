import { Segment, Block, Turnout } from "./segment";
import { PositiveMagnetReader, NegativeMagnetReader, BiMagnetReader } from "./sensor";
import { Train, Locomotive, RollingStockIdentificationTag, PositiveRollingStockMagnet, NegativeRollingStockMagnet, Wagon } from "./train";
import { Simulator } from "./simulator";

export class Layout {
	segments: Segment[];
	trains: Train[];
	
	resolveConnections() {
		for (let segment of this.segments) {
			segment.resolveConnections(this);
		}
	}

	getSegment(id: string) {
		return this.segments.find(s => s.id == id);
	}
}