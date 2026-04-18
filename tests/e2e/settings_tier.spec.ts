import { test, expect } from '@playwright/test';

test.describe('Issue #84 — 3-tier settings control', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/editor');
		await page.evaluate(() => localStorage.removeItem('settings-tier'));
		await page.reload();
		await page.waitForLoadState('networkidle');
	});

	test('tier control renders with 3 segments', async ({ page }) => {
		const control = page.locator('[data-testid="settings-tier-control"]');
		await expect(control).toBeVisible();

		const items = control.locator('[data-slot="toggle-group-item"]');
		await expect(items).toHaveCount(3);

		await expect(items.nth(0)).toContainText('basic');
		await expect(items.nth(1)).toContainText('intermediate');
		await expect(items.nth(2)).toContainText('advanced');
	});

	test('default tier is basic — basic controls visible, intermediate hidden', async ({
		page,
	}) => {
		// Basic: Trunk Height always visible
		await expect(page.locator('text=Trunk Height')).toBeVisible();

		// Intermediate: Branch Angle hidden at basic
		await expect(page.locator('#slider-branch-angle')).not.toBeVisible();

		// Advanced: Polygons Per Blob hidden at basic
		await expect(page.locator('text=Polygons Per Blob')).not.toBeVisible();
	});

	test('switching to intermediate shows intermediate controls', async ({ page }) => {
		const control = page.locator('[data-testid="settings-tier-control"]');
		const intermediateButton = control.locator('[data-slot="toggle-group-item"]').nth(1);
		await intermediateButton.click();

		// Branch Angle visible at intermediate
		await expect(page.locator('#slider-branch-angle')).toBeVisible();

		// Lighting card visible at intermediate
		await expect(page.locator('text=Light Angle')).toBeVisible();

		// Advanced: Polygons Per Blob still hidden
		await expect(page.locator('text=Polygons Per Blob')).not.toBeVisible();
	});

	test('switching to advanced shows all controls', async ({ page }) => {
		const control = page.locator('[data-testid="settings-tier-control"]');
		const advancedButton = control.locator('[data-slot="toggle-group-item"]').nth(2);
		await advancedButton.click();

		// All tiers visible
		await expect(page.locator('text=Trunk Height')).toBeVisible();
		await expect(page.locator('#slider-branch-angle')).toBeVisible();
		await expect(page.locator('text=Polygons Per Blob')).toBeVisible();
		await expect(page.locator('text=Trunk Lean')).toBeVisible();
		await expect(page.locator('text=Depth Variance')).toBeVisible();
	});

	test('tier persists across page reload', async ({ page }) => {
		// Switch to advanced
		const control = page.locator('[data-testid="settings-tier-control"]');
		await control.locator('[data-slot="toggle-group-item"]').nth(2).click();

		// Verify advanced is active
		await expect(page.locator('text=Polygons Per Blob')).toBeVisible();

		// Reload and verify persistence
		await page.reload();
		await page.waitForLoadState('networkidle');

		await expect(page.locator('text=Polygons Per Blob')).toBeVisible();
	});

	test('tier persists across navigation between editors', async ({ page }) => {
		// Switch to intermediate on /editor
		const control = page.locator('[data-testid="settings-tier-control"]');
		await control.locator('[data-slot="toggle-group-item"]').nth(1).click();

		// Navigate to scene editor
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Scene editor should also show intermediate tier control
		const sceneControl = page.locator('[data-testid="settings-tier-control"]');
		await expect(sceneControl).toBeVisible();

		// Intermediate-tier controls should be visible (Lighting card)
		await expect(page.locator('text=Light Angle')).toBeVisible();
	});

	test('single editor layout is flipped — preview left, controls right', async ({ page }) => {
		const grid = page.locator('main > div');
		const gridClasses = await grid.getAttribute('class');
		expect(gridClasses).toContain('grid-cols-[1fr_320px]');
	});

	test('debug card is always visible regardless of tier', async ({ page }) => {
		// Default basic tier — Debug should be visible
		await expect(page.locator('text=Debug').first()).toBeVisible();
		await expect(page.locator('text=Show Canopy').first()).toBeVisible();
	});

	test('scene editor tier control is present', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const control = page.locator('[data-testid="settings-tier-control"]');
		await expect(control).toBeVisible();
	});

	test('scene editor basic tier shows canopy size, hides lighting', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Basic: Canopy Size visible
		await expect(page.locator('text=Canopy Size').first()).toBeVisible();

		// Intermediate: Lighting card hidden at basic
		await expect(page.locator('text=Light Angle')).not.toBeVisible();
	});
});
