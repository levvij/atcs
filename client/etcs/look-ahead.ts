import { Label } from "./label";
import { Train } from "../../shared/train";
import { Turnout, Block, Bumper } from "../../shared/segment";

export class LookAhead {
	max = 250;
	steps = [50, 100, 250, 500, 1000, 2000, 4000];

	width: number;
	height: number;

	lastMax: number;

	backgroundCtx: CanvasRenderingContext2D;
	foregroundCtx: CanvasRenderingContext2D;

	segmentLengthLabel: Label;
	segmentRemainderLabel: Label;
	breakDistanceLabel: Label;
	safeBreakDistanceLabel: Label;
	lookaheadSafeDistanceLabel: Label;
	currentSegmentLabel: Label;

	constructor(
		public element: HTMLElement,
		public train: Train 
	) {
		const backgroundCanvas = document.createElement("canvas");
		const foregroundCanvas = document.createElement("canvas");

		this.width = foregroundCanvas.width = backgroundCanvas.width = element.clientWidth;
		this.height = foregroundCanvas.height = backgroundCanvas.height = element.clientHeight;

		element.appendChild(backgroundCanvas);
		element.appendChild(foregroundCanvas);
		
		this.backgroundCtx = backgroundCanvas.getContext("2d");
		this.foregroundCtx = foregroundCanvas.getContext("2d");
		
		this.backgroundCtx.strokeStyle = "#666";
		this.backgroundCtx.fillStyle = "#fff";
		
		this.backgroundCtx.textAlign = "left";
		this.backgroundCtx.textBaseline = "top";
		this.backgroundCtx.font = `${this.height / 30}px Arial`;
		
		this.updateBackground();
		
		this.segmentLengthLabel = new Label("segment-length");
		this.segmentRemainderLabel = new Label("segment-remainder");
		this.breakDistanceLabel = new Label("break-distance");
		this.safeBreakDistanceLabel = new Label("safe-break-distance");
		this.lookaheadSafeDistanceLabel = new Label("lookahead-safe-distance");
		this.currentSegmentLabel = new Label("current-segment");
		
		this.update();
	}
	
	toPosition(distance) {
		return this.height - this.height / this.max * distance;
	}
	
