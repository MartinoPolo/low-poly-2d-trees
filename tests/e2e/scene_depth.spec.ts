import { test, expect } from '@playwright/test';

test.describe('Scene: tree count slider + depth positioning (#35)', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
	});

	test('tree count slider defaults to 3 and renders 3 trees', async ({ page }) => {
		const slider = page.locator('#tree-count');
		await expect(slider).toBeVisible();

		// shadcn slider: read default value from the thumb's aria-valuenow
		const thumb = slider.locator('[data-slot="slider-thumb"]');
		await expect(thumb).toHaveAttribute('aria-valuenow', '3');

		const trees = page.locator('[data-testid="scene-tree"]');
		await expect(trees).toHaveCount(3);
	});

	test('changing tree count slider updates rendered tree count', async ({ page }) => {
		const slider = page.locator('#tree-count');
		await slider.click();
		// Press End to go to max, then use ArrowLeft to go back to 10
		// Max is likely high, so use ArrowRight from default (3) to reach 10
		for (let i = 0; i < 7; i++) {
			await page.keyboard.press('ArrowRight');
		}

		const trees = page.locator('[data-testid="scene-tree"]');
		await expect(trees).toHaveCount(10);
	});

	test('depth spread slider exists and defaults to 0', async ({ page }) => {
		const slider = page.locator('#depth-spread');
		await expect(slider).toBeVisible();

		const thumb = slider.locator('[data-slot="slider-thumb"]');
		await expect(thumb).toHaveAttribute('aria-valuenow', '0');
	});

	test('deterministic — same seed produces same tree positions on reload', async ({ page }) => {
		const slider = page.locator('#tree-count');
		await slider.click();
		// Increase from default 3 to 5
		for (let i = 0; i < 2; i++) {
			await page.keyboard.press('ArrowRight');
		}

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
		await sliderReloaded.click();
		for (let i = 0; i < 2; i++) {
			await page.keyboard.press('ArrowRight');
		}

		const secondLoad = await getPositions();
		expect(firstLoad).toEqual(secondLoad);
	});
});
