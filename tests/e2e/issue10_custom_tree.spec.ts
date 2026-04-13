import { test, expect } from '@playwright/test';

/**
 * Issue #10 — Custom tree mode (7th shape) with per-blob editor.
 *
 * Covers the acceptance criteria that can only be verified in the browser:
 *  - `custom` appears in the single editor shape dropdown
 *  - Selecting `custom` reveals a "Custom Blobs" card with accordion sub-cards
 *  - Each blob has boundary/rotation/size/x/y controls
 *  - Changing blob 0 boundary updates the preview (triangle count changes)
 *  - Adjusting a blob's position updates the preview
 *  - Scene editor does NOT expose the custom shape
 */

test.describe('Issue #10 — Custom tree mode', () => {
	test('single editor: custom shape exists in the dropdown', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		const trigger = page.locator('[data-slot="select-trigger"]').first();
		await trigger.click();
		await expect(
			page
				.locator('[role="option"]')
				.filter({ hasText: /custom/i })
				.first(),
		).toHaveCount(1);
	});

	test('single editor: selecting custom reveals the Custom Blobs card', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		await expect(page.getByText('Custom Blobs')).toHaveCount(0);

		const trigger = page.locator('[data-slot="select-trigger"]').first();
		await trigger.click();
		await page
			.locator('[role="option"]')
			.filter({ hasText: /custom/i })
			.first()
			.click();

		await expect(page.getByText('Custom Blobs')).toBeVisible();
	});

	test('single editor: custom blobs card has one accordion item per blob', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		const trigger = page.locator('[data-slot="select-trigger"]').first();
		await trigger.click();
		await page
			.locator('[role="option"]')
			.filter({ hasText: /custom/i })
			.first()
			.click();

		// Default blobCount is 5 (oak default carried over on shape-switch).
		const triggers = page.locator('[data-slot="accordion-trigger"]');
		await expect(triggers).toHaveCount(5);
	});

	test('single editor: expanding a blob reveals 5 controls (boundary + 4 sliders)', async ({
		page,
	}) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		const shapeTrigger = page.locator('[data-slot="select-trigger"]').first();
		await shapeTrigger.click();
		await page
			.locator('[role="option"]')
			.filter({ hasText: /custom/i })
			.first()
			.click();

		const firstBlob = page.locator('[data-slot="accordion-trigger"]').first();
		await firstBlob.click();

		const content = page.locator('[data-slot="accordion-content"]').first();
		await expect(content.locator('label').filter({ hasText: /Boundary/i })).toBeVisible();
		await expect(content.locator('label').filter({ hasText: /^Rotation/ })).toBeVisible();
		await expect(content.locator('label').filter({ hasText: /^Size/ })).toBeVisible();
		await expect(content.locator('label').filter({ hasText: /^X:/ })).toBeVisible();
		await expect(content.locator('label').filter({ hasText: /^Y:/ })).toBeVisible();
	});

	test('single editor: changing a blob X position updates the canopy polygon points', async ({
		page,
	}) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		const shapeTrigger = page.locator('[data-slot="select-trigger"]').first();
		await shapeTrigger.click();
		await page
			.locator('[role="option"]')
			.filter({ hasText: /custom/i })
			.first()
			.click();

		const firstBlob = page.locator('[data-slot="accordion-trigger"]').first();
		await firstBlob.click();

		const content = page.locator('[data-slot="accordion-content"]').first();
		const initialPolygonCount = await page.locator('svg .canopy polygon').count();
		expect(initialPolygonCount).toBeGreaterThan(0);

		// Capture polygon points before the slider change.
		const pointsBefore = await page
			.locator('svg .canopy polygon')
			.evaluateAll((els) => els.map((el) => el.getAttribute('points')));

		// Find the X slider within the first accordion content.
		// The LabeledSlider for "X" renders a shadcn slider with auto-ID "slider-x".
		// Scope within the accordion content to get the correct one.
		const xSliderContainer = content.locator('label').filter({ hasText: /^X:/ }).locator('..');
		const xSlider = xSliderContainer.locator('[data-slot="slider"]');
		await expect(xSlider).toBeVisible();

		// Click thumb for focus, press End to move to max value
		await xSlider.locator('[data-slot="slider-thumb"]').click();
		await page.keyboard.press('End');
		await page.waitForTimeout(300);

		// Wait for the preview to re-render.
		await expect(page.locator('svg .canopy polygon').first()).toBeVisible();

		// Capture polygon points after and assert they differ (canopy shifted).
		const pointsAfter = await page
			.locator('svg .canopy polygon')
			.evaluateAll((els) => els.map((el) => el.getAttribute('points')));

		expect(pointsAfter).not.toEqual(pointsBefore);
	});

	test('single editor: changing blob 0 boundary to egg updates the preview', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		const shapeTrigger = page.locator('[data-slot="select-trigger"]').first();
		await shapeTrigger.click();
		await page
			.locator('[role="option"]')
			.filter({ hasText: /custom/i })
			.first()
			.click();

		const firstBlob = page.locator('[data-slot="accordion-trigger"]').first();
		await firstBlob.click();

		// Capture polygon points before boundary change.
		const pointsBefore = await page
			.locator('svg .canopy polygon')
			.evaluateAll((els) => els.map((el) => el.getAttribute('points')));

		// Wait for the accordion content to be fully expanded.
		const content = page.locator('[data-slot="accordion-content"]').first();
		await expect(content.locator('label').filter({ hasText: /Boundary/i })).toBeVisible();

		// Open the Boundary dropdown inside the first blob's accordion content.
		const boundaryTrigger = content.locator('[data-slot="select-trigger"]');
		await expect(boundaryTrigger).toBeVisible();
		await boundaryTrigger.click();

		// Select "Egg".
		await page.locator('[role="option"]').filter({ hasText: /Egg/i }).first().click();

		// Wait for the preview to re-render.
		await expect(page.locator('svg .canopy polygon').first()).toBeVisible();

		// Polygon points should differ — different boundary produces different triangulation.
		const pointsAfter = await page
			.locator('svg .canopy polygon')
			.evaluateAll((els) => els.map((el) => el.getAttribute('points')));

		expect(pointsAfter).not.toEqual(pointsBefore);
	});

	test('single editor: adjusting blob 2 position updates the preview', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		const shapeTrigger = page.locator('[data-slot="select-trigger"]').first();
		await shapeTrigger.click();
		await page
			.locator('[role="option"]')
			.filter({ hasText: /custom/i })
			.first()
			.click();

		// Default blobCount is 5, so blob 2 (index 2, "Blob 3") exists.
		const blobTriggers = page.locator('[data-slot="accordion-trigger"]');
		await expect(blobTriggers).toHaveCount(5);

		// Expand blob 2 (third accordion item).
		await blobTriggers.nth(2).click();

		// Capture polygon points before.
		const pointsBefore = await page
			.locator('svg .canopy polygon')
			.evaluateAll((els) => els.map((el) => el.getAttribute('points')));

		// Change blob 2's X position via the slider.
		const content = page.locator('[data-slot="accordion-content"]').nth(2);
		const xSliderContainer = content.locator('label').filter({ hasText: /^X:/ }).locator('..');
		const xSlider = xSliderContainer.locator('[data-slot="slider"]');
		await expect(xSlider).toBeVisible();

		// Click thumb for focus, press Home to go to min value
		await xSlider.locator('[data-slot="slider-thumb"]').click();
		await page.keyboard.press('Home');
		await page.waitForTimeout(300);

		await expect(page.locator('svg .canopy polygon').first()).toBeVisible();

		const pointsAfter = await page
			.locator('svg .canopy polygon')
			.evaluateAll((els) => els.map((el) => el.getAttribute('points')));

		expect(pointsAfter).not.toEqual(pointsBefore);
	});

	test('scene editor does NOT show the custom shape', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Scene editor has no shape dropdown. Custom must not appear as a label.
		await expect(page.getByText(/^custom$/i)).toHaveCount(0);
	});
});
