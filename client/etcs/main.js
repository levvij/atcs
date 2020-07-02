const data = {
	viewingDistance: {
		max: 500,
		lookahead: 1000
	},
	speed: {
		current: {
			value: 0,
			optimal: 20,
			max: 40,
			acceleration: 0,
			optimalRange: 5
		},
		ranges: [
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
		]
	},
	acceleration: {
		step: 0.5,
		max: 15,
		min: -25
	},
	lookahead: {
		max: 1000,
		steps: [50, 100, 250, 500, 1000, 1500, 2000, 4000]
	},
	turnouts: {
		t1: {
			length: 50,
			common: "b1",
			left: "b2",
			middle: "b3",
			current: "middle",
			direction: true,
			optimal: 20,
			max: 30,
			switchingTime: 3
		},
		t2: {
			length: 50,
			common: "b5",
			right: "t7",
			middle: "b4",
			current: "middle",
			direction: false,
			optimal: 60,
			max: 90,
			switchingTime: 3
		},
		t3: {
			length: 50,
			common: "b5",
			left: "b9",
			right: "t4",
			current: "left",
			direction: true,
			optimal: 60,
			max: 90,
			switchingTime: 3
		},
		t4: {
			length: 30,
			common: "t5",
			right: "t3",
			middle: "b8",
			current: "middle",
			direction: false,
			optimal: 20,
			max: 30,
			switchingTime: 3
		},
		t5: {
			length: 30,
			common: "t4",
			right: "b6",
			middle: "b7",
			current: "middle",
			direction: true,
			optimal: 20,
			max: 30,
			switchingTime: 3
		},
		t6: {
			length: 50,
			common: "b10",
			left: "b11",
			middle: "b15",
			current: "middle",
			direction: true,
			optimal: 80,
			max: 120,
			switchingTime: 3
		},
		t7: {
			length: 80,
			common: "t2",
			right: "b14",
			middle: "b23",
			current: "middle",
			direction: false,
			optimal: 80,
			max: 120,
			switchingTime: 3
		},
		t8: {
			length: 50,
			common: "b15",
			middle: "b16",
			left: "b17",
			current: "middle",
			direction: true,
			optimal: 100,
			max: 150,
			switchingTime: 3
		}
	},
	blocks: {
		b1: {max: 30, length: 400, end: "t1", optimal: 20, sensors: [
			new PositiveMagnetReader(50),
			new PositiveMagnetReader(100),
			new NegativeMagnetReader(120),
			new BiMagnetReader(200)
		]},
		b2: {max: 30, length: 400, start: "t1", optimal: 20},
		b3: {max: 90, length: 200, start: "t1", end: "b4", optimal: 60},
		b4: {max: 90, length: 200, start: "b3", end: "t2", optimal: 60},
		b5: {max: 90, length: 200, start: "t2", end: "t3", optimal: 60},
		b6: {max: 30, length: 200, start: "t5", optimal: 20},
		b7: {max: 30, length: 200, start: "t5", optimal: 20},
		b8: {max: 30, length: 400, end: "t4", optimal: 20},
		b9: {curved: "left", max: 120, length: 200, start: "t3", end: "b10", optimal: 80},
		b10: {max: 120, length: 200, start: "b9", end: "t6", optimal: 80},
		b11: {curved: "left", max: 180, length: 200, start: "t6", end: "b12", optimal: 120},
		b12: {max: 180, length: 200, start: "b11", end: "b13", optimal: 120},
		b13: {curved: "left", max: 180, length: 200, start: "b12", end: "b14", optimal: 120},
		b14: {max: 120, length: 200, start: "b13", end: "t7", optimal: 80},
		b15: {max: 120, length: 200, start: "t6", end: "t8", optimal: 80},
		b16: {max: 30, length: 400, start: "t8", optimal: 20},
		b17: {curved: "left", max: 180, length: 200, start: "t8", end: "b18", optimal: 120},
		b18: {max: 240, length: 200, start: "b17", end: "b19", optimal: 160},
		b19: {max: 240, length: 200, start: "b19", end: "b20", optimal: 160},
		b20: {curved: "left", max: 240, length: 200, start: "b19", end: "b21", optimal: 160},
		b21: {max: 240, length: 200, start: "b20", end: "b22", optimal: 160},
		b22: {max: 180, length: 200, start: "b21", end: "b23", optimal: 120},
		b23: {curved: "left", max: 120, length: 200, start: "b22", end: "t7", optimal: 80}
	}
};

