import { test, expect } from '@playwright/test';

test.describe('Scene: tree count slider + depth positioning (#35)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.evaluate(() => localStorage.setItem('settings-tier', '"intermediate"'));
		await page.reload();
		await page.waitForLoadState('networkidle');
	});

	test('tree count slider defaults to 10 and renders 10 trees', async ({ page }) => {
		const slider = page.locator('#tree-count');
		await expect(slider).toBeVisible();

		const thumb = slider.locator('[data-slot="slider-thumb"]');
		await expect(thumb).toHaveAttribute('aria-valuenow', '10');

		const trees = page.locator('[data-testid="scene-tree"]');
		await expect(trees).toHaveCount(10);
	});

	test('changing tree count slider updates rendered tree count', async ({ page }) => {
		const trees = page.locator('[data-testid="scene-tree"]');
		await expect(trees).toHaveCount(10);

		const thumb = page.locator('#tree-count [data-slot="slider-thumb"]');
		await thumb.click();
		for (let i = 0; i < 7; i++) {
			await page.keyboard.press('ArrowRight');
		}

		// Count should increase from default 10
		const count = await trees.count();
		expect(count).toBeGreaterThan(10);
	});

	test('depth spread slider exists and defaults to 0', async ({ page }) => {
		const slider = page.locator('#depth-spread');
		await expect(slider).toBeVisible();

		const thumb = slider.locator('[data-slot="slider-thumb"]');
		await expect(thumb).toHaveAttribute('aria-valuenow', '0');
	});

	test('deterministic — same seed produces same tree positions on reload', async ({ page }) => {
		const getPositions = async () => {
			const trees = page.locator('[data-testid="scene-tree"]');
			const count = await trees.count();
			const positions: string[] = [];
			for (let i = 0; i < count; i++) {
				const style = await trees.nth(i).getAttribute('style');
				positions.push(style ?? '');
			}
			return positions;
		};

		const firstLoad = await getPositions();
		expect(firstLoad.length).toBe(10);

		await page.reload();
		await page.waitForLoadState('networkidle');

		const secondLoad = await getPositions();
		expect(firstLoad).toEqual(secondLoad);
	});
});
