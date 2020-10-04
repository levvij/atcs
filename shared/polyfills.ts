declare global {
	interface Math {
		range(from: number, value: number, to: number): number;
	}
}

Math.range = function (a, b, c) {
	return Math.min(c, Math.max(b, a));
}

export {};