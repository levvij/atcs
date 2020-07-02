import { Train } from "../../shared/train";

export class Gauge {
	ranges: GaugeRange[] = [
		{
			start: 0,
			end: 200,
			factor: 1,
			labels: [0, 50, 100, 150, 200]
		},
		{
			start: 200,
			end: 400,
			factor: 0.5,
			labels: [300, 400]
		}
	];

	overspeedSound: HTMLAudioElement;
	speedChangeSound: HTMLAudioElement;

	lastMaxSpeed: number;
	lastSpeed: number;

	font = "Arial";
	gaugeSize: number;
	gaugeWidth: number;
	textPosition: number;
	speedRingSize: number;
	speedCircleSize: number;
	accelSize: number;
	maxSpeed: number;
	totalFactor: number;

	width: number;
	height: number;

	backgroundCtx: CanvasRenderingContext2D;
	foregroundCtx: CanvasRenderingContext2D;

	constructor(
		element: HTMLElement, 
		public train: Train
	) {
		const currentRange = this.ranges.find(r => r.start <= this.train.speed && r.end > this.train.speed);
		
		const backgroundCanvas = document.createElement("canvas");
		const foregroundCanvas = document.createElement("canvas");

		this.width = foregroundCanvas.width = backgroundCanvas.width = element.clientWidth;
		this.height = foregroundCanvas.height = backgroundCanvas.height = element.clientHeight;

		element.appendChild(backgroundCanvas);
		element.appendChild(foregroundCanvas);
		
		this.overspeedSound = new Audio("/assets/audio/overspeed.mp3");
		this.speedChangeSound = new Audio("/assets/audio/speed-change.mp3");

		this.backgroundCtx = backgroundCanvas.getContext("2d");
		this.foregroundCtx = foregroundCanvas.getContext("2d");

		this.gaugeSize = Math.min(this.width, this.height);
		this.gaugeWidth = this.gaugeSize / 8;
		this.textPosition = this.gaugeSize / 4;
		this.speedRingSize = this.gaugeSize / 40;
		this.speedCircleSize = this.gaugeSize / 8;
		this.accelSize = this.gaugeSize / 8;

		this.maxSpeed = Math.max(...this.ranges.map(r => r.end));
		this.totalFactor = this.ranges.reduce((a, c) => {
			c.startFactor = a;
			c.endFactor = a + c.factor;
			c.range = c.end - c.start;

			return c.factor + a;
		}, 0);

		this.backgroundCtx.strokeStyle = "#fff";
		this.backgroundCtx.fillStyle = "#fff";

		this.foregroundCtx.textAlign = this.backgroundCtx.textAlign = "center";
		this.foregroundCtx.textBaseline = this.backgroundCtx.textBaseline = "middle";
		this.foregroundCtx.font = this.backgroundCtx.font = `${this.gaugeSize / 20}px ${this.font}`;

		this.updateBackground();
		this.update();
	}

	updateBackground() {
		// speed lines
		let renderingRange = this.ranges[0];

		for (let r = 1.75 * Math.PI; r >= 0.25 * Math.PI; r -= Math.PI / this.maxSpeed * 20 * renderingRange.factor) {
			const factor = (1.5 - (1 / Math.PI * r - 0.25)) / 1.5 * this.totalFactor;
			renderingRange = this.ranges.find(r => r.startFactor <= factor && r.endFactor > factor) || this.ranges[this.ranges.length - 1];

			const currentSpeed = Math.round((factor - renderingRange.startFactor) / renderingRange.factor * (renderingRange.end - renderingRange.start) + renderingRange.start);
			
			// speed labels
			if (this.ranges.find(r => r.labels.includes(currentSpeed))) {
				this.backgroundCtx.fillText(currentSpeed + "", Math.sin(r) * (this.gaugeSize - this.textPosition) / 2 + this.width / 2, Math.cos(r) * (this.gaugeSize - this.textPosition) / 2 + this.height / 2);

				this.backgroundCtx.lineWidth = 3;
			} else {
				this.backgroundCtx.lineWidth = 2;
			}

			this.backgroundCtx.beginPath();
			this.backgroundCtx.moveTo(Math.sin(r) * (this.gaugeSize - this.gaugeWidth) / 2 + this.width / 2, Math.cos(r) * (this.gaugeSize - this.gaugeWidth) / 2 + this.height / 2);
			this.backgroundCtx.lineTo(Math.sin(r) * this.gaugeSize / 2 + this.width / 2, Math.cos(r) * this.gaugeSize / 2 + this.height / 2);
			this.backgroundCtx.stroke();
		}
	}

