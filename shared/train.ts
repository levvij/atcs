import { Segment, Turnout, Block, Bumper } from "./segment";
import { MagnetPole } from "./sensor";
import { Layout } from "./layout";

export class Train {
	breakingDistance: number;
	reactionDistance: number;

	location: Location;
	speed: number;
	acceleration: number;

	maxSpeed: number;
	maxAcceleration: number;
	minAcceleration: number;

	trailingSegment: Segment;
	usedSegments: Segment[];

	constructor(
		public id: number, 
		public cars: RollingStock[]
	) {
		this.location = new Location();

		this.speed = 0;
		this.acceleration = 0;
	}

	placeOn(segment: Segment) {
		segment.reservedBy = this;
		this.location.segment = segment;

		let distance = this.location.distance = this.length;
		
		for (let car of this.cars) {
			car.location.segment = segment;
			car.location.distance = distance;
			
			distance -= car.length;
		}

		return this;
	}

	get length() {
		return this.cars.reduce((a, car) => a + car.length, 0);
	}

	get safeBreakingDistance() {
		return this.breakingDistance;
	}

	getNextSegmentsInDistance(maxDistance: number) {
		return this.getNextSegmentsByCriteria((segment, distance, segments) => distance < maxDistance);
	}

	getNextSegments(count: number) {
		return this.getNextSegmentsByCriteria((segment, distance, segments) => segments.length < count);
	}

	getNextSegment() {
		return this.getNextSegments(2)[1];
	}

	getSegmentsUntil(end: Segment) {
		return this.getNextSegmentsByCriteria((segment, distance) => segment != end);
	}

	private getNextSegmentsByCriteria(criteria: (segment: Segment, distance?: number, segments?: Segment[]) => boolean) {
		let distance = -this.location.distance;
		let segment = this.location.segment;
		let overflowProtection = 0;
		
		const segments: Segment[] = [];

		while (segment && overflowProtection < 100 && criteria(segment, distance, segments)) {
			overflowProtection++;

			if (segment instanceof Turnout) {
				// todo: add implemenetation for reverse drive
				segments.push(segment);
				distance += segment.length;
				
				if (segment.direction) {
					if (!segment.eventualEndpoint) {
						return segments;
					}

					segment = segment.eventualEndpoint.segment;
				} else {
					segment = segment.commonEndpoint;
				}
			} else if (segment instanceof Block) {
				segments.push(segment);
				distance += segment.length;

				if (this.location.direction) {
					segment = segment.end;
				} else {
					segment = segment.start;
				}
			} else if (segment instanceof Bumper) {
				segments.push(segment);

				segment = null;
			}
		}

		return segments;
	}

	getSafeDistance(maxDistance: number) {
		return this.getNextSegmentsInDistance(maxDistance).filter(s => s instanceof Turnout ? s.eventualEndpoint : true).reduce((a, seg) => a + seg.length, -this.location.distance);
	}

	get currentMaxSpeed() {
		return Math.min(...this.cars.map(c => c.location.segment.speed.max));
	}

	get currentOptimalSpeed() {
		return Math.min(...this.cars.map(c => c.location.segment.speed.optimal));
	}

	getNextUnreservedTurnout() {
		return this.getNextSegmentsByCriteria(segment => segment instanceof Turnout && segment.reservedBy != this)[0] as Turnout;
	}

	getDistanceToSegment(segment: Segment) {
		let distance = -this.location.distance;
		let segments = this.getSegmentsUntil(segment);
		
		for (let segment of segments) {
			distance += segment.length;
		}
		
		return distance;
	}

	get firstCar() {
		return this.cars[0];
	}

	get lastCar() {
		return this.cars[this.cars.length - 1];
	}

	getNextControllableTurnout(max) {
		return this.getNextSegmentsInDistance(max).find(segment => {
			if (segment instanceof Turnout) {
				if (!segment.proposedState && segment.direction == this.location.direction && segment.reservedBy != this) {
					return true;
				} 
			}
		});
	}

	toData() {
		return {
			id: this.id,
			cars: this.cars.map(c => c.toData()),

			breakingDistance: this.breakingDistance,
			reactionDistance: this.reactionDistance,

			location: this.location.toData(),
			speed: this.speed,
			acceleration: this.acceleration,

			maxSpeed: this.maxSpeed,
			maxAcceleration: this.maxAcceleration,
			minAcceleration: this.minAcceleration,

			trailingSegmentId: this.trailingSegment && this.trailingSegment.id,
			usedSegmentsIds: this.usedSegments.map(s => s.id)
		};
	}

