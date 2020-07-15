export class ManagedEvent<TData = void> {
	private subscribers: ((data: TData) => any)[];

	last: {
		time: Date,
		value: TData;
	}
	
	constructor(public name: string) {
		this.subscribers = [];
	}

	subscribe(listener: ((data: TData) => any)) {
		this.subscribers.push(listener);
	}

	emit(data?: TData) {
		console.log(`[event/${this.name}]`, data);

		for (let sub of this.subscribers) {
			sub(data);
		}

		this.last = {
			time: new Date(),
			value: data
		};
	}

	
}