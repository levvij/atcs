class TrainView {
	constructor(element, train) {
		this.train = train;
		
		const canvas = document.createElement("canvas");
		
		this.width = canvas.width = element.clientWidth;
		this.height = canvas.height = element.clientHeight;
		
		element.appendChild(canvas);
		this.ctx = canvas.getContext("2d");
		
		this.ctx.font = `${this.width / 5}px Arial`;
		this.ctx.textAlign = "left";
		this.ctx.textBaseline = "top";
		
		this.update();
	}
	
	update() {
		this.ctx.clearRect(0, 0, this.width, this.height);
		
		const carWidth = this.width / 6;
		const tagSize = Math.min(this.width / this.train.length * 10, carWidth / 2);
		
		let distance = 0;
		
		this.ctx.lineWidth = 2;
		this.ctx.fillStyle = "#060";
		this.ctx.strokeStyle = "#fff";
		
		for (let car of this.train.cars) {
			this.ctx.beginPath();
			this.ctx.rect(this.width / 2 - carWidth / 2, this.toPosition(distance), carWidth, this.toPosition(distance + car.length) - this.toPosition(distance));
			
			if (car instanceof Locomotive) {
				this.ctx.fill();
			}
			
			this.ctx.stroke();
			
			for (let tag of car.tags) {
				const location = this.toPosition(distance + tag.location);
				
				this.ctx.beginPath();
				
				if (tag instanceof NegativeRollingStockMagnet) {
					this.ctx.moveTo(this.width / 2 - carWidth / 2, location);
					this.ctx.lineTo(this.width / 2 - carWidth / 2 + tagSize, location - tagSize);
					this.ctx.lineTo(this.width / 2 - carWidth / 2 + tagSize, location + tagSize);
					this.ctx.lineTo(this.width / 2 - carWidth / 2, location);
				}
				
				if (tag instanceof PositiveRollingStockMagnet) {
					this.ctx.moveTo(this.width / 2 + carWidth / 2, location);
					this.ctx.lineTo(this.width / 2 + carWidth / 2 - tagSize, location - tagSize);
					this.ctx.lineTo(this.width / 2 + carWidth / 2 - tagSize, location + tagSize);
					this.ctx.lineTo(this.width / 2 + carWidth / 2, location);
				}
				
				if (tag instanceof RollingStockIdentificationTag) {
					this.ctx.moveTo(this.width / 2, location - tagSize);
					this.ctx.lineTo(this.width / 2 + tagSize, location);
					this.ctx.lineTo(this.width / 2, location + tagSize);
					this.ctx.lineTo(this.width / 2 - tagSize, location);
					this.ctx.lineTo(this.width / 2, location - tagSize);
				}
				
				if (tag.hit) {
					this.ctx.fill();
				}
				
				this.ctx.stroke();
			}
			
			distance += car.length;
		}
		
		this.ctx.fillStyle = "#fff";
		
		distance = data.train.location.distance - data.train.location.segment.length;
		for (let segment of [...data.train.location.usedSegments, data.train.location.trailingSegment]) {
			this.ctx.beginPath();
			this.ctx.moveTo(0, this.toPosition(distance));
			this.ctx.lineTo(this.width / 5, this.toPosition(distance));
			
			this.ctx.lineWidth = 4;
			this.ctx.stroke();
			
			if (segment) {
				this.ctx.fillText(segment.id, this.width / 20, Math.max(this.toPosition(distance), this.width / 20));
				
				distance += segment.length;
				
				if (segment.block && segment.block.sensors) {
					for (let sensor of segment.block.sensors) {
						this.ctx.beginPath();
						
						const location = this.toPosition(distance - sensor.location);
				
						if ((sensor instanceof PositiveMagnetReader) || (sensor instanceof BiMagnetReader)) {
							this.ctx.moveTo(this.width / 2 + carWidth / 2, location);
							this.ctx.lineTo(this.width / 2 + carWidth / 2 + tagSize, location - tagSize);
							this.ctx.lineTo(this.width / 2 + carWidth / 2 + tagSize, location + tagSize);
							this.ctx.lineTo(this.width / 2 + carWidth / 2, location);
						}

						if ((sensor instanceof NegativeMagnetReader) || (sensor instanceof BiMagnetReader)) {
							this.ctx.moveTo(this.width / 2 - carWidth / 2, location);
							this.ctx.lineTo(this.width / 2 - carWidth / 2 - tagSize, location - tagSize);
							this.ctx.lineTo(this.width / 2 - carWidth / 2 - tagSize, location + tagSize);
							this.ctx.lineTo(this.width / 2 - carWidth / 2, location);
						}

						if (sensor instanceof RollingStockIdentificationReader) {
							this.ctx.moveTo(this.width / 2, location - tagSize);
							this.ctx.lineTo(this.width / 2 + tagSize, location);
							this.ctx.lineTo(this.width / 2, location + tagSize);
							this.ctx.lineTo(this.width / 2 - tagSize, location);
							this.ctx.lineTo(this.width / 2, location - tagSize);
						}

						if (sensor.hit) {
							this.ctx.fill();
						}

						this.ctx.lineWidth = 2;
						this.ctx.stroke();
					}
				}
			}
		}
		
		requestAnimationFrame(() => this.update());
	}
	
	toPosition(distance) {
		return (this.height * 0.8) / this.train.length * distance + this.height * 0.1;
	}
}