import { Speed } from "./speed";
import { SegmentSensor } from "./sensor";
import { Layout } from "./layout";
import { Train } from "./train";

export interface Segment {
	id: string;
	length: number;
	reservedBy?: Train;
	speed: Speed;

	resolveConnections(layout: Layout);
}

export class Block implements Segment {
	start?: Segment;
	end?: Segment;

	reservedBy?: Train;

	constructor(
		public id: string,
		public length: number,
		public speed: Speed,
		public sensors: SegmentSensor[],
		public startId?: string,
		public endId?: string
	) {}

	resolveConnections(layout: Layout) {
		if (this.startId) {
			this.start = layout.segments.find(s => s.id == this.startId);

			if (!this.start) {
				throw new Error(`Start segment '${this.startId}' not found`);
			}
		} else {
			this.start = new Bumper("es-" + this.id, this.id);
		}

		if (this.endId) {
			this.end = layout.segments.find(s => s.id == this.endId);

			if (!this.start) {
				throw new Error(`End segment '${this.endId}' not found`);
			}
		} else {
			this.start = new Bumper("ee-" + this.id, this.id);
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

	constructor(
		public id: string,
		public length: number,
		public speed: Speed,
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

		console.log(this.id, this.endpoints);
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

			console.log(`[TURNOUT SWITCH: ${this.id}] ${this.currentState} -> ${direction}`);

			if (this.switching && this.switching == direction) {
				done();

				return;
			}
			
			this.switching = direction;
			
			setTimeout(() => {
				this.switching = null;
				this.proposedState = null;
				
				this.currentState = direction;

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

	constructor(
		public id: string,
		public endId: string
	) {}

	resolveConnections(layout: Layout) {
		this.end = layout.segments.find(s => s.id == this.endId);

		if (!this.end) {
			throw new Error(`End segment '${this.endId}' not found`);
		}
	}
}