	update() {
		this.foregroundCtx.clearRect(0, 0, this.width, this.height);
		
		let distance = -this.train.location.distance;
		const segments = this.train.getNextSegments(this.max);
		
		let x = this.width / 2;
		
		if (this.train.location.segment instanceof Turnout) {
			x += this.width / 20 * {
				left: 1,
				middle: 0,
				right: -1
			}[this.train.location.segment.currentState] / this.train.location.segment.length * this.train.location.distance;
		}
		
		// viewing distance
		/* this.foregroundCtx.lineWidth = 2;
		
		this.foregroundCtx.strokeStyle = "#ff0";
		this.foregroundCtx.beginPath();
		this.foregroundCtx.moveTo(0, this.toPosition(this.train.viewingDistance));
		this.foregroundCtx.lineTo(this.width, this.toPosition(data.train.viewingDistance));
		this.foregroundCtx.stroke();*/
		
		// breaking distances
		this.foregroundCtx.lineWidth = this.width;
		
		this.foregroundCtx.strokeStyle = "#6664";
		this.foregroundCtx.beginPath();
		this.foregroundCtx.moveTo(this.width / 2, this.toPosition(this.train.reactionDistance));
		this.foregroundCtx.lineTo(this.width / 2, this.toPosition(0));
		this.foregroundCtx.stroke();
		
		this.foregroundCtx.strokeStyle = "#0f04";
		this.foregroundCtx.beginPath();
		this.foregroundCtx.moveTo(this.width / 2, this.toPosition(this.train.reactionDistance));
		this.foregroundCtx.lineTo(this.width / 2, this.toPosition(this.train.reactionDistance + this.train.breakingDistance));
		this.foregroundCtx.stroke();
		
		this.foregroundCtx.font = `${this.width / 30}px Arial`;
		
		let optimal = this.train.currentOptimalSpeed;
		const nextUnreservedTurnout = this.train.getNextControllableTurnout(this.max);
		
		// segments
		for (let segment of segments) {
			if (segment instanceof Block) {
				this.foregroundCtx.lineWidth = 5;
				
				this.foregroundCtx.beginPath();
				this.foregroundCtx.moveTo(x, this.toPosition(distance));
				this.foregroundCtx.lineTo(x, this.toPosition(distance + segment.length));

				if (segment.reservedBy == this.train) {
					this.foregroundCtx.strokeStyle = this.foregroundCtx.fillStyle = "#0f0";
				} else {
					this.foregroundCtx.strokeStyle = this.foregroundCtx.fillStyle = "#fff";
				}

				this.foregroundCtx.stroke();

				distance += segment.length;
			} else if (segment instanceof Turnout) {
				let originX = x;
				
				this.foregroundCtx.lineWidth = 5;
				
				if (nextUnreservedTurnout == segment) {
					this.foregroundCtx.fillStyle = "#55f4";
					this.foregroundCtx.fillRect(0, this.toPosition(distance + segment.length), this.width, this.toPosition(distance) - this.toPosition(distance + segment.length));
					this.foregroundCtx.fillRect(this.width / 4, this.toPosition(distance), this.width / 2, this.toPosition(distance) - this.toPosition(distance + (this.train.currentMaxSpeed / 3.6) * segment.switchingTime));
				}
				
				this.foregroundCtx.fillStyle = "#fff";
				
				if (this.train.location.direction == segment.direction) {
					for (let side of [["left", -1], ["middle", 0], ["right", 1]]) {
						const sideName = side[0] as string;
						const sideDelta = side[1] as number;

						const direction = segment.endpoints.find(e => e.name == sideName);
						
						if (direction) {
							this.foregroundCtx.beginPath();
							this.foregroundCtx.moveTo(originX, this.toPosition(distance));
							this.foregroundCtx.lineTo(originX + this.width / 20 * sideDelta, this.toPosition(distance + segment.length));
							
							if (segment.switching) {
								this.foregroundCtx.strokeStyle = "#00f";
								
								if (segment.switching == sideName) {
									this.foregroundCtx.lineWidth = 4;
								} else {
									this.foregroundCtx.lineWidth = 2;
								}
							} else {
								if (segment.currentState == sideName) {
									if (segment.reservedBy == this.train) {
										this.foregroundCtx.strokeStyle = "#0f0";
									} else {
										this.foregroundCtx.strokeStyle = "#fff";
									}
								} else {
									this.foregroundCtx.strokeStyle = "#666";
								}
							}
							
							if (segment.eventualState == sideName) {
								x += this.width / 20 * sideDelta;
							}
							
							this.foregroundCtx.stroke();
						}
					}
				} else {
					for (let side of [["left", 1], ["middle", 0], ["right", -1]]) {
						const sideName = side[0] as string;
						const sideDelta = side[1] as number;

						const direction = segment.endpoints.find(e => e.name == sideName);
						
						if (direction) {
							if (segment.currentState == sideName) {
								originX -= this.width / 20 * sideDelta;
							}
							
							this.foregroundCtx.beginPath();
							this.foregroundCtx.moveTo(originX, this.toPosition(distance + segment.length));
							this.foregroundCtx.lineTo(originX + this.width / 20 * sideDelta, this.toPosition(distance));
							
							if (segment.switching) {
								this.foregroundCtx.strokeStyle = "#00f";
								
								if (segment.switching == sideName) {
									this.foregroundCtx.lineWidth = 4;
								} else {
									this.foregroundCtx.lineWidth = 2;
								}
							} else {
								if (segments.length && segments[segments.length - 1] == direction.segment) {
									this.foregroundCtx.strokeStyle = "#0f0";
								} else if (segment.currentState == sideName) {
									if (segment.reservedBy == this.train) {
										this.foregroundCtx.strokeStyle = "#0f0";
									} else {
										this.foregroundCtx.strokeStyle = "#fff";
									}

									x -= this.width / 20 * sideDelta;
								} else {
									this.foregroundCtx.strokeStyle = "#666";
								}
							}
							
							this.foregroundCtx.stroke();
						}
					}
				}
				
				distance += segment.length;
			} else if (segment instanceof Bumper) {
				this.foregroundCtx.fillStyle = "#fff";
				this.foregroundCtx.fillRect(x - this.width / 80, this.toPosition(distance) - this.width / 80, this.width / 40, this.width / 40);
			}
			
			this.foregroundCtx.lineWidth = 2;
			this.foregroundCtx.strokeStyle = "#fff";
				
			this.foregroundCtx.beginPath();
			this.foregroundCtx.moveTo(x - this.width / 40, this.toPosition(distance));
			this.foregroundCtx.lineTo(x + this.width / 40, this.toPosition(distance));
			this.foregroundCtx.stroke();
			
			/*// speed up and speed down indicators
			
			this.foregroundCtx.fillText(`${segment.id} ${optimal == segment.optimal ? "" : (optimal < segment.optimal ? `▲ ${segment.optimal}` : `▼ ${segment.optimal}`)}`, x + this.width / 40, this.toPosition(distance - segment.length));
			optimal = segment.optimal;*/
		}
		
		this.segmentLengthLabel.update(this.train.location.segment.length);
		this.segmentRemainderLabel.update(this.train.location.segment.length - this.train.location.distance);
		this.breakDistanceLabel.update(this.train.breakingDistance);
		this.safeBreakDistanceLabel.update(this.train.safeBreakingDistance);
		this.lookaheadSafeDistanceLabel.update(this.train.getSafeDistance(this.max));
		this.currentSegmentLabel.update(this.train.location.segment.id);
		
		if (this.lastMax != this.max) {
			this.updateBackground();
		}
		
		requestAnimationFrame(() => this.update());
	}
	
	updateBackground() {
		this.backgroundCtx.clearRect(0, 0, this.width, this.height);
		
		for (let step of this.steps) {
			const pos = this.toPosition(step);

			this.backgroundCtx.beginPath();
			this.backgroundCtx.moveTo(0, pos);
			this.backgroundCtx.lineTo(this.width, pos);
			this.backgroundCtx.stroke();

			this.backgroundCtx.fillText(step + "", this.width / 100, pos);
		}
		
		this.lastMax = this.max;
	}
}