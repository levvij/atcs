import { Train } from "../../shared/train";
import { Layout } from "../../shared/layout";
import { Turnout } from "../../shared/segment";

export class Bridge {
	static global: Bridge;

	connection: WebSocket;
	queue: {[k: string]: Function};
	responseTime: number;

	constructor(
		public layout: Layout
	) {
		this.queue = {};

		Bridge.global = this;
	}

	async open() {
		return new Promise(done => {
			this.connection = new WebSocket(`ws://${location.host}/train-control`);

			this.connection.onopen = () => {
				this.connection.onmessage = msg => {
					const data = JSON.parse(msg.data);
		
					if (this.queue[data.$$id]) {
						this.queue[data.$$id](data);
					}

					if ("turnout" in data) {
						const turnout = this.layout.segments.find(s => s.id == data.turnout.id) as Turnout;
						turnout.proposedState = data.turnout.proposedState;
						turnout.currentState = data.turnout.currentState;
					}

					if ("reservation" in data) {
						const segment = this.layout.segments.find(s => s.id == data.reservation.segmentId);
						const train = this.layout.trains.find(t => t.id == data.reservation.trainId);

						segment.reservedBy = train;

						console.log(`[Reservation] segment '${segment.id}' ${train ? `reserved by'${train.id}'` : "freed"}`);
					}
				}

				setInterval(() => {
					const start = new Date();
		
					this.request({
						ping: true
					}).then(() => {
						this.responseTime = +new Date() - +start;
					});
				}, 5000);

				done();
			};
		});
	}

	request(data, estimatedDelivery?) {
		return new Promise<any>((done) => {
			data.$$id = Math.random().toString(16).substr(2);
			this.queue[data.$$id] = done;

			this.connection.send(JSON.stringify(data));

			if (estimatedDelivery) {
				setTimeout(() => estimatedDelivery(data), this.responseTime / 2);
			}
		});
	}

	static async getTrain(id: number) {
		return Bridge.global.request({
			trainInfo: id
		}).then(data => Train.fromData(data, Bridge.global.layout));
	}

	static async updateAcceleration(train: Train, acceleration: number) {
		return Bridge.global.request({
			trainId: train.id,
			acceleration
		}, () => {
			train.acceleration = acceleration;
		});
	}

	static async updateTurnout(turnout: Turnout) {
		return Bridge.global.request({
			turnoutInfo: turnout.id
		});
	}
}