import { Bridge } from "./bridge";
import { Turnout } from "../shared/segment";
import { Simulator } from "../shared/simulator";
import { DCC } from "./dcc";
import { Locomotive } from "../shared/train";
import { test0 } from "../shared/layouts/test0";

import "../shared/polyfills";

const express = require("express");
const ws = require("express-ws");
const fs = require("fs");

const dcc = new DCC();

if (!process.argv.includes("--no-dcc")) {
	dcc.start();
}

const app = express();
ws(app);

Bridge.global = new Bridge();

const layout = test0;
layout.resolveConnections();

for (let train of layout.trains) {
	const simulator = new Simulator(layout, train);
	let lastUpdatedSpeed = 0;

	setInterval(() => {
		if (Math.abs(train.speed - lastUpdatedSpeed) > 1) {
			for (let locomotive of train.cars) {
				if (locomotive instanceof Locomotive) {
					dcc.setSpeed(
						locomotive.dccInfo.address, 
						train.location.direction, 
						Math.min(train.speed / locomotive.dccInfo.maxSpeed * 128, 128)
					);
				}
			}
			

			lastUpdatedSpeed = train.speed;
		}
	}, 100);

	simulator.onblockreserve.subscribe(block => {
		block.reservedBy = train;

		Bridge.updateReservation(block);
	});

	simulator.ontournoutreserve.subscribe(turnout => {
		turnout.reservedBy = train;

		if (train.location.direction == turnout.direction) {
			turnout.switchToProposedDirection();
		}

		Bridge.updateReservation(turnout);
	});
}

for (let segment of layout.segments) {
	if (segment instanceof Turnout) {
		if (!segment.eventualEndpoint) {
			segment.proposedState = segment.defaultState;

			Bridge.updateTurnout(segment);

			segment.switchToProposedDirection().then(() => {
				console.log("[setup] turnout switched");

				Bridge.updateTurnout(segment as Turnout);
			});
		}
	}
}

(process as any).layout = layout;

app.ws("/train-control", ws => {
	Bridge.addClient(ws);

	ws.onopen = () => {
		console.log("[ws] new client connected");
	};

	ws.onclose = () => {
		Bridge.removeClient(ws);
	};

	ws.onmessage = message => {
		const data = JSON.parse(message.data);

		function respond(response) {
			response.$$id = data.$$id;

			ws.send(JSON.stringify(response));
		}

		if (data.ping) {
			respond({});
		}

		if (data.trainInfo) {
			const train = layout.trains.find(t => t.id == data.trainInfo);

			respond(train.toData());
		}

		if (data.turnoutInfo) {
			const turnout = layout.segments.find(t => t.id == data.turnoutInfo) as Turnout;

			respond({
				turnout: turnout.toData()
			});
		}

		if ("acceleration" in data) {
			const train = layout.trains.find(t => t.id == data.trainId);

			train.acceleration = data.acceleration;

			respond({});
		}
	};
});

app.use("/", (req, res, next) => {
	const path = `${__dirname}/../../../client/dist/${req.path}.js`;

	if (fs.existsSync(path)) {
		res.type(".js");
		res.end(fs.readFileSync(path));
	} else {
		next();
	}
});

app.use("/assets", express.static(__dirname + "/../../../client/assets"));
app.use("*", express.static(__dirname + "/../../../client/index.html"));

app.listen(1199, () => {
	console.log("[web] server started on 1199");
});