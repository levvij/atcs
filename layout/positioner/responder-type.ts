export class ResponderType {
	constructor(
		public name: string
	) {}

	dump() {
		console.log(`Responder Type '${this.name}'`);
	}
}