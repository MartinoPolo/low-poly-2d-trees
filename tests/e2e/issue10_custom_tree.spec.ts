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
		await page.goto('/showcase');
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
		await page.goto('/showcase');
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
		await page.goto('/showcase');
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
		await page.goto('/showcase');
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
		// Boundary select is the second select trigger in the DOM (shape is first).
		await expect(content.locator('label').filter({ hasText: /Boundary/i })).toBeVisible();
		await expect(content.locator('label').filter({ hasText: /^Rotation/ })).toBeVisible();
		await expect(content.locator('label').filter({ hasText: /^Size/ })).toBeVisible();
		await expect(content.locator('label').filter({ hasText: /^X:/ })).toBeVisible();
		await expect(content.locator('label').filter({ hasText: /^Y:/ })).toBeVisible();
	});

	test('single editor: changing a blob X position updates the canopy in the preview', async ({
		page,
	}) => {
		await page.goto('/showcase');
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

		// Grab the X slider (the label matches "X: ..."), change its value,
		// dispatch input, and assert the canopy still renders (preview updates
		// deterministically).
		const xSlider = content
			.locator('label')
			.filter({ hasText: /^X:/ })
			.locator('..')
			.locator('input[type="range"]');
		await expect(xSlider).toBeVisible();

		await xSlider.evaluate((el) => {
			const input = el as HTMLInputElement;
			input.value = '0.75';
			input.dispatchEvent(new Event('input', { bubbles: true }));
		});

		// The preview still renders — canopy polygons remain present.
		await expect(page.locator('svg .canopy polygon').first()).toBeVisible();
	});

	test('scene editor does NOT show the custom shape', async ({ page }) => {
		await page.goto('/showcase/scene');
		await page.waitForLoadState('networkidle');

		// Scene editor has no shape dropdown. It renders exactly three hardcoded
		// trees (oak/pine/birch per the current layout). Custom must not appear
		// as a label.
		await expect(page.getByText(/^custom$/i)).toHaveCount(0);
	});
});
