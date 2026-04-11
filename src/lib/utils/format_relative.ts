const RELATIVE_FORMATTER = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

interface Division {
	readonly amount: number;
	readonly unit: Intl.RelativeTimeFormatUnit;
}

const DIVISIONS: readonly Division[] = [
	{ amount: 60, unit: 'seconds' },
	{ amount: 60, unit: 'minutes' },
	{ amount: 24, unit: 'hours' },
	{ amount: 7, unit: 'days' },
	{ amount: 4.34524, unit: 'weeks' },
	{ amount: 12, unit: 'months' },
	{ amount: Number.POSITIVE_INFINITY, unit: 'years' },
];

export function formatRelative(date: Date, now: Date = new Date()): string {
	let duration = (date.getTime() - now.getTime()) / 1000;
	for (const division of DIVISIONS) {
		if (Math.abs(duration) < division.amount) {
			return RELATIVE_FORMATTER.format(Math.round(duration), division.unit);
		}
		duration /= division.amount;
	}
	return RELATIVE_FORMATTER.format(Math.round(duration), 'years');
}
