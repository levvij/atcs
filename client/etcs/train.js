class Train {
	constructor(segment, distance, direction, cars) {
		this.breaking = {
			distance: 0,
			reaction: 0
		};
		
		this.location = {
			segment,
			direction,
			distance
		};
		
		this.cars = cars;
	}
	
	getNextSegments(maxDistance, numberOfSegments, endSegment) {
		let distance = -this.location.distance;
		let segment = this.location.segment;
		let overflowProtection = 0;
		
		const segments = [];
		
		while (segment && overflowProtection < 100 && (endSegment ? segment != endSegment : (maxDistance == -1 ? segments.length < numberOfSegments : distance < maxDistance))) {
			overflowProtection++;
			
			if (segment.turnout) {
				if (this.location.direction) {
					segments.push(segment);
					distance += segment.turnout.length;
					
					if (segment.turnout.direction) {
						segment = segment.turnout[segment.turnout.proposedState || segment.turnout.current];
					} else {
						segment = segment.turnout.common;
					}
				}
				
				// add implementation for reverse drive
			} else if (segment.block) {
				segments.push(segment);
				distance += segment.block.length;
					
				if (this.location.direction) {
					segment = segment.block.end;
				} else {
					segment = segment.block.start;
				}
			} else if (segment.bumper) {
				segments.push(segment);
				
				segment = null;
			}
		}
		
		return segments;
	}
	
	getNextSegment() {
		return this.getNextSegments(-1, 2)[1];
	}
	
	get safeBreakingDistance() {
		return this.breaking.distance + this.breaking.reaction;
	}
	
	getSafeDistance(max) {
		const segments = this.getNextSegments(max);
		let distance = -this.location.distance;
		
		for (let segment of segments) {
			if (segment.block) {
				distance += segment.block.length;
			} else if (segment.turnout) {
				distance += segment.turnout.length;
			} else if (segment.bumper) {
				return distance;
			}
		}
		
		return distance;
	}
	
	reverse() {
		data.train.location.direction = !data.train.location.direction;
	}
	
	accelerateTo(speed, time, distance) {
		if (Math.round(speed) == Math.round(data.speed.current.value)) {
			return;
		}
		
		if (!time && distance) {
			time = (36 * distance) / (5 * ((speed - data.speed.current.value) + 2 * data.speed.current.value));
		}
		
		const accel = (speed - data.speed.current.value) / time;
		
		if (accel > data.acceleration.max) {
			data.speed.current.acceleration = data.acceleration.max;
		}
		
		if (accel < data.acceleration.min) {
			data.speed.current.acceleration = data.acceleration.min;
		}
		
		data.speed.current.acceleration = accel;
		
		setTimeout(() => {
			if (accel == data.speed.current.acceleration) {
				data.speed.current.acceleration = 0;
			}
		}, time * 1000);
	}
	
	getNextUnreservedTurnout(max) {
		return this.getNextSegments(max).find(s => s.turnout && s.turnout.reservedBy != this);
	}
	
	getNextControllableTurnout(max) {
		return this.getNextSegments(max).find(s => s.turnout && !s.turnout.proposedState && s.turnout.direction == this.location.direction && s.turnout.reservedBy != this);
	}
	
	getDistanceToSegment(segment) {
		let distance = -this.location.distance;
		let segments = this.getNextSegments(null, null, segment);
		
		for (let segment of segments) {
			distance += segment.length;
		}
		
		return distance;
	}
	
	get viewingDistance() {
		const segments = this.getNextSegments(data.viewingDistance.lookahead);
		const nonCurvedSegments = [];
		
		for (let segment of [...segments , -1]) {
			if (segment == -1 || segment.bumper || (segment.block && segment.block.curved) || (segment.turnout && segment.turnout.eventualState != "middle")) {
				const v = Math.max(
					this.location.segment.length - this.location.distance,
					Math.min(
						data.viewingDistance.max, 
						nonCurvedSegments.reduce((a, c) => a + c.length, 0) - this.location.distance + (segment.bumper ? data.viewingDistance.max : 0)
					)
				);
				
				return v;
			} else {
				nonCurvedSegments.push(segment);
			}
		}
	}
	
	get length() {
		return this.cars.reduce((a, c) => a + c.length, 0);
	}
}

class RollingStock {
	constructor(name, length, tags) {
		this.name = name;
		this.length = length;
		this.tags = tags;
		
		this.location = {};
	}
}

class Locomotive extends RollingStock {
	constructor(address, name, length, tags) {
		super(name, length, tags);
		
		this.address = address;
	}
}

class Wagon extends RollingStock {
	constructor(name, length, tags) {
		super(name, length, tags);
	}
}

class RollingStockIdentificationTag {
	constructor(location, number) {
		this.location = location;
		this.number = number;
	}
}

class RollingStockMagnet {
	constructor(location, pole) {
		this.location = location;
		this.pole = pole;
	}
}

class PositiveRollingStockMagnet extends RollingStockMagnet {
	constructor(location, direction) {
		super(location, "north");
	}
}

class NegativeRollingStockMagnet extends RollingStockMagnet {
	constructor(location, direction) {
		super(location, "south");
	}
}