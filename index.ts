import { readFileSync, writeFileSync } from "fs";
import { Discovery } from "./discovery";
import { AddressInfo, createServer } from "net";
import { RootController } from "./controllers";
import { Layout } from "./layout";
import { CommandParser } from "./parser";
import { Train } from "./train";
import { SectionPosition } from "./shared/postion";
import { PointPositioner } from "./layout/positioner/point";

process.stdout.write(`ACTS ${JSON.parse(readFileSync('package.json').toString()).version}\n`);

const layout = new Layout(process.env.LAYOUT_FILE_LOCATION);
layout.load();
layout.dump();

// listen for devices on the network
Discovery.acceptConnections(layout.devices);

createServer({
	noDelay: true
}, socket => {
	socket.setTimeout(2500);
	socket.setKeepAlive(true, 2500);

	const address = socket.remoteAddress.split(':').pop();
	const device = layout.devices.find(device => device.lastDiscovery?.address == address);

	const positioners: PointPositioner[] = [];

	for (let district of layout.allDistricts) {
		for (let section of district.sections) {
			for (let track of section.tracks) {
				for (let positioner of track.positioners) {
					if (positioner instanceof PointPositioner) {
						if (positioner.channel.device == device) {
							positioners.push(positioner);
						}
					}
				}
			}
		}
	}

	device.handleConnection(socket, positioners, train);
}).listen(141);

const train = new Train();
train.reversed = false;
train.maximalAcceleration = 5;
train.speed = 10;
train.length = 23;

setInterval(() => {
	const head = train.head;

	if (head) {
		console.log(head.toString());

		writeFileSync('layout.svg', layout.toSVG(train.toSVG()));
	} else {
		console.log('< no position known >');
	}
}, 100);