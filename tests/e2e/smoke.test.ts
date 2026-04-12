import { expect, test, type Page } from '@playwright/test';

test('homepage loads', async ({ page }) => {
	const response = await page.goto('/');
	expect(response?.status()).toBe(200);
});

/** Helper: select a fruit type from the Growables card dropdown. */
async function selectFruitType(page: Page, fruitName: string) {
	// The Fruit Type select trigger is the second [data-slot="select-trigger"] on the page.
	// First is Tree Type.
	const fruitTypeTrigger = page.locator('[data-slot="select-trigger"]').nth(1);
	await fruitTypeTrigger.click();
	await page.waitForTimeout(300);

	// The listbox is portalled to the body root; use getByRole to find the option.
	await page.getByRole('option', { name: fruitName, exact: true }).click();
	await page.waitForTimeout(300);
}

test.describe('Growables card', () => {
	test('editor page has Growables card with fruit type dropdown and fruit count slider', async ({
		page,
	}) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');
		await expect(page.getByText('Growables')).toBeVisible();
		await expect(page.getByText('Fruit Type')).toBeVisible();
		await expect(page.getByText('Fruit Count')).toBeVisible();
	});

	test('changing fruit type from None to Apple enables the count slider', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		// Fruit count slider should be disabled initially (fruitType defaults to none)
		const fruitCountSlider = page.locator('#range-fruit-count');
		await expect(fruitCountSlider).toBeDisabled();

		await selectFruitType(page, 'Apple');

		// After selecting Apple, the fruit count slider should be enabled
		await expect(fruitCountSlider).toBeEnabled();
	});

	test('setting fruit count > 0 with Apple renders fruit polygons', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		await selectFruitType(page, 'Apple');

		// Set fruit count to 5 via the slider
		const fruitCountSlider = page.locator('#range-fruit-count');
		await fruitCountSlider.fill('5');
		await page.waitForTimeout(300);

		// Check SVG has a .fruit group with children
		const fruitGroup = page.locator('svg .fruit');
		await expect(fruitGroup).toBeVisible();
		const fruitPolygons = fruitGroup.locator('polygon');
		expect(await fruitPolygons.count()).toBeGreaterThan(0);
	});

	test('setting fruit count to 0 removes fruit polygons', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		await selectFruitType(page, 'Apple');

		const fruitCountSlider = page.locator('#range-fruit-count');
		await fruitCountSlider.fill('5');
		await page.waitForTimeout(300);

		// Verify fruit is shown
		const fruitPolygons = page.locator('svg .fruit polygon');
		expect(await fruitPolygons.count()).toBeGreaterThan(0);

		// Set count to 0
		await fruitCountSlider.fill('0');
		await page.waitForTimeout(300);

		// Fruit polygons should be gone
		expect(await page.locator('svg .fruit polygon').count()).toBe(0);
	});
});