	static fromData(data, layout: Layout) {
		const train = new Train(data.id, data.cars.map(c => RollingStock.fromData(c, layout)));
		train.breakingDistance = data.breakingDistance;
		train.reactionDistance = data.reactionDistance;

		train.location = Location.fromData(data.location, layout);
		train.speed = data.speed;
		train.acceleration = data.acceleration;

		train.maxSpeed = data.maxSpeed;
		train.maxAcceleration = data.maxAcceleration;
		train.minAcceleration = data.minAcceleration;

		train.trailingSegment = layout.getSegment(data.trailingSegmentId);
		train.usedSegments = data.usedSegmentsIds.map(i => layout.getSegment(i));

		return train;
	}
}

export class Location {
	segment: Segment;
	distance: number;
	direction: boolean;

	toString() {
		return `${this.segment.id}@${this.distance.toFixed(2)}${this.direction ? "r" : "f"}`;
	}

	toData() {
		return {
			segmentId: this.segment.id,
			distance: this.distance,
			direction: this.direction
		}
	}

	static fromData(data, layout: Layout) {
		const location = new Location();
		location.segment = layout.getSegment(data.segmentId);
		location.distance = data.distance;
		location.direction = data.direction;

		return location;
	} 
}

export class RollingStock {
	location: Location;

	constructor(
		public name: string, 
		public length: number, 
		public tags: RollingStockTag[]
	) {
		this.location = new Location();
	}

	toData() {}

	static fromData(data, layout: Layout) {
		if (data.type == "locomotive") {
			return Locomotive.fromData(data, layout);
		}

		if (data.type == "wagon") {
			return Wagon.fromData(data, layout);
		}
	}
}

export class Locomotive extends RollingStock {
	constructor(
		public address: number, 
		name: string, 
		length: number, 
		tags: RollingStockTag[]
	) {
		super(name, length, tags);
	}

	toData() {
		return {
			type: "locomotive",
			location: this.location.toData(),
			address: this.address,
			name: this.name,
			length: this.length,
			tags: this.tags.map(t => t.toData())
		}
	}

	static fromData(data, layout: Layout) {
		const car = new Locomotive(data.address, data.name, data.length, data.tags.map(t => RollingStockTag.fromData(t, layout)));
		car.location = Location.fromData(data.location, layout);

		return car;
	}
}

export class Wagon extends RollingStock {
	constructor(
		name: string, 
		length: number, 
		tags: RollingStockTag[]
	) {
		super(name, length, tags);
	}

	toData() {
		return {
			type: "wagon",
			location: this.location.toData(),
			name: this.name,
			length: this.length,
			tags: this.tags.map(t => t.toData())
		}
	}

	static fromData(data, layout: Layout) {
		const car = new Wagon(data.name, data.length, data.tags.map(t => RollingStockTag.fromData(t, layout)));
		car.location = Location.fromData(data.location, layout);

		return car;
	}
}

export class RollingStockTag {
	constructor(public location: number) {}

	toData() {}

	static fromData(data, layout: Layout) {
		if (data.type == "rfid") {
			return RollingStockIdentificationTag.fromData(data, layout);
		}

		if (data.type == "magnet") {
			return RollingStockMagnet.fromData(data, layout);
		}
	}
}

export class RollingStockIdentificationTag extends RollingStockTag {
	constructor(
		location: number,
		public number: number
	) {
		super(location);
	}

	toData() {
		return {
			type: "rfid",
			location: this.location,
			number: this.number
		}
	}

	static fromData(data, layout: Layout) {
		return new RollingStockIdentificationTag(data.location, data.number);
	}
}

export class RollingStockMagnet extends RollingStockTag {
	constructor(
		location: number, 
		public pole: MagnetPole
	) {
		super(location);
	}

	toData() {
		return {
			type: "magnet",
			location: this.location,
			pole: this.pole.toString()
		}
	}

	static fromData(data, layout: Layout) {
		if (data.pole == MagnetPole.north.toString()) {
			return new PositiveRollingStockMagnet(data.location);
		}

		if (data.pole == MagnetPole.south.toString()) {
			return new NegativeRollingStockMagnet(data.location);
		}
	}
}

export class PositiveRollingStockMagnet extends RollingStockMagnet {
	constructor(location) {
		super(location, MagnetPole.north);
	}
}

export class NegativeRollingStockMagnet extends RollingStockMagnet {
	constructor(location) {
		super(location, MagnetPole.south);
	}
}