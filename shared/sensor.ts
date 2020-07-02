export class SegmentSensor {
	constructor(public location: number) {}
}

export class RollingStockIdentificationReader extends SegmentSensor {
	constructor(location) {
		super(location);
	}
}

export class MagnetReader extends SegmentSensor {
	constructor(location, public poles: MagnetPole[]) {
		super(location);
	}
}

export class PositiveMagnetReader extends MagnetReader {
	constructor(location) {
		super(location, [
			MagnetPole.north
		]);
	}
}

export class NegativeMagnetReader extends MagnetReader {
	constructor(location) {
		super(location, [
			MagnetPole.south
		]);
	}
}

export class BiMagnetReader extends MagnetReader {
	constructor(location) {
		super(location, [
			MagnetPole.north, 
			MagnetPole.south
		]);
	}
}

export enum MagnetPole {
	north = "north",
	south = "south"
}