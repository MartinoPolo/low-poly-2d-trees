import { test, expect } from '@playwright/test';

test.describe('Issue #9 — Color system overhaul', () => {
	test('single editor shows two canopy color pickers with hex labels', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		const lightPicker = page.locator('#canopy-light-color');
		const darkPicker = page.locator('#canopy-dark-color');
		await expect(lightPicker).toHaveAttribute('type', 'color');
		await expect(darkPicker).toHaveAttribute('type', 'color');

		// Default oak palette
		await expect(lightPicker).toHaveValue('#a8d84e');
		await expect(darkPicker).toHaveValue('#1a472a');

		// Hex values are visible in editable inputs next to each picker
		await expect(page.locator('[data-hex="canopy-light"]').first()).toHaveValue('#a8d84e');
		await expect(page.locator('[data-hex="canopy-dark"]').first()).toHaveValue('#1a472a');
	});

	test('single editor: per-shape defaults toggle is NOT present (REQ-L-09b)', async ({
		page,
	}) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');
		await expect(page.getByText(/Use per-shape default colors/i)).toHaveCount(0);
	});

	test('single editor: switching shape updates color pickers', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		// Switch to pine
		const trigger = page.locator('[data-slot="select-trigger"]').first();
		await trigger.click();
		await page.locator('[role="option"]').filter({ hasText: /pine/i }).first().click();

		await expect(page.locator('#canopy-light-color')).toHaveValue('#4a9e5c');
		await expect(page.locator('#canopy-dark-color')).toHaveValue('#0d2b1a');
	});

	test('single editor: trunk preset swatch sets all 3 HSL sliders (REQ-S-14)', async ({
		page,
	}) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		await page.locator('[data-trunk-preset="Dark brown"]').click();

		// Dark brown: hue=20, sat=55, light=20
		// shadcn sliders: read value from the thumb's aria-valuenow
		const hueThumb = page.locator('#slider-hue [data-slot="slider-thumb"]');
		const satThumb = page.locator('#slider-saturation [data-slot="slider-thumb"]');
		const lightThumb = page.locator('#slider-lightness [data-slot="slider-thumb"]');

		await expect(hueThumb).toHaveAttribute('aria-valuenow', '20');
		await expect(satThumb).toHaveAttribute('aria-valuenow', '55');
		await expect(lightThumb).toHaveAttribute('aria-valuenow', '20');
	});

	test('scene editor shows the per-shape defaults toggle', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await expect(page.getByText(/Use per-shape default colors/i)).toBeVisible();
	});

	test('scene editor: toggle ON disables shared canopy + trunk controls', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const lightPicker = page.locator('#canopy-light-color');
		const darkPicker = page.locator('#canopy-dark-color');
		await expect(lightPicker).toBeEnabled();
		await expect(darkPicker).toBeEnabled();

		// Click the toggle
		await page.locator('label[for="use-per-shape-defaults"]').click();

		await expect(lightPicker).toBeDisabled();
		await expect(darkPicker).toBeDisabled();

		// HSL sliders (shadcn): check data-disabled attribute
		const hueSlider = page.locator('#slider-hue');
		const satSlider = page.locator('#slider-saturation');
		const lightSlider = page.locator('#slider-lightness');

		await expect(hueSlider).toHaveAttribute('data-disabled', '');
		await expect(satSlider).toHaveAttribute('data-disabled', '');
		await expect(lightSlider).toHaveAttribute('data-disabled', '');

		// Click again -> controls re-enabled
		await page.locator('label[for="use-per-shape-defaults"]').click();
		await expect(lightPicker).toBeEnabled();
		await expect(darkPicker).toBeEnabled();
	});

	test('scene editor: toggle ON makes trees render with different canopy colors', async ({
		page,
	}) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const getCanopyFills = () =>
			page.evaluate(() => {
				const treeSvgs = Array.from(document.querySelectorAll('svg')).filter(
					(svg) => svg.querySelector('g.canopy') !== null,
				);
				return treeSvgs.map((svg) => {
					const polys = Array.from(svg.querySelectorAll('g.canopy polygon'));
					return polys.map((p) => p.getAttribute('fill') ?? '').slice(0, 5);
				});
			});

		// Toggle OFF (default): all trees share the same picker colors.
		const sharedFills = await getCanopyFills();
		expect(sharedFills.length).toBeGreaterThanOrEqual(3);

		// Toggle ON
		await page.locator('label[for="use-per-shape-defaults"]').click();
		await expect(page.locator('#canopy-light-color')).toBeDisabled();

		const perShapeFills = await getCanopyFills();
		expect(perShapeFills.length).toBeGreaterThanOrEqual(3);

		expect(perShapeFills[0]).not.toEqual(perShapeFills[1]);
		expect(perShapeFills).not.toEqual(sharedFills);
	});
});
