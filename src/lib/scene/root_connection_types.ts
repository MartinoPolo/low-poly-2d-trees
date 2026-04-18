import type { Point2D } from '$lib/trees/types/core.js';

export const CONNECTION_STATES = {
	connected: 'connected',
	disconnected: 'disconnected',
} as const;

export type ConnectionState = (typeof CONNECTION_STATES)[keyof typeof CONNECTION_STATES];

export interface BezierControlPoints {
	readonly controlPoint1: Point2D;
	readonly controlPoint2: Point2D;
}
