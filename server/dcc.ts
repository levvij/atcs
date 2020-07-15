import { ManagedEvent } from "../shared/managed-event";

// Z21 DCC Implementation
// Based on official Z21 LAN Protocol Specification 1.09en
export class DCC {
	serialNumber: string;

	ontrackpoweroff = new ManagedEvent("Track power off");
	ontrackpoweron = new ManagedEvent("Track power on");
	onprogrammingmode = new ManagedEvent("Track programming mode");
	onstop = new ManagedEvent("Locomotive emergency stop");
	onshortcircuit = new ManagedEvent("Track short circuit");

	mainTrackCurrent: number;
	programmingTrackCurrent: number;
	temperature: number;

	constructor() {}

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
					setInterval(() => {
						new DCCPacket(0x85).send();
					}, 10000);

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

	get length() {
		return 4 + this.data.length;
	}

	send() {
		console.log(`Z21:${this.length.toString(16).padStart(4, "0")}:${this.header.toString(16).padStart(2, "0")}${this.group.toString(16).padStart(2, "0")}:${this.data.map(e => e.toString(16).padStart(2, "0")).join("-")}`);
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