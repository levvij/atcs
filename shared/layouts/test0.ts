import { Layout } from "../layout";

import { Block, Turnout } from "../segment";

import { Train, Locomotive, RollingStockIdentificationTag, PositiveRollingStockMagnet, NegativeRollingStockMagnet, Wagon } from "../train";

export const test0 = new Layout();
test0.segments = [
	new Block("a.a", 60.2 * 0.87, { max: 30, optimal: 20 }, [], undefined, "a.m")
		.atHeight(5),

	new Block("a.m", 71.3 * 0.87, { max: 50, optimal: 40 }, [], "a.a", "t1")
		.decline(5)
		.curveLeft(45),
	
	new Turnout("t1", 43.3 / 2 * 0.87, { max: 80, optimal: 60 }, 20, 3, false, {
		middle: "m.sw",
		left: "a.a",
		common: "m.se",
		default: "middle"
	}),

	new Block("m.se", 103.1 * 0.87, { max: 80, optimal: 60 }, [], "t1", "m.ne")
		.curveLeft(90),

	new Block("m.ne", 82.5 * 0.87, { max: 80, optimal: 60 }, [], "m.se", "m.n")
		.curveLeft(90),

	new Block("m.n", 47.8 * 0.87, { max: 80, optimal: 60 }, [], "m.ne", "m.nw"),

	new Block("m.nw", 79.2 * 0.87, { max: 80, optimal: 60 }, [], "m.n", "m.sw")
		.curveLeft(90),

	new Block("m.sw", 82.5 * 0.87, { max: 80, optimal: 60 }, [], "m.nw", "t1")
		.curveLeft(90)
];

test0.trains = [
	// Re 420
	new Train(34, [
		new Locomotive({
			address: 3,
			maxSpeed: 140
		}, "Re 460.1.23", 18.5 * 0.87, [
			new RollingStockIdentificationTag(18.5 / 2, 13144234),
			new PositiveRollingStockMagnet(3), 
			new NegativeRollingStockMagnet(15.5)
		]),
	]).placeOn(test0.segments.find(s => s.id == "a.a"))
];

test0.trains[0].maxSpeed = 140;
test0.trains[0].maxAcceleration = 15;
test0.trains[0].minAcceleration = -25;
test0.trains[0].reactionDistance = 0;
test0.trains[0].location.direction = true;