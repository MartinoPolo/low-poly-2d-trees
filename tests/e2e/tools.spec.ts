import { expect, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Scene page (/) — tool accessories controls
// ---------------------------------------------------------------------------

test.describe('Scene page tool accessories', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
	});

	test('has Tools & Accessories section with 4 tool checkboxes and animate toggle', async ({
		page,
	}) => {
		await expect(page.locator('[data-testid="tool-shovel-visible"]')).toBeVisible();
		await expect(page.locator('[data-testid="tool-ladder-visible"]')).toBeVisible();
		await expect(page.locator('[data-testid="tool-wateringCan-visible"]')).toBeVisible();
		await expect(page.locator('[data-testid="tool-birdNest-visible"]')).toBeVisible();
		await expect(page.locator('[data-testid="animate-tools"]')).toBeVisible();
	});

	test('checking shovel makes shovel SVG group appear', async ({ page }) => {
		// Initially no tool groups
		await expect(page.locator('[data-tool="shovel"]')).toHaveCount(0);

		// Check shovel
		await page.locator('[data-testid="tool-shovel-visible"]').click();

		// Shovel groups should appear (one per tree in scene)
		const shovelGroups = page.locator('[data-tool="shovel"]');
		await expect(shovelGroups.first()).toBeVisible();
	});

	test('unchecking shovel hides shovel SVG group', async ({ page }) => {
		// Enable then disable
		await page.locator('[data-testid="tool-shovel-visible"]').click();
		await expect(page.locator('[data-tool="shovel"]').first()).toBeVisible();

		await page.locator('[data-testid="tool-shovel-visible"]').click();
		await expect(page.locator('[data-tool="shovel"]')).toHaveCount(0);
	});

	test('tools toggle independently', async ({ page }) => {
		// Enable shovel and bird nest
		await page.locator('[data-testid="tool-shovel-visible"]').click();
		await page.locator('[data-testid="tool-birdNest-visible"]').click();

		await expect(page.locator('[data-tool="shovel"]').first()).toBeVisible();
		await expect(page.locator('[data-tool="birdNest"]').first()).toBeVisible();
		await expect(page.locator('[data-tool="ladder"]')).toHaveCount(0);
		await expect(page.locator('[data-tool="wateringCan"]')).toHaveCount(0);
	});

	test('animate tools checkbox toggles animation class', async ({ page }) => {
		// Enable a tool first
		await page.locator('[data-testid="tool-shovel-visible"]').click();
		// Animation class is on the inner <g> child of [data-tool]
		const animGroup = page.locator('[data-tool="shovel"] > .tool-anim').first();
		await expect(animGroup).not.toHaveClass(/animate-tool/);

		// Enable animation
		await page.locator('[data-testid="animate-tools"]').click();
		await expect(animGroup).toHaveClass(/animate-tool/);

		// Disable animation
		await page.locator('[data-testid="animate-tools"]').click();
		await expect(animGroup).not.toHaveClass(/animate-tool/);
	});

	test('size slider appears when tool is visible and changes scale', async ({ page }) => {
		// Size slider not visible initially
		await expect(page.locator('#tool-shovel-size')).toHaveCount(0);

		// Enable shovel
		await page.locator('[data-testid="tool-shovel-visible"]').click();

		// Size slider (shadcn) should appear
		const sizeSlider = page.locator('#tool-shovel-size');
		await expect(sizeSlider).toBeVisible();

		// Get initial scale
		const toolGroup = page.locator('[data-tool="shovel"]').first();
		const initialTransform = await toolGroup.getAttribute('transform');
		expect(initialTransform).toContain('scale(1)');

		// Change size to max via keyboard (End key) — click thumb first for focus
		const thumb = sizeSlider.locator('[data-slot="slider-thumb"]');
		await thumb.click();
		await page.keyboard.press('End');
		await page.waitForTimeout(300);

		const updatedTransform = await toolGroup.getAttribute('transform');
		expect(updatedTransform).toContain('scale(2)');
	});
});

// ---------------------------------------------------------------------------
// Editor page (/editor) — tool accessories controls
// ---------------------------------------------------------------------------

test.describe('Editor page tool accessories', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/editor', { waitUntil: 'networkidle' });
	});

	test('has Tools & Accessories section with 4 tool checkboxes', async ({ page }) => {
		await expect(page.locator('[data-testid="tool-shovel-visible"]')).toBeVisible();
		await expect(page.locator('[data-testid="tool-ladder-visible"]')).toBeVisible();
		await expect(page.locator('[data-testid="tool-wateringCan-visible"]')).toBeVisible();
		await expect(page.locator('[data-testid="tool-birdNest-visible"]')).toBeVisible();
		await expect(page.locator('[data-testid="animate-tools"]')).toBeVisible();
	});

	test('checking ladder makes ladder SVG group appear', async ({ page }) => {
		await expect(page.locator('[data-tool="ladder"]')).toHaveCount(0);
		await page.locator('[data-testid="tool-ladder-visible"]').click();
		await expect(page.locator('[data-tool="ladder"]')).toBeVisible();
	});

	test('animate tools toggles animation class on editor tree', async ({ page }) => {
		await page.locator('[data-testid="tool-wateringCan-visible"]').click();
		const animGroup = page.locator('[data-tool="wateringCan"] > .tool-anim');
		await expect(animGroup).not.toHaveClass(/animate-tool/);

		await page.locator('[data-testid="animate-tools"]').click();
		await expect(animGroup).toHaveClass(/animate-tool/);
	});

	test('all 4 tools can be enabled simultaneously', async ({ page }) => {
		await page.locator('[data-testid="tool-shovel-visible"]').click();
		await page.locator('[data-testid="tool-ladder-visible"]').click();
		await page.locator('[data-testid="tool-wateringCan-visible"]').click();
		await page.locator('[data-testid="tool-birdNest-visible"]').click();

		await expect(page.locator('[data-tool="shovel"]')).toBeVisible();
		await expect(page.locator('[data-tool="ladder"]')).toBeVisible();
		await expect(page.locator('[data-tool="wateringCan"]')).toBeVisible();
		await expect(page.locator('[data-tool="birdNest"]')).toBeVisible();
	});
});
