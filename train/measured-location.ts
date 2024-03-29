import { Train } from ".";
import { PointPositioner } from "../layout/positioner/point";
import { SectionPosition } from "../shared/postion";

export class MeasuredPosition {
	constructor(
		public time: Date,
		public location: SectionPosition,
		public trainDirection: boolean,
		public trainOffset: number
	) {}

	static fromPointPositionReading(positioner: PointPositioner, train: Train) {
		return new MeasuredPosition(
			new Date(),
			positioner.position,
			train.reversed,
			0 // replace with location of the magnet later on
		);
	}

	get head() {
		if (this.trainDirection) {
			return this.location.advance(-this.trainOffset);
		}

		return this.location.advance(this.trainOffset);
	}
}