import { ManagedEvent } from "../shared/managed-event";

// Z21 DCC Implementation
// Based on official Z21 LAN Protocol Specification 1.09en
const dgram = require("dgram");
const client = dgram.createSocket("udp4");

export class DCC {
	client;
	serialNumber: string;

	ontrackpoweroff = new ManagedEvent("Track power off");
	ontrackpoweron = new ManagedEvent("Track power on");
	onprogrammingmode = new ManagedEvent("Track programming mode");
	onstop = new ManagedEvent("Locomotive emergency stop");
	onshortcircuit = new ManagedEvent("Track short circuit");

	mainTrackCurrent: number;
	programmingTrackCurrent: number;
	temperature: number;

	constructor() {
		const dcc = this;

		client.on("message", function (message, remote) {
			console.log(`UDP message received from: ${remote.address}:${remote.port}`, message);

			const packet = DCCPacket.fromData(message);
			console.log(packet);

			dcc.ondata(packet);
		});
	}

	start() {
		return new Promise(done => {
			// get serial number
			// this will initialzize the connection
			new DCCPacket(0x10).send();

			const serialNumberAwaiter = setInterval(() => {
				if (this.serialNumber) {
					clearInterval(serialNumberAwaiter);

					// enable events
					new DCCPacket(0x50, [
						...DCCPacket.toLittleEndian(0x00000001 | 0x00000002 | 0x00010000 | 0x00040000 | 0x00080000, 4)
					]).send();

					// gets system status every ten seconds
					// includes track current, base station temperature etc
					//// setInterval(() => {
					//// 	new DCCPacket(0x85).send();
					//// }, 10000);

					done();
				}
			}, 1);
		});
		
	}

	enableTrackPower() {
		new DCCPacket(0x40, [0x21, 0x80, 0xa1]).send();
	}

	disableTrackPower() {
		new DCCPacket(0x40, [0x21, 0x80, 0xa0]).send();
	}

	stop() {
		new DCCPacket(0x40, [0x80, 0x80]).send();
	}

	stopEXp() {
		new DCCPacket(0x40, [0x80, DCCPacket.XOR]).send();
	}

	emergencyStopLoco(loco: number) {
		this.rawSpeedControl(loco, false, 1);
	}

	setSpeed(loco: number, reversed: boolean, speed: number) {
		if (speed > 128) {
			throw new Error("Max speed step is 128");
		}

		if (speed < 0) {
			throw new Error("Min speed step is 0");
		}

		this.rawSpeedControl(loco, reversed, speed >= 1 ? Math.floor(speed / 128 * 126) + 2 : 0);
	}

	private rawSpeedControl(loco: number, reversed: boolean, speed: number) {
		console.log(`[dcc/speed-control] ${loco} to ${speed} (${reversed ? "F" : "R"})`);

		new DCCPacket(0x40, [
			0xe4,
			0x13,
			...this.toUDPLocoAddress(loco),
			(reversed ? 0b10000000 : 0) + speed,
			DCCPacket.XOR
		]).send();
	}

	private toUDPLocoAddress(loco: number) {
		return [0x00, loco];
	}

	ondata(packet: DCCPacket) {
		switch (packet.header) {
			case 0x10: {
				this.serialNumber = packet.data.map(x => x.toString(16).padStart(2, "0")).join("");
			}

			case 0x40: {
				switch (packet.data[0]) {
					case 0x61: {
						switch (packet.data[1]) {
							case 0x00: {
								this.ontrackpoweroff.emit();
							}
							
							case 0x01: {
								this.ontrackpoweron.emit();
							}

							case 0x02: {
								this.onprogrammingmode.emit();
							}

							case 0x08: {
								console.warn("Short circuit");

								this.onshortcircuit.emit();
							}

							case 0x82: {
								console.warn("Unknown command");
							}
						}
					}

					case 0x81: {
						this.onstop.emit();
					}
				}
			}

			case 0x84: {
				this.mainTrackCurrent = (packet.data[0] + packet.data[1] * 0xff) / 1000;
				this.programmingTrackCurrent = (packet.data[2] + packet.data[3] * 0xff) / 1000;
				this.temperature = packet.data[6] + packet.data[7] * 0xff;
			}
		}
	}
}

export class DCCPacket {
	constructor(
		public header: number, 
		public data: number[] = [],
		public group: number = 0, 
	) {}

	static XOR = -1234;

	static fromData(data: Uint8Array) {
		return new DCCPacket(
			data[2],
			[...data.slice(4)],
			data[3]
		);
	}

	get length() {
		return 4 + this.data.length;
	}

	send() {
		if (this.data[this.data.length - 1] == DCCPacket.XOR) {
			let v = this.data[0];

			for (let i = 1; i < this.data.length - 1; i++) {
				v = v ^ this.data[i];
			}

			this.data[this.data.length - 1] = v;
		}

		const buffer = new Buffer([
			this.length % 0xff,
			Math.floor(this.length / 0xff),
			this.header % 0xff,
			Math.floor(this.header / 0xff),
			...this.data
		]);

		console.log(`[z21] ${buffer.toString("hex").split("").map((c, i) => i % 2 ? c + " " : c).join("")}`);

		client.send(buffer, 0, buffer.length, 21106, "192.168.1.111", function(err, bytes) {
			if (err) {
				console.error(`UDP message send error:`, err);
			} else {
				console.log(`UDP message sent`);
			}
		});
	}

	static toLittleEndian(number, bytes) {
		const data = Array(bytes);
		const str = number.toString(16).padStart(bytes * 2, 0);

		for (let i = 0; i < bytes; i++) {
			data[bytes - i - 1] = str.substr(i * 2, 2);
		}

		return data.map(d => parseInt(d, 16));
	}
}