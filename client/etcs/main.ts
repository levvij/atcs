import { Bridge } from "./bridge";
import { Simulator } from "../../shared/simulator";
import { LookAhead } from "./look-ahead";
import { Controls } from "./controls";
import { Turnout } from "../../shared/segment";
import { Gauge } from "./gauge";
import { TrainView } from "./train-view";
import { test0 } from "../../shared/layouts/test0";

window.onload = async () => {
	const layout = test0;
	layout.resolveConnections();
	layout.trains = [];

	const bridge = new Bridge(layout);
	await bridge.open();

	for (let segment of layout.segments) {
		if (segment instanceof Turnout) {
			await Bridge.updateTurnout(segment);
		}
	}

	const trainId = location.pathname.split("/")[2];
	const train = await Bridge.getTrain(+trainId);

	layout.trains.push(train);

	const simulator = new Simulator(layout, train);
	const lookAhead = new LookAhead(document.querySelector("etcs-look-ahead"), train);
	const controls = new Controls(train, lookAhead);
	const gauge = new Gauge(document.querySelector("etcs-speed-gauge"), train);
	const trainView = new TrainView(document.querySelector("etcs-train-view"), train);

	(window as any).layout = layout;
	(window as any).train = train;
};