	update() {
		this.foregroundCtx.clearRect(0, 0, this.width, this.height);
			
		if (this.lastMaxSpeed != this.train.location.segment.speed.max) {
			this.speedChangeSound.play();
			
			this.lastMaxSpeed = this.train.location.segment.speed.max;
		}

		// max speed circle
		this.foregroundCtx.lineWidth = this.speedRingSize;

		this.foregroundCtx.fillStyle = this.foregroundCtx.strokeStyle = "#666";
		this.foregroundCtx.beginPath();
		this.foregroundCtx.arc(this.width / 2, this.height / 2, this.gaugeSize / 2 - this.speedRingSize / 2, 0.75 * Math.PI, this.toArc(this.train.currentOptimalSpeed));
		this.foregroundCtx.stroke();

		// slow down / speed up circle
		if (this.train.speed > this.train.currentOptimalSpeed) {
			this.foregroundCtx.fillStyle = this.foregroundCtx.strokeStyle = "#ff0";
			this.foregroundCtx.beginPath();
			this.foregroundCtx.arc(this.width / 2, this.height / 2, this.gaugeSize / 2 - this.speedRingSize / 2, this.toArc(this.train.currentOptimalSpeed), this.toArc(this.train.currentMaxSpeed));
			this.foregroundCtx.stroke();
		} 

		if (this.train.speed <= this.train.currentOptimalSpeed) {
			this.foregroundCtx.fillStyle = this.foregroundCtx.strokeStyle = "#fff";
			this.foregroundCtx.beginPath();
			this.foregroundCtx.arc(this.width / 2, this.height / 2, this.gaugeSize / 2 - this.speedRingSize / 2, this.toArc(this.train.speed), this.toArc(this.train.currentOptimalSpeed));
			this.foregroundCtx.stroke();
		}

		if (this.train.speed > this.train.currentMaxSpeed) {
			this.foregroundCtx.fillStyle = this.foregroundCtx.strokeStyle = "#f00";
			this.foregroundCtx.beginPath();
			this.foregroundCtx.arc(this.width / 2, this.height / 2, this.gaugeSize / 2 - this.speedRingSize / 2, this.toArc(this.train.currentMaxSpeed), this.toArc(this.train.speed));
			this.foregroundCtx.stroke();
		}

		// max speed line
		this.foregroundCtx.lineWidth = 8;
		let r = Math.PI * 0.5 - this.toArc(Math.max(this.train.speed, this.train.currentMaxSpeed));

		this.foregroundCtx.beginPath();
		this.foregroundCtx.moveTo(Math.sin(r) * (this.gaugeSize - this.gaugeWidth) / 2 + this.width / 2, Math.cos(r) * (this.gaugeSize - this.gaugeWidth) / 2 + this.height / 2);
		this.foregroundCtx.lineTo(Math.sin(r) * this.gaugeSize / 2 + this.width / 2, Math.cos(r) * this.gaugeSize / 2 + this.height / 2);
		this.foregroundCtx.stroke();

		// speed circle in the middle of the gauge
		this.foregroundCtx.beginPath();
		this.foregroundCtx.arc(this.width / 2, this.height / 2, this.speedCircleSize, 0, 2 * Math.PI);
		this.foregroundCtx.fill();

		// current speed line
		this.foregroundCtx.lineWidth = 8;
		r = Math.PI * 0.5 - this.toArc(this.train.speed);

		this.foregroundCtx.beginPath();
		this.foregroundCtx.moveTo(Math.sin(r) * (this.gaugeSize - this.gaugeWidth) / 2 + this.width / 2, Math.cos(r) * (this.gaugeSize - this.gaugeWidth) / 2 + this.height / 2);
		this.foregroundCtx.lineTo(this.width / 2, this.height / 2);
		this.foregroundCtx.stroke();

		this.foregroundCtx.lineWidth *= 2;

		this.foregroundCtx.beginPath();
		this.foregroundCtx.moveTo(Math.sin(r) * this.gaugeSize / 4 + this.width / 2, Math.cos(r) * this.gaugeSize / 4 + this.height / 2);
		this.foregroundCtx.lineTo(this.width / 2, this.height / 2);
		this.foregroundCtx.stroke();

		// speed label
		this.foregroundCtx.font = `${this.gaugeSize / 10}px ${this.font}`;
		this.foregroundCtx.fillStyle = "#000";
		this.foregroundCtx.fillText(Math.round(this.train.speed) + "", this.width / 2, this.height / 2);
		
		// acceleration
		this.foregroundCtx.strokeStyle = "#fff";
		this.foregroundCtx.lineWidth = 2;
		
		this.foregroundCtx.beginPath();
		this.foregroundCtx.moveTo(this.width / 2, this.height);
		this.foregroundCtx.lineTo(this.width / 2, this.height - this.accelSize);
		this.foregroundCtx.stroke();
		
		this.foregroundCtx.lineWidth = this.accelSize / 2;
		this.foregroundCtx.beginPath();
		this.foregroundCtx.moveTo(this.width / 2, this.height - this.accelSize / 2);
		
		if (this.train.acceleration > 0) {
			this.foregroundCtx.lineTo(this.width / 2 + this.width / 2 / this.train.maxAcceleration * this.train.acceleration, this.height - this.accelSize / 2);
		} else {
			this.foregroundCtx.lineTo(this.width / 2 + this.width / 2 / -this.train.minAcceleration * this.train.acceleration, this.height - this.accelSize / 2);
		}
		
		this.foregroundCtx.stroke();
			
		requestAnimationFrame(() => this.update());
	}

	toArc(speed) {
		const range = this.ranges.find(r => r.start <= speed && r.end > speed) || this.ranges[this.ranges.length - 1];

		return (
			((range.startFactor + (speed - range.start) / range.range * range.factor) / this.totalFactor) * 1.5 + 0.75
		) * Math.PI;
	}
}

export class GaugeRange {
	start: number;
	end: number;
	factor: number;
	labels: number[];
	
	startFactor?: number;
	endFactor?: number;
	range?: number;
}