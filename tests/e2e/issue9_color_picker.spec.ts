import { test, expect } from '@playwright/test';

test.describe('Issue #9 — Color system overhaul', () => {
	test('single editor shows two canopy color pickers with hex labels', async ({ page }) => {
		await page.goto('/showcase');
		await page.waitForLoadState('networkidle');

		const lightPicker = page.locator('#canopy-light-color');
		const darkPicker = page.locator('#canopy-dark-color');
		await expect(lightPicker).toHaveAttribute('type', 'color');
		await expect(darkPicker).toHaveAttribute('type', 'color');

		// Default oak palette (§2.6)
		await expect(lightPicker).toHaveValue('#a8d84e');
		await expect(darkPicker).toHaveValue('#1a472a');

		// Hex values are visible in editable inputs next to each picker
		await expect(page.locator('[data-hex="canopy-light"]').first()).toHaveValue('#a8d84e');
		await expect(page.locator('[data-hex="canopy-dark"]').first()).toHaveValue('#1a472a');
	});

	test('single editor: per-shape defaults toggle is NOT present (REQ-L-09b)', async ({
		page,
	}) => {
		await page.goto('/showcase');
		await page.waitForLoadState('networkidle');
		await expect(page.getByText(/Use per-shape default colors/i)).toHaveCount(0);
	});

	test('single editor: switching shape updates color pickers', async ({ page }) => {
		await page.goto('/showcase');
		await page.waitForLoadState('networkidle');

		// Switch to pine (§2.6 canopyLightColor = #4a9e5c)
		const trigger = page.locator('[data-slot="select-trigger"]').first();
		await trigger.click();
		await page.locator('[role="option"]').filter({ hasText: /pine/i }).first().click();

		await expect(page.locator('#canopy-light-color')).toHaveValue('#4a9e5c');
		await expect(page.locator('#canopy-dark-color')).toHaveValue('#0d2b1a');
	});

	test('single editor: trunk preset swatch sets all 3 HSL sliders (REQ-S-14)', async ({
		page,
	}) => {
		await page.goto('/showcase');
		await page.waitForLoadState('networkidle');

		await page.locator('[data-trunk-preset="Dark brown"]').click();

		// Dark brown: hue=20, sat=55, light=20
		await expect(page.locator('#range-hue')).toHaveValue('20');
		await expect(page.locator('#range-saturation')).toHaveValue('55');
		await expect(page.locator('#range-lightness')).toHaveValue('20');
	});

	test('scene editor shows the per-shape defaults toggle', async ({ page }) => {
		await page.goto('/showcase/scene');
		await page.waitForLoadState('networkidle');
		await expect(page.getByText(/Use per-shape default colors/i)).toBeVisible();
	});

	test('scene editor: toggle ON disables shared canopy + trunk controls', async ({ page }) => {
		await page.goto('/showcase/scene');
		await page.waitForLoadState('networkidle');

		const lightPicker = page.locator('#canopy-light-color');
		const darkPicker = page.locator('#canopy-dark-color');
		await expect(lightPicker).toBeEnabled();
		await expect(darkPicker).toBeEnabled();

		// Click the toggle (shadcn Checkbox delegates; click the Label)
		await page.locator('label[for="use-per-shape-defaults"]').click();

		await expect(lightPicker).toBeDisabled();
		await expect(darkPicker).toBeDisabled();
		await expect(page.locator('#range-hue')).toBeDisabled();
		await expect(page.locator('#range-saturation')).toBeDisabled();
		await expect(page.locator('#range-lightness')).toBeDisabled();

		// Click again → controls re-enabled
		await page.locator('label[for="use-per-shape-defaults"]').click();
		await expect(lightPicker).toBeEnabled();
		await expect(darkPicker).toBeEnabled();
	});

	test('scene editor: toggle ON makes trees render with different canopy colors', async ({
		page,
	}) => {
		await page.goto('/showcase/scene');
		await page.waitForLoadState('networkidle');

		// Read canopy triangle fills for each rendered tree. Each <LowPolyTree>
		// SVG contains <g class="canopy"> with nested <polygon> elements carrying
		// the triangle fills. Filter out icon SVGs (DarkModeToggle, Shuffle, etc.)
		// by requiring a canopy group.
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

		// Toggle ON: each tree should use its own shape default palette, so the
		// palette for oak and pine must diverge visibly.
		await page.locator('label[for="use-per-shape-defaults"]').click();
		await expect(page.locator('#canopy-light-color')).toBeDisabled();

		const perShapeFills = await getCanopyFills();
		expect(perShapeFills.length).toBeGreaterThanOrEqual(3);

		// Any two tree fill sets should now be different (different palettes),
		// and the per-shape palette must differ from the shared-palette baseline.
		expect(perShapeFills[0]).not.toEqual(perShapeFills[1]);
		expect(perShapeFills).not.toEqual(sharedFills);
	});
});
