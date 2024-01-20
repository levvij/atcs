import { Socket } from "net";
import { Channel } from "./channel";
import { Message } from "../../shared/message-parser";
import { Layout } from "..";
import { PointPositioner } from "../positioner/point";
import { SectionPosition } from "../../shared/postion";
import { Train } from "../../train";
import { MeasuredPosition } from "../../train/measured-location";

export class Device {
	channels: Channel[] = [];

	lastDiscovery: { date: Date, address: string };
	
	constructor(
		public identifier: string
	) {}

	handleConnection(socket: Socket, positioners: PointPositioner[], train: Train) {
		console.log('connected', this.identifier)
		let buffer = Buffer.alloc(0);
		
		socket.on('data', data => {
			buffer = Buffer.concat([buffer, data]);

			let frame: { message: Message, nextStart: number };

			while (frame = Message.readFirst(buffer)) {
				this.handleMessage(frame.message, positioners, train);

				console.log(frame.message.route, frame.message.headers, frame.message.body);

				buffer = buffer.subarray(frame.nextStart);
			}
		});
	}

	handleMessage(message: Message, positioners: PointPositioner[], train: Train) {
		if (message.route[0] == 'detect') {
			if (message.route[1] == 'start') {
				const positioner = positioners.find(positioner => positioner.channel.name == message.headers.channel);

				if (!positioner) {
					throw new Error(`Channel '${message.headers.channel}' not found`);
				}

				train.lastPositioner = MeasuredPosition.fromPointPositionReading(positioner, train);
			}
		}
	}

	dump() {
		console.group(`Device ${this.identifier}`);

		if (this.lastDiscovery) {
			console.log(`last discovery: ${this.lastDiscovery.date.toISOString()} ${this.lastDiscovery.address}`);
		}

		console.group('channels');

		for (let channel of this.channels) {
			channel.dump();
		}

		console.groupEnd();
		console.groupEnd();
	}
}