onload = () => {
	for (let id in data.turnouts) {
		const turnout = data.turnouts[id];
		turnout.id = id;
		
		turnout.switch = () => {
			const direction = turnout.proposedState;
			
			if (!direction) {
				return;
			}
			
			if (turnout.switching && turnout.switching != direction) {
				throw new Error("Switch already switching");
			}
			
			turnout.switching = direction;
			
			setTimeout(() => {
				turnout.switching = null;
				turnout.proposedState = null;
				
				turnout.current = direction;
			}, turnout.switchingTime * 1000);
		};
		
		Object.defineProperty(turnout, "eventualState", {
			get() {
				return turnout.switching || turnout.proposedState || turnout.current;
			}
		})
		
		for (let endpoint of ["middle", "left", "right", "common"]) {
			if (endpoint in turnout) {
				if (turnout[endpoint] in data.turnouts) {
					turnout[endpoint] = { 
						id: turnout[endpoint],
						turnout: data.turnouts[turnout[endpoint]]
					};
					
					turnout[endpoint].max = turnout[endpoint].turnout.max;
					turnout[endpoint].optimal = turnout[endpoint].turnout.optimal;
					turnout[endpoint].length = turnout[endpoint].turnout.length;
				} else if (turnout[endpoint] in data.blocks) {
					turnout[endpoint] = { 
						id: turnout[endpoint],
						block: data.blocks[turnout[endpoint]]
					};
					
					turnout[endpoint].max = turnout[endpoint].block.max;
					turnout[endpoint].optimal = turnout[endpoint].block.optimal;
					turnout[endpoint].length = turnout[endpoint].block.length;
				} else {
					throw new Error(`Invalid id '${endpoint}' / '${id}'`);
				}
			}
		}
	}
	
	for (let id in data.blocks) {
		const block = data.blocks[id];
		block.id = id;
		
		for (let endpoint of ["start", "end"]) {
			if (endpoint in block) {
				if (block[endpoint] in data.turnouts) {
					block[endpoint] = {
						id: block[endpoint],
						turnout: data.turnouts[block[endpoint]] 
					};
					
					block[endpoint].max = block[endpoint].turnout.max;
					block[endpoint].optimal = block[endpoint].turnout.optimal;
					block[endpoint].length = block[endpoint].turnout.length;
				} else if (block[endpoint] in data.blocks) {
					block[endpoint] = { 
						id: block[endpoint],
						block: data.blocks[block[endpoint]] 
					};
					
					block[endpoint].max = block[endpoint].block.max;
					block[endpoint].optimal = block[endpoint].block.optimal;
					block[endpoint].length = block[endpoint].block.length;
				} else {
					throw new Error(`Invalid id '${endpoint}' / '${id}'`);
				}
			} else {
				block[endpoint] = {
					bumper: {
						id: `e_${id}_${endpoint}`,
						ends: block,
						length: 0
					},
					id: `e_${id}_${endpoint}`,
					max: 0,
					length: 0,
					optimal: 0
				}
			}
		}
	}
	
	data.train = new Train(data.turnouts.t1.common, 0, true, [
		new Locomotive(412, "Re 460.1.23", 18.5, [
			new RollingStockIdentificationTag(18.5 / 2, 13144234),
			new PositiveRollingStockMagnet(3), 
			new NegativeRollingStockMagnet(15.5)
		]),
		...Array(10).fill(0).map((a, i) => new Wagon(`GATX Zans 7838 682-${i}`, 16.1, i % 2 == i % 3 ? [
			new PositiveRollingStockMagnet(3.5), 
			new NegativeRollingStockMagnet(12.6)
		] : [
			new NegativeRollingStockMagnet(3.5), 
			new PositiveRollingStockMagnet(12.6)
		]))
	]);

	data.blocks.b1.reservedBy = data.train;
	data.longestTurnoutSwitchingTime = Math.max(...Object.keys(data.turnouts).map(k => data.turnouts[k].switchingTime));
	data.train.location.distance = data.train.length + 1;
	
	let distance = data.train.length;
	
	for (let car of data.train.cars) {
		car.location.segment = data.train.location.segment;
		car.location.distance = distance;
		
		distance -= car.length;
	}
	
	new Simulator();
	new Controls();
	
	new Gauge(document.querySelector("etcs-speed-gauge"));
	new LookAhead(document.querySelector("etcs-look-ahead"));
	new TrainView(document.querySelector("etcs-train-view"), data.train);
};