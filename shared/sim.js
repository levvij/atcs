class Simulator {
	constructor() {
		this.updateTime = new Date();
		
		this.update();
		
		setInterval(() => this.update(), 10);
	}
	
	update() {
		const elapsedTime = (new Date() - this.updateTime) / 1000;
		
		const distance = (data.speed.current.value / 3.6) * elapsedTime;
		data.train.location.distance += distance;
		
		const length = (data.train.location.segment.block || data.train.location.segment.turnout).length;
		
		if (data.train.location.distance + data.train.safeBreakingDistance > length) {
			const segments = data.train.getNextSegments(data.train.safeBreakingDistance).filter(s => s != data.train.location.segment);
			
			for (let segment of segments) {
				if (segment.block) {
					segment.block.reservedBy = data.train;
				}
			}
		}
		
		if (data.train.location.distance > length) {
			const next = data.train.getNextSegment();
			
			if (next.bumper) {
				throw new Error(`Cannot set trains segment to bumper '${next.bumper.id}'`);
			}
			
			// add train length later
			if (data.train.location.segment.block) {
				data.train.location.segment.block.reservedBy = null;
			} else if (data.train.location.segment.turnout) {
				data.train.location.segment.turnout.reservedBy = null;
			}
			
			data.train.location.segment = next;
			data.train.location.distance = data.train.location.distance - length;
		}
		
		if (data.train.getSafeDistance(data.train.safeBreakingDistance) < data.train.safeBreakingDistance) {
			data.speed.current.acceleration = data.acceleration.min;
		}
		
		const nextTurnout = data.train.getNextUnreservedTurnout(data.train.safeBreakingDistance + (data.speed.current.max / 3.6) * data.longestTurnoutSwitchingTime + distance * 2);
		
		if (nextTurnout) {
			const turnoutDistance = data.train.safeBreakingDistance + (data.speed.current.max / 3.6) * nextTurnout.turnout.switchingTime;
			
			if (data.train.getDistanceToSegment(nextTurnout) < turnoutDistance) {
				nextTurnout.turnout.reservedBy = data.train;
				
				if (data.train.location.direction == nextTurnout.turnout.direction) {
					nextTurnout.turnout.switch();
				}
			}
		}
		
		data.speed.current.value = Math.max(data.speed.current.value + data.speed.current.acceleration * elapsedTime, 0);
		
		data.train.breaking.reaction = 0; (data.speed.current.value * 3) / 3.6;
		data.train.breaking.distance = (-data.speed.current.value / 3.6) / data.acceleration.min * (data.speed.current.value / 3.6 * 2);
		
		data.speed.current.max = data.train.location.segment.max;
		data.speed.current.optimal = data.train.location.segment.optimal;
		
		data.train.location.usedSegments = [
			data.train.location.segment,
			...data.train.cars.map(c => c.location.segment)
		].filter((c, i, a) => a.indexOf(c) == i);
		
		for (let car of data.train.cars) {
			if (car.location.segment.length < car.location.distance + distance) {
				car.location.distance = car.location.distance + distance - car.location.segment.length;
				
				if (car == data.train.cars[data.train.cars.length - 1]) {
					data.train.location.trailingSegment = car.location.segment;
				}
				
				car.location.segment = data.train.location.usedSegments[data.train.location.usedSegments.indexOf(car.location.segment) - 1];
			} else {
				car.location.distance += distance;
			}
		}
		
		this.updateTime = new Date();
	}
}