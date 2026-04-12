import { test, expect } from '@playwright/test';

test.describe('Scene: tree count slider + depth positioning (#35)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
	});

	test('tree count slider defaults to 3 and renders 3 trees', async ({ page }) => {
		const slider = page.locator('#tree-count');
		await expect(slider).toBeVisible();
		await expect(slider).toHaveValue('3');

		const trees = page.locator('[data-testid="scene-tree"]');
		await expect(trees).toHaveCount(3);
	});

	test('changing tree count slider updates rendered tree count', async ({ page }) => {
		const slider = page.locator('#tree-count');
		await slider.fill('10');
		await slider.dispatchEvent('input');

		const trees = page.locator('[data-testid="scene-tree"]');
		await expect(trees).toHaveCount(10);
	});

	test('depth spread slider exists and defaults to 0', async ({ page }) => {
		const slider = page.locator('#depth-spread');
		await expect(slider).toBeVisible();
		await expect(slider).toHaveValue('0');
	});

	test('deterministic — same seed produces same tree positions on reload', async ({ page }) => {
		const slider = page.locator('#tree-count');
		await slider.fill('5');
		await slider.dispatchEvent('input');

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

		await page.reload();
		await page.waitForLoadState('networkidle');

		// After reload, set tree count to 5 again
		const sliderReloaded = page.locator('#tree-count');
		await sliderReloaded.fill('5');
		await sliderReloaded.dispatchEvent('input');

		const secondLoad = await getPositions();
		expect(firstLoad).toEqual(secondLoad);
	});
});
