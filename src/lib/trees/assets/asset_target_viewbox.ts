interface TargetViewBox {
	readonly width: number;
	readonly height: number;
}

const ASSET_TARGET_VIEWBOX: Partial<Record<string, TargetViewBox>> = {
	ladder: { width: 40, height: 120 },
	grill: { width: 100, height: 80 },
	stormCloud: { width: 120, height: 80 },
	speechBubble: { width: 120, height: 80 },
};

const CATEGORY_DEFAULT_VIEWBOX: Record<string, TargetViewBox> = {
	tools: { width: 60, height: 100 },
	fruits: { width: 60, height: 60 },
	flowers: { width: 60, height: 60 },
	ground: { width: 120, height: 80 },
	stages: { width: 60, height: 100 },
	overlays: { width: 120, height: 80 },
};

export function getTargetViewBox(category: string, assetName: string): TargetViewBox {
	return (
		ASSET_TARGET_VIEWBOX[assetName] ??
		CATEGORY_DEFAULT_VIEWBOX[category] ?? { width: 100, height: 100 }
	);
}
