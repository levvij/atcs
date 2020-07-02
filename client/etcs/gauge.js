class Gauge {
	constructor(gauge) {
		const currentRange = data.speed.ranges.find(r => r.start <= data.speed.current.value && r.end > data.speed.current.value);
		
		const backgroundCanvas = document.createElement("canvas");
		const foregroundCanvas = document.createElement("canvas");

		const width = foregroundCanvas.width = backgroundCanvas.width = gauge.clientWidth;
		const height = foregroundCanvas.height = backgroundCanvas.height = gauge.clientHeight;

		gauge.appendChild(backgroundCanvas);
		gauge.appendChild(foregroundCanvas);
		
		const overspeedSound = new Audio("audio/overspeed.mp3");
		const speedChangeSound = new Audio("audio/speed-change.mp3");
		
		let lastSpeed;
		let lastMaxSpeed;

		const gaugeSize = Math.min(width, height);
		const gaugeWidth = gaugeSize / 8;
		const textPosition = gaugeSize / 4;
		const speedRingSize = gaugeSize / 40;
		const speedCircleSize = gaugeSize / 8;
		const accelSize = gaugeSize / 8;
		
		const font = "Arial";

		const backgroundCtx = backgroundCanvas.getContext("2d");
		const foregroundCtx = foregroundCanvas.getContext("2d");

		backgroundCtx.strokeStyle = "#fff";
		backgroundCtx.fillStyle = "#fff";

		foregroundCtx.textAlign = backgroundCtx.textAlign = "center";
		foregroundCtx.textBaseline = backgroundCtx.textBaseline = "middle";
		foregroundCtx.font = backgroundCtx.font = `${gaugeSize / 20}px ${font}`;

		const maxSpeed = Math.max(...data.speed.ranges.map(r => r.end));
		const totalFactor = data.speed.ranges.reduce((a, c) => {
			c.startFactor = a;
			c.endFactor = a + c.factor;
			c.range = c.end - c.start;

			return c.factor + a;
		}, 0);

		// speed lines
		let renderingRange = data.speed.ranges[0];

		for (let r = 1.75 * Math.PI; r >= 0.25 * Math.PI; r -= Math.PI / maxSpeed * 20 * renderingRange.factor) {
			const factor = (1.5 - (1 / Math.PI * r - 0.25)) / 1.5 * totalFactor;
			renderingRange = data.speed.ranges.find(r => r.startFactor <= factor && r.endFactor > factor) || data.speed.ranges[data.speed.ranges.length - 1];

			const currentSpeed = Math.round((factor - renderingRange.startFactor) / renderingRange.factor * (renderingRange.end - renderingRange.start) + renderingRange.start);
			
			// speed labels
			if (data.speed.ranges.find(r => r.labels.includes(currentSpeed))) {
				backgroundCtx.fillText(currentSpeed, Math.sin(r) * (gaugeSize - textPosition) / 2 + width / 2, Math.cos(r) * (gaugeSize - textPosition) / 2 + height / 2);

				backgroundCtx.lineWidth = 3;
			} else {
				backgroundCtx.lineWidth = 2;
			}

			backgroundCtx.beginPath();
			backgroundCtx.moveTo(Math.sin(r) * (gaugeSize - gaugeWidth) / 2 + width / 2, Math.cos(r) * (gaugeSize - gaugeWidth) / 2 + height / 2);
			backgroundCtx.lineTo(Math.sin(r) * gaugeSize / 2 + width / 2, Math.cos(r) * gaugeSize / 2 + height / 2);
			backgroundCtx.stroke();
		}

		function toArc(speed) {
			const range = data.speed.ranges.find(r => r.start <= speed && r.end > speed) || data.speed.ranges[data.speed.ranges.length - 1];

			return (
				((range.startFactor + (speed - range.start) / range.range * range.factor) / totalFactor) * 1.5 + 0.75
			) * Math.PI;
		}

		const update = () => {
			foregroundCtx.clearRect(0, 0, width, height);
			
			if (lastMaxSpeed != data.speed.current.max) {
				speedChangeSound.play();
				
				lastMaxSpeed = data.speed.current.max;
			}

			// max speed circle
			foregroundCtx.lineWidth = speedRingSize;

			foregroundCtx.fillStyle = foregroundCtx.strokeStyle = "#666";
			foregroundCtx.beginPath();
			foregroundCtx.arc(width / 2, height / 2, gaugeSize / 2 - speedRingSize / 2, 0.75 * Math.PI, toArc(data.speed.current.optimal));
			foregroundCtx.stroke();
			
			foregroundCtx.fillStyle = foregroundCtx.strokeStyle = "#fff";
			foregroundCtx.beginPath();
			foregroundCtx.arc(width / 2, height / 2, gaugeSize / 2 - speedRingSize, toArc(data.speed.current.optimal - data.speed.current.optimalRange), toArc(data.speed.current.optimal));
			foregroundCtx.stroke();

			// slow down / speed up circle
			if (data.speed.current.value > data.speed.current.optimal) {
				foregroundCtx.fillStyle = foregroundCtx.strokeStyle = "#ff0";
				foregroundCtx.beginPath();
				foregroundCtx.arc(width / 2, height / 2, gaugeSize / 2 - speedRingSize / 2, toArc(data.speed.current.optimal), toArc(data.speed.current.max));
				foregroundCtx.stroke();
			} 

			if (data.speed.current.value <= data.speed.current.optimal) {
				foregroundCtx.fillStyle = foregroundCtx.strokeStyle = "#fff";
				foregroundCtx.beginPath();
				foregroundCtx.arc(width / 2, height / 2, gaugeSize / 2 - speedRingSize / 2, toArc(data.speed.current.value), toArc(data.speed.current.max));
				foregroundCtx.stroke();
			}

			if (data.speed.current.value > data.speed.current.max) {
				foregroundCtx.fillStyle = foregroundCtx.strokeStyle = "#f00";
				foregroundCtx.beginPath();
				foregroundCtx.arc(width / 2, height / 2, gaugeSize / 2 - speedRingSize / 2, toArc(data.speed.current.max), toArc(data.speed.current.value));
				foregroundCtx.stroke();
			}

			// max speed line
			foregroundCtx.lineWidth = 8;
			let r = Math.PI * 0.5 - toArc(Math.max(data.speed.current.value, data.speed.current.max));

			foregroundCtx.beginPath();
			foregroundCtx.moveTo(Math.sin(r) * (gaugeSize - gaugeWidth) / 2 + width / 2, Math.cos(r) * (gaugeSize - gaugeWidth) / 2 + height / 2);
			foregroundCtx.lineTo(Math.sin(r) * gaugeSize / 2 + width / 2, Math.cos(r) * gaugeSize / 2 + height / 2);
			foregroundCtx.stroke();

			// speed circle in the middle of the gauge
			foregroundCtx.beginPath();
			foregroundCtx.arc(width / 2, height / 2, speedCircleSize, 0, 2 * Math.PI);
			foregroundCtx.fill();

			// current speed line
			foregroundCtx.lineWidth = 8;
			r = Math.PI * 0.5 - toArc(data.speed.current.value);

			foregroundCtx.beginPath();
			foregroundCtx.moveTo(Math.sin(r) * (gaugeSize - gaugeWidth) / 2 + width / 2, Math.cos(r) * (gaugeSize - gaugeWidth) / 2 + height / 2);
			foregroundCtx.lineTo(width / 2, height / 2);
			foregroundCtx.stroke();

			foregroundCtx.lineWidth *= 2;

			foregroundCtx.beginPath();
			foregroundCtx.moveTo(Math.sin(r) * gaugeSize / 4 + width / 2, Math.cos(r) * gaugeSize / 4 + height / 2);
			foregroundCtx.lineTo(width / 2, height / 2);
			foregroundCtx.stroke();

			// speed label
			foregroundCtx.font = `${gaugeSize / 10}px ${font}`;
			foregroundCtx.fillStyle = "#000";
			foregroundCtx.fillText(Math.round(data.speed.current.value), width / 2, height / 2);
			
			// acceleration
			foregroundCtx.strokeStyle = "#fff";
			foregroundCtx.lineWidth = 2;
			
			foregroundCtx.beginPath();
			foregroundCtx.moveTo(width / 2, height);
			foregroundCtx.lineTo(width / 2, height - accelSize);
			foregroundCtx.stroke();
			
			foregroundCtx.lineWidth = accelSize / 2;
			foregroundCtx.beginPath();
			foregroundCtx.moveTo(width / 2, height - accelSize / 2);
			
			if (data.speed.current.acceleration > 0) {
				foregroundCtx.lineTo(width / 2 + width / 2 / data.acceleration.max * data.speed.current.acceleration, height - accelSize / 2);
			} else {
				foregroundCtx.lineTo(width / 2 + width / 2 / -data.acceleration.min * data.speed.current.acceleration, height - accelSize / 2);
			}
			
			foregroundCtx.stroke();
			
			requestAnimationFrame(update);
		};

		update();
	}
}