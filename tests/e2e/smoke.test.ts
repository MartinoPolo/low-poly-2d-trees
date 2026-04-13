import { expect, test, type Page } from '@playwright/test';

test('homepage loads', async ({ page }) => {
	const response = await page.goto('/');
	expect(response?.status()).toBe(200);
});

/** Helper: select a fruit type from the Growables card dropdown. */
async function selectFruitType(page: Page, fruitName: string) {
	// Scope to the Growables card via data-slot, then find the select trigger inside it.
	const growablesCard = page
		.getByText('Growables')
		.locator('xpath=ancestor::*[@data-slot="card"]');
	const fruitTypeTrigger = growablesCard.locator('[data-slot="select-trigger"]');
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

		// Fruit count slider (shadcn) — auto-generated ID from label "Fruit Count"
		const fruitCountSlider = page.locator('#slider-fruit-count');
		await expect(fruitCountSlider).toHaveAttribute('data-disabled', '');

		await selectFruitType(page, 'Apple');

		// After selecting Apple, the fruit count slider should be enabled (no data-disabled)
		await expect(fruitCountSlider).not.toHaveAttribute('data-disabled', '');
	});

	test('setting fruit count > 0 with Apple renders fruit polygons', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		await selectFruitType(page, 'Apple');

		// Set fruit count via keyboard on the shadcn slider
		const fruitCountSlider = page.locator('#slider-fruit-count');
		await fruitCountSlider.locator('[data-slot="slider-thumb"]').click();
		// Press ArrowRight multiple times to increase value to ~5
		for (let i = 0; i < 5; i++) {
			await page.keyboard.press('ArrowRight');
		}
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

		// Increase fruit count via keyboard
		const fruitCountSlider = page.locator('#slider-fruit-count');
		await fruitCountSlider.locator('[data-slot="slider-thumb"]').click();
		for (let i = 0; i < 5; i++) {
			await page.keyboard.press('ArrowRight');
		}
		await page.waitForTimeout(300);

		// Verify fruit is shown
		const fruitPolygons = page.locator('svg .fruit polygon');
		expect(await fruitPolygons.count()).toBeGreaterThan(0);

		// Set count to 0 — press Home key to go to min value
		await fruitCountSlider.locator('[data-slot="slider-thumb"]').click();
		await page.keyboard.press('Home');
		await page.waitForTimeout(300);

		// Fruit polygons should be gone
		expect(await page.locator('svg .fruit polygon').count()).toBe(0);
	});
});
