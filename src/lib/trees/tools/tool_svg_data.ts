import type { ToolType } from './tool_types.js';

interface ToolPolygon {
	readonly points: string;
	readonly fill: string;
}

interface ToolSvgConfig {
	readonly polygons: readonly ToolPolygon[];
	readonly width: number;
	readonly height: number;
}

// All coordinates are in local space centered near (0,0).
// The component translates to the anchor position.

export const TOOL_SVG_DATA = {
	shovel: {
		width: 20,
		height: 50,
		polygons: [
			// Handle (long wooden shaft)
			{ points: '-1,-24 1,-24 1,12 -1,12', fill: '#8B6914' },
			{ points: '-1.5,-24 1.5,-24 1,-22 -1,-22', fill: '#A0782C' },
			// Handle grip
			{ points: '-2.5,-24 2.5,-24 2.5,-22 -2.5,-22', fill: '#5C4033' },
			{ points: '-2.5,-22 -1.5,-22 -1.5,-24 -2.5,-24', fill: '#4A3228' },
			{ points: '1.5,-22 2.5,-22 2.5,-24 1.5,-24', fill: '#4A3228' },
			// Blade (spade shape - earth tones)
			{ points: '-1,12 1,12 5,18 0,25 -5,18', fill: '#6B7B3A' },
			{ points: '-1,12 1,12 3,16 -3,16', fill: '#7C8C4A' },
			{ points: '-3,16 3,16 5,18 -5,18', fill: '#5A6A2E' },
			{ points: '-5,18 5,18 3,22 -3,22', fill: '#4D5D24' },
			{ points: '-3,22 3,22 0,25', fill: '#3F4F1C' },
			// Blade highlight
			{ points: '0,12 1,12 4,17 0,20', fill: '#8C9C5A' },
			// Blade edge
			{ points: '-5,18 -3,22 -4,20', fill: '#3A4A18' },
			{ points: '5,18 3,22 4,20', fill: '#3A4A18' },
			// Shaft collar (metal ring where blade meets handle)
			{ points: '-2,11 2,11 2,13 -2,13', fill: '#888888' },
			{ points: '-2,11 2,11 1.5,11.5 -1.5,11.5', fill: '#AAAAAA' },
		],
	},
	ladder: {
		width: 24,
		height: 55,
		polygons: [
			// Left rail
			{ points: '-10,-27 -8,-27 -8,27 -10,27', fill: '#A0782C' },
			{ points: '-10,-27 -8,-27 -8.5,-26 -9.5,-26', fill: '#B8924A' },
			// Right rail
			{ points: '8,-27 10,-27 10,27 8,27', fill: '#8B6914' },
			{ points: '8,-27 10,-27 9.5,-26 8.5,-26', fill: '#A67D30' },
			// Rung 1 (top)
			{ points: '-8,-20 8,-20 8,-18 -8,-18', fill: '#C4A265' },
			{ points: '-8,-20 8,-20 7,-19 -7,-19', fill: '#D4B275' },
			// Rung 2
			{ points: '-8,-10 8,-10 8,-8 -8,-8', fill: '#B8924A' },
			{ points: '-8,-10 8,-10 7,-9 -7,-9', fill: '#C4A265' },
			// Rung 3
			{ points: '-8,0 8,0 8,2 -8,2', fill: '#C4A265' },
			{ points: '-8,0 8,0 7,1 -7,1', fill: '#D4B275' },
			// Rung 4
			{ points: '-8,10 8,10 8,12 -8,12', fill: '#B8924A' },
			{ points: '-8,10 8,10 7,11 -7,11', fill: '#C4A265' },
			// Rung 5 (bottom)
			{ points: '-8,20 8,20 8,22 -8,22', fill: '#C4A265' },
			{ points: '-8,20 8,20 7,21 -7,21', fill: '#D4B275' },
			// Left rail shadow
			{ points: '-10,-27 -9,-27 -9,27 -10,27', fill: '#7A5910' },
			// Right rail highlight
			{ points: '9,-27 10,-27 10,27 9,27', fill: '#7A5910' },
		],
	},
	wateringCan: {
		width: 30,
		height: 28,
		polygons: [
			// Body (main container - metallic)
			{ points: '-8,-4 8,-4 10,8 -10,8', fill: '#708090' },
			{ points: '-8,-4 8,-4 6,-2 -6,-2', fill: '#8899AA' },
			{ points: '-10,8 10,8 8,10 -8,10', fill: '#5A6A7A' },
			// Body side panels
			{ points: '-8,-4 -6,-2 -8,8 -10,8', fill: '#607080' },
			{ points: '8,-4 6,-2 8,8 10,8', fill: '#607080' },
			// Bottom
			{ points: '-8,10 8,10 6,12 -6,12', fill: '#4A5A6A' },
			// Handle (top arc)
			{ points: '-3,-4 3,-4 3,-6 -3,-6', fill: '#505A64' },
			{ points: '-3,-6 -1,-10 1,-10 3,-6', fill: '#606A74' },
			{ points: '-1,-10 1,-10 0.5,-8 -0.5,-8', fill: '#707A84' },
			// Spout (angled to the right)
			{ points: '8,0 8,2 14,-6 13,-7', fill: '#8899AA' },
			{ points: '13,-7 14,-6 15,-6 14,-7.5', fill: '#96A7B8' },
			// Spout rose (sprinkler head)
			{ points: '13,-8 16,-8 16,-5 13,-5', fill: '#6A7A8A' },
			{ points: '13,-8 16,-8 15.5,-7 13.5,-7', fill: '#7A8A9A' },
			// Spout holes (decorative dots)
			{ points: '14,-7 14.5,-7 14.5,-6.5 14,-6.5', fill: '#4A5A6A' },
			{ points: '15,-7 15.5,-7 15.5,-6.5 15,-6.5', fill: '#4A5A6A' },
			{ points: '14,-6 14.5,-6 14.5,-5.5 14,-5.5', fill: '#4A5A6A' },
			{ points: '15,-6 15.5,-6 15.5,-5.5 15,-5.5', fill: '#4A5A6A' },
			// Band (decorative strip around body)
			{ points: '-9,3 9,3 9,5 -9,5', fill: '#5A6A7A' },
			{ points: '-9,3 9,3 8.5,3.5 -8.5,3.5', fill: '#6A7A8A' },
			// Body highlight
			{ points: '-4,-2 4,-2 3,6 -3,6', fill: '#8494A4' },
		],
	},
	birdNest: {
		width: 28,
		height: 20,
		polygons: [
			// Nest base (woven twigs - brown)
			{ points: '-12,2 12,2 14,8 -14,8', fill: '#6B4226' },
			{ points: '-14,8 14,8 10,12 -10,12', fill: '#5A3520' },
			{ points: '-10,12 10,12 6,14 -6,14', fill: '#4A2818' },
			// Nest rim (top edge)
			{ points: '-13,0 13,0 12,2 -12,2', fill: '#7C5335' },
			{ points: '-14,0 -12,0 -12,2 -14,4', fill: '#6B4226' },
			{ points: '12,0 14,0 14,4 12,2', fill: '#6B4226' },
			// Twig texture (cross-hatching effect)
			{ points: '-10,3 -6,3 -7,5 -11,5', fill: '#5A3520' },
			{ points: '-2,3 4,3 3,5 -3,5', fill: '#5A3520' },
			{ points: '6,3 10,3 9,5 5,5', fill: '#5A3520' },
			{ points: '-8,6 -4,6 -5,8 -9,8', fill: '#7C5335' },
			{ points: '2,6 8,6 7,8 1,8', fill: '#7C5335' },
			// Egg 1 (left)
			{ points: '-5,0 -3,0 -2,2 -3,4 -5,4 -6,2', fill: '#F5F0E8' },
			{ points: '-5,0 -3,0 -3.5,1 -4.5,1', fill: '#FEFCF8' },
			// Egg 2 (center)
			{ points: '-1,-1 1,-1 2,1 1,3 -1,3 -2,1', fill: '#EDE8DF' },
			{ points: '-1,-1 1,-1 0.5,0 -0.5,0', fill: '#F5F0E8' },
			// Egg 3 (right)
			{ points: '3,0 5,0 6,2 5,4 3,4 2,2', fill: '#F5F0E8' },
			{ points: '3,0 5,0 4.5,1 3.5,1', fill: '#FEFCF8' },
			// Nest interior shadow
			{ points: '-10,4 10,4 8,8 -8,8', fill: '#3A1E10' },
		],
	},
} as const satisfies Record<ToolType, ToolSvgConfig>;
