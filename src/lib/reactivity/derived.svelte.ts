export class Derived<T> {
	#current: T;

	constructor(get: () => T) {
		this.#current = $derived.by(get);
	}

	// fallow-ignore-next-line unused-class-member
	get current() {
		return this.#current;
	}
}
