import { Speed } from "./speed";
import { SegmentSensor } from "./sensor";
import { Layout } from "./layout";
import { Train } from "./train";

export interface Segment {
	id: string;
	length: number;
	reservedBy?: Train;
	speed: Speed;

	curve: number;
	elevation: number;

	elevationAt(distance: number): number;
	
	resolveConnections(layout: Layout);
}

export class Block implements Segment {
	start?: Segment;
	end?: Segment;

	reservedBy?: Train;

	curve: number;
	curveDelta: number = 0;

	elevation: number;
	elevationDelta: number = 0;

	constructor(
		public id: string,
		public length: number,
		public speed: Speed,
		public sensors: SegmentSensor[],
		public startId?: string,
		public endId?: string
	) {
		this.curve = 0;
		this.elevation = 0;
	}

	elevationAt(distance: number) {
		let startElevation;

		if (this.start) {
			startElevation = this.start.elevation;
		} else {
			startElevation = this.elevation - this.elevationDelta;
		}

		return startElevation + (1 / this.length * distance) * this.elevationDelta;
	}

	curveRight(degrees: number) {
		this.curveDelta = degrees;

		return this;
	}

	curveLeft(degrees: number) {
		this.curveDelta = -degrees;

		return this;
	}

	atHeight(height: number) {
		this.elevation = height;

		return this;
	}

	incline(height: number) {
		this.elevationDelta = height;

		return this;
	}

	decline(height: number) {
		this.elevationDelta = -height;

		return this;
	}

	resolveConnections(layout: Layout) {
		if (this.startId) {
			this.start = layout.segments.find(s => s.id == this.startId);

			if (!this.start) {
				throw new Error(`Start segment '${this.startId}' not found`);
			}

			this.elevation = this.start.elevation + this.elevationDelta;
			this.curve = (this.start.curve + this.curveDelta) % 360;
		} else {
			this.start = new Bumper("es-" + this.id, this.id);

			layout.segments.push(this.start);
			this.start.resolveConnections(layout);
		}

		if (this.endId) {
			this.end = layout.segments.find(s => s.id == this.endId);

			if (!this.end) {
				throw new Error(`End segment '${this.endId}' not found`);
			}

			if (!this.start || this.elevation == NaN) {
				this.elevation = this.end.elevation - this.elevationDelta;
				this.curve = (this.end.curve - this.curveDelta) % 360;
			}
		} else {
			this.end = new Bumper("ee-" + this.id, this.id);

			layout.segments.push(this.end);
			this.end.resolveConnections(layout);
		}
	}
}

export class Turnout implements Segment {
	commonEndpoint: Segment;
	endpoints: TurnoutEndpoint[];

	reservedBy?: Train;
	switching: null | "left" | "middle" | "right";

	defaultState: "left" | "middle" | "right";
	proposedState: null | "left" | "middle" | "right";
	currentState: "left" | "middle" | "right";

	curve: number;
	elevation: number;

	constructor(
		public id: string,
		public length: number,
		public speed: Speed,
		public reservationDistance: number,
		public switchingTime: number,
		public direction: boolean,
		public endpointIds: {
			left?: string,
			middle?: string,
			right?: string,
			common: string,
			default: "left" | "middle" | "right"
		}
	) {
		this.endpoints = [];

		this.defaultState = this.endpointIds.default;
	}

	elevationAt(distance: number): number {
		return this.elevation;
	}

	resolveConnections(layout: Layout) {
		this.commonEndpoint = layout.segments.find(s => s.id == this.endpointIds.common);

		if (!this.commonEndpoint) {
			throw new Error(`Common segment '${this.endpointIds.common}' not found`);
		}

		for (let endpoint of ["left", "middle", "right"]) {
			if (this.endpointIds[endpoint]) {
				const segment = layout.segments.find(s => s.id == this.endpointIds[endpoint]);
	
				if (!segment) {
					throw new Error(`${endpoint} segment '${this.endpointIds[endpoint]}' not found`);
				}

				this.endpoints.push(new TurnoutEndpoint(endpoint as any, segment));
			}
		}

		this.curve = this.commonEndpoint.curve;
		this.elevation = this.commonEndpoint.elevation;
	}

	switchToProposedDirection() {
		return new Promise(done => {
			const direction = this.proposedState;

			if (!direction) {
				done();
				
				return;
			}
			
			if (this.switching && this.switching != direction) {
				throw new Error("Switch already switching in another direction");
			}

			console.log(`[turnout/switch/${this.id}] ${this.currentState} -> ${direction}`);

			if (this.switching && this.switching == direction) {
				done();

				return;
			}
			
			this.switching = direction;
			
			setTimeout(() => {
				this.switching = null;
				this.proposedState = null;
				
				this.currentState = direction;

				console.log(`[turnout/switched/${this.id}] ${this.currentState} -> ${direction}`);

				done();
			}, this.switchingTime * 1000);
		});
	}

	get eventualState() {
		return this.switching || this.proposedState || this.currentState;
	}

	get currentEndpoint() {
		return this.endpoints.find(e => e.name == this.currentState);
	}

	get eventualEndpoint() {
		return this.endpoints.find(e => e.name == this.eventualState);
	}

	toData() {
		return {
			id: this.id,
			proposedState: this.proposedState,
			currentState: this.currentState
		};
	}
}

export class TurnoutEndpoint {
	constructor(
		public name: "left" | "middle" | "right",
		public segment: Segment
	) {}
}

export class Bumper implements Segment {
	reservedBy?: Train;
	speed: Speed;
	length = 0;

	end: Segment;

	curve;
	elevation;

	constructor(
		public id: string,
		public endId: string
	) {}

	elevationAt(distance: number): number {
		return this.elevation;
	}

	resolveConnections(layout: Layout) {
		this.end = layout.segments.find(s => s.id == this.endId);

		if (!this.end) {
			throw new Error(`End segment '${this.endId}' not found`);
		}

		this.elevation = this.end.elevation;
		this.curve = this.end.curve;
	}
}