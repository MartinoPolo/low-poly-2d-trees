import { browser } from '$app/environment';
import { on } from 'svelte/events';
import { createSubscriber } from 'svelte/reactivity';
import { ReadonlyState, type MutableState, type ReadableState } from './state.svelte';

interface Serde<T> {
	serialize: (value: T) => string;
	deserialize: (value: string) => { success: true; data: T } | { success: false };
}

export function jsonSerde<T>(validate: (value: unknown) => value is T): Serde<T> {
	return {
		serialize: (value: T) => JSON.stringify(value),
		deserialize: (raw: string) => {
			try {
				const parsed: unknown = JSON.parse(raw);
				if (validate(parsed)) {
					return { success: true, data: parsed };
				}
				return { success: false };
			} catch {
				return { success: false };
			}
		},
	};
}

interface PersistedOptions<T> {
	key: string;
	serde: Serde<T>;
	defaultValue: NoInfer<T>;
}

/**
 * A raw state persisted in localStorage. Listens to `storage` events for cross-tab sync.
 */
export class Persisted<T> implements MutableState<T> {
	#key;
	#defaultValue;
	#subscribe;
	#update: (() => void) | undefined = undefined;
	#serde: Serde<T>;
	#cached: T;

	constructor({ key, serde, defaultValue }: PersistedOptions<T>) {
		this.#key = key;
		this.#defaultValue = defaultValue;
		this.#serde = serde;
		this.#cached = defaultValue;

		if (!browser) {
			return;
		}

		// Read initial value from localStorage
		this.#cached = this.#readFromStorage();

		this.#subscribe = createSubscriber((update) => {
			this.#update = update;
			const cleanup = on(window, 'storage', (e) => {
				if (e.key === key) {
					this.#cached = this.#readFromStorage();
					update();
				}
			});
			return () => {
				cleanup();
				this.#update = undefined;
			};
		});
	}

	#readFromStorage(): T {
		const val = localStorage.getItem(this.#key);
		if (val == null) {
			return this.#defaultValue;
		}
		const parsed = this.#serde.deserialize(val);
		if (!parsed.success) {
			this.#setToStorage(this.#defaultValue);
			return this.#defaultValue;
		}
		return parsed.data;
	}

	#setToStorage(value: T) {
		try {
			localStorage.setItem(this.#key, this.#serde.serialize(value));
		} catch {
			// QuotaExceededError or similar — in-memory value is still valid
		}
	}

	get current(): T {
		if (!browser) {
			return this.#defaultValue;
		}
		this.#subscribe?.();
		return this.#cached;
	}

	set current(newValue: T) {
		this.#cached = newValue;
		this.#setToStorage(newValue);
		this.#update?.();
	}

	setDefaultValue(): void {
		this.#cached = this.#defaultValue;
		this.#setToStorage(this.#defaultValue);
		this.#update?.();
	}

	// fallow-ignore-next-line unused-class-member
	readonly(): ReadableState<T> {
		return new ReadonlyState(this);
	}
}
