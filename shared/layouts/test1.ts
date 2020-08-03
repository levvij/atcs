import { Layout } from "../layout";
import { Block, Turnout } from "../segment";
import { PositiveMagnetReader, NegativeMagnetReader, BiMagnetReader } from "../sensor";
import { Train, Locomotive, RollingStockIdentificationTag, PositiveRollingStockMagnet, NegativeRollingStockMagnet, Wagon } from "../train";

export const test1 = new Layout();
test1.segments = [
	new Block("b1", 400, { 
		max: 30, 
		optimal: 20 
	}, [
		new PositiveMagnetReader(50),
		new PositiveMagnetReader(100),
		new NegativeMagnetReader(120),
		new BiMagnetReader(200)
	], undefined, "t1"),
	
	new Block("b2", 400, { 
		max: 30,
		optimal: 20
	}, [], "t1", undefined),
	
	new Block("b3", 200, { 
		max: 90,
		optimal: 60
	}, [], "t1", "b4"),
	
	new Block("b4", 200, { 
		max: 90,
		optimal: 60
	}, [], "b3", "t2"),
	
	new Block("b5", 200, { 
		max: 90,
		optimal: 60
	}, [], "t2", "t3"),
	
	new Block("b6", 200, { 
		max: 30,
		optimal: 20
	}, [], "t5", undefined),
	
	new Block("b7", 200, { 
		max: 30,
		optimal: 20
	}, [], "t5", undefined),
	
	new Block("b8", 400, { 
		max: 30,
		optimal: 20
	}, [], undefined, "t4"),
	
	new Block("b9", 200, { 
		max: 120,
		optimal: 80
	}, [], "t3", "b10"),
	
	new Block("b10", 200, { 
		max: 120,
		optimal: 80
	}, [], "b9", "t6"),
	
	new Block("b11", 200, { 
		max: 180,
		optimal: 120
	}, [], "t6", "b12"),
	
	new Block("b12", 200, { 
		max: 180,
		optimal: 120
	}, [], "b11", "b13"),
	
	new Block("b13", 200, { 
		max: 180,
		optimal: 120
	}, [], "b12", "b14"),
	
	new Block("b14", 200, { 
		max: 120,
		optimal: 80
	}, [], "b13", "t7"),
	
	new Block("b15", 200, { 
		max: 120,
		optimal: 80
	}, [], "t6", "t8"),
	
	new Block("b16.1", 400, { 
		max: 120,
		optimal: 80
	}, [], "t8", "b16.2"),

	new Block("b16.2", 300, { 
		max: 90,
		optimal: 60
	}, [], "b16.1", "b16.3"),

	new Block("b16.3", 200, { 
		max: 60,
		optimal:40
	}, [], "b16.2", "b16.4"),

	new Block("b16.4", 400, { 
		max: 30,
		optimal: 20
	}, [], "b16.3"),

	new Block("b17", 200, { 
		max: 180,
		optimal: 120
	}, [], "t8", "b18"),

	new Block("b18", 200, { 
		max: 240,
		optimal: 160
	}, [], "b17", "b19"),

	new Block("b19", 200, { 
		max: 240,
		optimal: 160
	}, [], "b19", "b20"),

	new Block("b20", 200, { 
		max: 240,
		optimal: 160
	}, [], "b19", "b21"),

	new Block("b21", 200, { 
		max: 240,
		optimal: 160
	}, [], "b20", "b22"),

	new Block("b22", 200, { 
		max: 180,
		optimal: 120
	}, [], "b21", "b23"),

	new Block("b23", 200, { 
		max: 120,
		optimal: 80
	}, [], "b22", "t7"),

	new Turnout("t1", 25, {
		max: 30,
		optimal: 20
	}, 20, 3, true, {
		"left": "b2",
		"middle": "b3",
		"common": "b1",
		default: "middle"
	}),

	new Turnout("t2", 50, {
		max: 90,
		optimal: 60
	}, 10, 3, false, {
		"right": "t7",
		"middle": "b4",
		"common": "b5",
		default: "right"
	}),

	new Turnout("t3", 50, {
		max: 90,
		optimal: 60
	}, 10, 3, true, {
		"left": "b9",
		"right": "t4",
		"common": "b5",
		default: "left"
	}),

	new Turnout("t4", 30, {
		max: 30,
		optimal: 20
	}, 10, 3, false, {
		"right": "t3",
		"middle": "b8",
		"common": "t5",
		default: "right"
	}),

	new Turnout("t5", 30, {
		max: 30,
		optimal: 20
	}, 10, 3, true, {
		"right": "b6",
		"middle": "b7",
		"common": "t4",
		default: "middle"
	}),

	new Turnout("t6", 150, {
		max: 120,
		optimal: 80
	}, 40, 3, true, {
		"left": "b11",
		"middle": "b15",
		"common": "b10",
		default: "middle"
	}),

	new Turnout("t7", 80, {
		max: 120,
		optimal: 80
	}, 10, 3, false, {
		"right": "b14",
		"middle": "b23",
		"common": "t2",
		default: "middle"
	}),

	new Turnout("t8", 50, {
		max: 150,
		optimal: 100
	}, 10, 3, true, {
		"left": "b17",
		"middle": "b16.1",
		"common": "b15",
		default: "middle"
	})
];

test1.trains = [
	new Train(34, [
		new Locomotive({
			address: 3,
			maxSpeed: 140
		}, "Re 460.1.23", 18.5, [
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
	]).placeOn(test1.segments.find(s => s.id == "b1"))
];

test1.trains[0].maxSpeed = 140;
test1.trains[0].maxAcceleration = 15;
test1.trains[0].minAcceleration = -25;
test1.trains[0].reactionDistance = 0;
test1.trains[0].location.direction = true;