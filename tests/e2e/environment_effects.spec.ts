import { test, expect } from '@playwright/test';

test.describe('Environment effects (#41)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
	});

	test('all 7 checkboxes visible and default unchecked', async ({ page }) => {
		const toggleIds = [
			'env-rain-toggle',
			'env-lightning-toggle',
			'env-snow-toggle',
			'env-fireflies-toggle',
			'env-wind-toggle',
			'env-sun-rays-toggle',
			'env-clouds-toggle',
		];

		for (const testId of toggleIds) {
			const toggle = page.locator(`[data-testid="${testId}"]`);
			await expect(toggle).toBeVisible();
			await expect(toggle).toHaveAttribute('data-state', 'unchecked');
		}
	});

	test('no environment effect overlays visible by default', async ({ page }) => {
		await expect(page.locator('[data-testid="rain-overlay"]')).toHaveCount(0);
		await expect(page.locator('[data-testid="snow-overlay"]')).toHaveCount(0);
		await expect(page.locator('[data-testid="clouds-overlay"]')).toHaveCount(0);
		await expect(page.locator('[data-testid="lightning-overlay"]')).toHaveCount(0);
		await expect(page.locator('[data-testid="fireflies-overlay"]')).toHaveCount(0);
		await expect(page.locator('[data-testid="wind-overlay"]')).toHaveCount(0);
		await expect(page.locator('[data-testid="sun-rays-overlay"]')).toHaveCount(0);
	});

	test('toggling rain adds rain overlay with rain drops', async ({ page }) => {
		const rainToggle = page.locator('[data-testid="env-rain-toggle"]');
		await rainToggle.click();

		await expect(page.locator('[data-testid="rain-overlay"]')).toHaveCount(1);
		const drops = page.locator('[data-testid="rain-drop"]');
		await expect(drops.first()).toBeVisible();
		expect(await drops.count()).toBeGreaterThan(0);
	});

	test('rain intensity slider only visible when rain enabled', async ({ page }) => {
		// The rain-intensity slider (shadcn) should not exist when rain is off
		await expect(page.locator('#rain-intensity')).toHaveCount(0);

		const rainToggle = page.locator('[data-testid="env-rain-toggle"]');
		await rainToggle.click();

		await expect(page.locator('#rain-intensity')).toBeVisible();
	});

	test('changing rain intensity changes number of rain drops', async ({ page }) => {
		const rainToggle = page.locator('[data-testid="env-rain-toggle"]');
		await rainToggle.click();

		const slider = page.locator('#rain-intensity');
		await expect(slider).toBeVisible();

		// Default intensity = 50
		const defaultDropCount = await page.locator('[data-testid="rain-drop"]').count();

		// Increase intensity via keyboard — press End to go to max
		await slider.click();
		await page.keyboard.press('End');
		await page.waitForTimeout(300);

		const highDropCount = await page.locator('[data-testid="rain-drop"]').count();
		expect(highDropCount).toBeGreaterThan(defaultDropCount);
	});

	test('multiple effects can be enabled simultaneously', async ({ page }) => {
		await page.locator('[data-testid="env-rain-toggle"]').click();
		await page.locator('[data-testid="env-snow-toggle"]').click();
		await page.locator('[data-testid="env-clouds-toggle"]').click();

		await expect(page.locator('[data-testid="rain-overlay"]')).toHaveCount(1);
		await expect(page.locator('[data-testid="snow-overlay"]')).toHaveCount(1);
		await expect(page.locator('[data-testid="clouds-overlay"]')).toHaveCount(1);
	});

	test('environment overlay has pointer-events-none', async ({ page }) => {
		const overlay = page.locator('[data-testid="environment-overlay"]');
		await expect(overlay).toBeVisible();
		await expect(overlay).toHaveCSS('pointer-events', 'none');
	});

	test('toggling lightning adds lightning overlay', async ({ page }) => {
		await page.locator('[data-testid="env-lightning-toggle"]').click();
		await expect(page.locator('[data-testid="lightning-overlay"]')).toHaveCount(1);
	});

	test('toggling fireflies adds firefly elements', async ({ page }) => {
		await page.locator('[data-testid="env-fireflies-toggle"]').click();
		await expect(page.locator('[data-testid="fireflies-overlay"]')).toHaveCount(1);
		expect(await page.locator('[data-testid="firefly"]').count()).toBeGreaterThan(0);
	});

	test('toggling wind adds wind particle elements', async ({ page }) => {
		await page.locator('[data-testid="env-wind-toggle"]').click();
		await expect(page.locator('[data-testid="wind-overlay"]')).toHaveCount(1);
		expect(await page.locator('[data-testid="wind-particle"]').count()).toBeGreaterThan(0);
	});

	test('toggling sun rays adds sun rays overlay', async ({ page }) => {
		await page.locator('[data-testid="env-sun-rays-toggle"]').click();
		await expect(page.locator('[data-testid="sun-rays-overlay"]')).toHaveCount(1);
	});

	test('snow and rain are distinct and can coexist', async ({ page }) => {
		await page.locator('[data-testid="env-rain-toggle"]').click();
		await page.locator('[data-testid="env-snow-toggle"]').click();

		const rainDrops = page.locator('[data-testid="rain-drop"]');
		const snowParticles = page.locator('[data-testid="snow-particle"]');

		expect(await rainDrops.count()).toBeGreaterThan(0);
		expect(await snowParticles.count()).toBeGreaterThan(0);
	});
});
