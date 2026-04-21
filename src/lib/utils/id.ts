export function labelToInputId(label: string, fallbackId?: string): string {
	if (fallbackId !== undefined && fallbackId !== '') {
		return fallbackId;
	}
	return `input-${label
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')}`;
}
