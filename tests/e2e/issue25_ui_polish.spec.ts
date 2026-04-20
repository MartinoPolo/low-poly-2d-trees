import { test, expect } from '@playwright/test';

test.describe('Issue #25 — UI polish: color picker styling + layout swap', () => {
	test('canopy color swatches are styled square buttons with rounded corners', async ({
		page,
	}) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		for (const variant of ['canopy-light', 'canopy-dark'] as const) {
			const swatch = page.locator(`[data-swatch="${variant}"]`);
			await expect(swatch).toBeVisible();

			// Must be a button element
			const tagName = await swatch.evaluate((el) => el.tagName.toLowerCase());
			expect(tagName).toBe('button');

			// Must have rounded-md class
			const classList = await swatch.evaluate((el) => el.className);
			expect(classList).toContain('rounded-md');

			// Must be square (width === height)
			const box = await swatch.boundingBox();
			expect(box).not.toBeNull();
			expect(box!.width).toBeCloseTo(box!.height, 0);
		}
	});

	test('hex value is displayed in an editable Input next to each swatch', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Per-shape defaults is ON by default — turn it OFF to enable color controls
		await page.locator('label[for="use-per-shape-defaults"]').click();

		const lightHex = page.locator('[data-hex="canopy-light"]');
		const darkHex = page.locator('[data-hex="canopy-dark"]');

		await expect(lightHex).toBeVisible();
		await expect(darkHex).toBeVisible();

		// Should have current hex values
		await expect(lightHex).toHaveValue('#a8d84e');
		await expect(darkHex).toHaveValue('#1a472a');

		// Should be editable — clear and type a new value
		await lightHex.fill('#ff0000');
		await expect(lightHex).toHaveValue('#ff0000');
	});

	test('clicking swatch dispatches click to hidden color input', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Per-shape defaults is ON by default — turn it OFF to enable color controls
		await page.locator('label[for="use-per-shape-defaults"]').click();

		// Verify the hidden input receives a click when the swatch button is clicked
		const clicked = await page.evaluate(() => {
			return new Promise<boolean>((resolve) => {
				const hiddenInput = document.querySelector('#canopy-light-color');
				const swatch = document.querySelector('[data-swatch="canopy-light"]');
				if (hiddenInput === null || swatch === null) {
					resolve(false);
					return;
				}
				hiddenInput.addEventListener('click', () => resolve(true), { once: true });
				(swatch as HTMLElement).click();
				setTimeout(() => resolve(false), 1000);
			});
		});

		expect(clicked).toBe(true);
	});

	test('disabled state applies to swatch and hex input', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Per-shape defaults is ON by default — controls should already be disabled
		const swatch = page.locator('[data-swatch="canopy-light"]');
		const hexInput = page.locator('[data-hex="canopy-light"]');

		await expect(swatch).toBeDisabled();
		await expect(hexInput).toBeDisabled();

		// Toggle OFF — controls should become enabled
		await page.locator('label[for="use-per-shape-defaults"]').click();
		await expect(swatch).toBeEnabled();
		await expect(hexInput).toBeEnabled();
	});

	test('scene layout — canvas is on top, controls on bottom', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const canvas = page.locator('[data-testid="scene-canvas"]');
		const controls = page.locator('[data-testid="scene-controls"]');

		await expect(canvas).toBeVisible();
		await expect(controls).toBeVisible();

		const canvasBox = await canvas.boundingBox();
		const controlsBox = await controls.boundingBox();

		expect(canvasBox).not.toBeNull();
		expect(controlsBox).not.toBeNull();
		// Canvas should be above controls (top/bottom split)
		expect(canvasBox!.y).toBeLessThan(controlsBox!.y);
	});

	test('control panel spans full width', async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 768 });
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Collapse sidebar so controls get full width minus offcanvas (0px)
		await page.keyboard.press('Control+b');
		await page.waitForTimeout(300);

		const controls = page.locator('[data-testid="scene-controls"]');
		const width = await controls.evaluate((el) => (el as HTMLElement).offsetWidth);

		// Controls should span nearly full width (sidebar is offcanvas, fully hidden)
		expect(width).toBeGreaterThanOrEqual(900);
	});
});
