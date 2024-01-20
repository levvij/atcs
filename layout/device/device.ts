import { Socket } from "net";
import { Channel } from "./channel";
import { Message } from "../../shared/message-parser";

export class Device {
	channels: Channel[] = [];

	lastDiscovery: { date: Date, address: string };
	
	constructor(
		public identifier: string
	) {}

	handleConnection(socket: Socket) {
		console.log('connected', this.identifier)
		let buffer = Buffer.alloc(0);
		
		socket.on('data', data => {
			buffer = Buffer.concat([buffer, data]);

			let frame: { message: Message, nextStart: number };

			while (frame = Message.readFirst(buffer)) {
				console.log(frame.message.route, frame.message.headers, frame.message.body);

				buffer = buffer.subarray(frame.nextStart);
			}
		});
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