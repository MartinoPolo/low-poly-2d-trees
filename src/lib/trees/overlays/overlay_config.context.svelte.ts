import { OVERLAY_DEFAULTS, type OverlayConfig } from './overlay_types.js';

class OverlayConfigState {
	stormCloudEnabled = $state(OVERLAY_DEFAULTS.stormCloud.enabled);
	stormCloudShowRain = $state(OVERLAY_DEFAULTS.stormCloud.showRain);
	speechBubbleEnabled = $state(OVERLAY_DEFAULTS.speechBubble.enabled);
	speechBubbleText = $state(OVERLAY_DEFAULTS.speechBubble.text);
	wiltingEnabled = $state(OVERLAY_DEFAULTS.wilting.enabled);
	glowEnabled = $state(OVERLAY_DEFAULTS.glow.enabled);
	glowColor = $state(OVERLAY_DEFAULTS.glow.color);
	glowPulse = $state(OVERLAY_DEFAULTS.glow.pulse);
	groundEnabled = $state(false);

	get config(): OverlayConfig {
		return {
			stormCloud: {
				enabled: this.stormCloudEnabled,
				showRain: this.stormCloudShowRain,
			},
			speechBubble: {
				enabled: this.speechBubbleEnabled,
				text: this.speechBubbleText,
			},
			wilting: {
				enabled: this.wiltingEnabled,
			},
			glow: {
				enabled: this.glowEnabled,
				color: this.glowColor,
				pulse: this.glowPulse,
			},
		};
	}
}

export function createOverlayConfigContext() {
	return new OverlayConfigState();
}
