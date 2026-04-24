export function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export function hasNumber(obj: Record<string, unknown>, key: string): boolean {
	return typeof obj[key] === 'number';
}

export function hasString(obj: Record<string, unknown>, key: string): boolean {
	return typeof obj[key] === 'string';
}

export function hasBoolean(obj: Record<string, unknown>, key: string): boolean {
	return typeof obj[key] === 'boolean';
}

export function hasNumberPair(obj: Record<string, unknown>, key: string): boolean {
	const val = obj[key];
	return (
		Array.isArray(val) &&
		val.length === 2 &&
		typeof val[0] === 'number' &&
		typeof val[1] === 'number'
	);
}

export function isValidBoolean(value: unknown): value is boolean {
	return typeof value === 'boolean';
}
