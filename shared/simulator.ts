import { Layout } from "./layout";
import { Train } from "./train";
import { Bumper, Block, Turnout, Segment } from "./segment";
import { ManagedEvent } from "./managed-event";

export class Simulator {
	lastTick: number;

	ontournoutreserve = new ManagedEvent<Turnout>("turnout reservation");
	onblockreserve = new ManagedEvent<Block>("block reservation");

	constructor(
		public layout: Layout, 
		public train: Train
	) {
		console.log(`[simulator/${train.id}] started`);

		for (let car of train.cars) {
			console.log(` ${car.name} ${car.location} ${car.length}`)
		}

		this.lastTick = +new Date();
		
		setInterval(() => {
			this.tick();
		}, 25);

		setInterval(() => {
			console.log(`[simulator/${train.id}] loc: ${train.location}, ${Math.round(train.speed * 10) / 10}km/h (${train.acceleration > 0 ? `+${train.acceleration}` : train.acceleration})`);
		}, 5000);
	}

	tick() {
		let elapsedTime = (+new Date() - this.lastTick) / 1000;

		const distance = (this.train.speed / 3.6) * elapsedTime;
		this.train.location.distance += distance;

		// pre-reserve segments
		if (this.train.location.distance + this.train.safeBreakingDistance > this.train.location.segment.length) {
			const segments = this.train.getNextSegmentsInDistance(this.train.safeBreakingDistance).filter(s => s != this.train.location.segment);

			for (let segment of segments) {
				if (segment instanceof Block) {
					if (segment.reservedBy != this.train) {
						this.onblockreserve.emit(segment);
					}
				}
			}
		}

		// enter a new segment
		if (this.train.location.distance > this.train.location.segment.length) {
			const next = this.train.getNextSegment();

			if (next instanceof Bumper) {
				throw new Error(`Cannot set trains segment to bumper '${next.id}'`);
			}

			this.train.location.distance = this.train.location.distance - this.train.location.segment.length;
			this.train.location.segment = next;
		}

		// ETCS emergency break
		if (this.train.getSafeDistance(this.train.safeBreakingDistance + distance * 2) - distance < this.train.safeBreakingDistance) {
			this.train.acceleration = this.train.minAcceleration;
		}

		// reserve and switch upcoming turnouts
		const nextTurnout = this.train.getNextUnreservedTurnout();

		if (nextTurnout) {
			const distance = this.train.safeBreakingDistance + (this.train.currentMaxSpeed / 3.6) * nextTurnout.switchingTime + nextTurnout.reservationDistance;

			if (this.train.getDistanceToSegment(nextTurnout) < distance) {
				this.ontournoutreserve.emit(nextTurnout);
			}
		}

		// apply acceleration + breakes
		this.train.speed = Math.min(this.train.maxSpeed, Math.max(this.train.speed + this.train.acceleration * elapsedTime, 0));

		this.train.breakingDistance = (-this.train.speed / 3.6) / this.train.minAcceleration * (this.train.speed / 3.6 * 2);

		// update used segments of all cars
		this.train.usedSegments = [
			this.train.location.segment,
			...this.train.cars.map(car => car.location.segment)
		].filter((c, i, a) => a.indexOf(c) == i);

		for (let car of this.train.cars) {
			if (car.location.segment.length < car.location.distance + distance) {
				car.location.distance = car.location.distance + distance - car.location.segment.length;

				if (car == this.train.lastCar) {
					this.train.trailingSegment = car.location.segment;
				}

				car.location.segment = this.train.usedSegments[this.train.usedSegments.indexOf(car.location.segment) - 1];
			} else {
				car.location.distance += distance;
			}
		}

		this.lastTick = +new Date();
	}
}