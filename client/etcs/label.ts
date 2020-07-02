export class Label {
	elements: HTMLElement[];

	constructor(name: string) {
		this.elements = Array.from(document.querySelectorAll(`[data='${name}']`));
	}

	update(value) {
		for (let element of this.elements) {
			element.textContent = value + "";
		}
	}
}