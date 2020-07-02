import { Turnout, Segment } from "../shared/segment";

export class Bridge {
	static global: Bridge;
	
	clients: any[];

	constructor() {
		this.clients = [];
	}

	static addClient(client) {
		Bridge.global.clients.push(client);
	}

	static removeClient(client) {
		Bridge.global.clients.splice(Bridge.global.clients.indexOf(client), 1);
	}

	static broadcastAll(data) {
		for (let client of Bridge.global.clients) {
			client.send(JSON.stringify(data));
		}
	}

	static updateTurnout(turnout: Turnout) {
		Bridge.broadcastAll({
			turnout: turnout.toData()
		});
	}

	static updateReservation(segment: Segment) {
		Bridge.broadcastAll({
			reservation: {
				segmentId: segment.id,
				trainId: segment.reservedBy ? segment.reservedBy.id : null
			}
		});
	}
}