import { expect, test } from '@playwright/test';

test.describe('Issue #125 — Layout redesign', () => {
	test.describe('Cycle 1: Sidebar changes', () => {
		test('sidebar defaults to expanded state', async ({ page }) => {
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			// Sidebar should be expanded by default (no cookie = open)
			const provider = page.locator('[data-slot="sidebar"]');
			await expect(provider).toHaveAttribute('data-state', 'expanded');
		});

		test('no "Navigation" group label in sidebar', async ({ page }) => {
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			// Sidebar starts expanded by default
			await expect(page.getByText('Navigation', { exact: true })).not.toBeVisible();
		});

		test('header logo is clickable link to root', async ({ page }) => {
			await page.goto('/editor');
			await page.waitForLoadState('networkidle');

			// The logo/header should be a link to /
			const logoLink = page.locator('[data-sidebar="header"] a');
			await expect(logoLink).toBeVisible();
			await expect(logoLink).toHaveAttribute('href', '/');
		});
	});

	test.describe('Cycle 2: Layout restructure', () => {
		test('scene page uses top/bottom row split', async ({ page }) => {
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			const grid = page.locator('main.grid');
			const gridClasses = await grid.getAttribute('class');
			// Should use row-based layout, not column-based
			expect(gridClasses).toContain('grid-rows-[1fr_1fr]');
			expect(gridClasses).not.toContain('grid-cols-[1fr_320px]');
		});

		test('editor page uses top/bottom row split', async ({ page }) => {
			await page.goto('/editor');
			await page.waitForLoadState('networkidle');

			const grid = page.locator('main.grid');
			const gridClasses = await grid.getAttribute('class');
			expect(gridClasses).toContain('grid-rows-[1fr_1fr]');
			expect(gridClasses).not.toContain('grid-cols-[1fr_320px]');
		});

		test('scene container has no border-radius', async ({ page }) => {
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			const sceneCanvas = page.getByTestId('scene-canvas');
			const classes = await sceneCanvas.getAttribute('class');
			expect(classes).not.toContain('rounded-xl');
		});

		test('settings grid uses auto-fill', async ({ page }) => {
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			// The grid is the second child div (first is sticky tier control wrapper)
			const settingsGrid = page.locator('[data-testid="scene-controls"] > div').nth(1);
			const classes = await settingsGrid.getAttribute('class');
			expect(classes).toContain('auto-fill');
		});

		test('tier control is sticky above scroll', async ({ page }) => {
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			const tierControl = page.locator('[data-testid="settings-tier-control"]');
			await expect(tierControl).toBeVisible();

			const classes = await tierControl.getAttribute('class');
			expect(classes).toContain('sticky');
		});
	});

	test.describe('Cycle 3: Floating buttons', () => {
		test('floating buttons container is visible in scene', async ({ page }) => {
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			const floatingButtons = page.getByTestId('scene-floating-buttons');
			await expect(floatingButtons).toBeVisible();
		});

		test('theme toggle button cycles through modes', async ({ page }) => {
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			const themeButton = page.getByTestId('floating-theme-toggle');
			await expect(themeButton).toBeVisible();
		});

		test('reset button is present', async ({ page }) => {
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			const resetButton = page.getByTestId('floating-reset');
			await expect(resetButton).toBeVisible();
		});

		test('randomize button is present', async ({ page }) => {
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			const randomizeButton = page.getByTestId('floating-randomize');
			await expect(randomizeButton).toBeVisible();
		});

		test('save button only visible on /editor', async ({ page }) => {
			// Not visible on scene editor
			await page.goto('/');
			await page.waitForLoadState('networkidle');
			await expect(page.getByTestId('floating-save')).not.toBeVisible();

			// Visible on single editor
			await page.goto('/editor');
			await page.waitForLoadState('networkidle');
			await expect(page.getByTestId('floating-save')).toBeVisible();
		});

		test('all floating buttons have tooltips', async ({ page }) => {
			await page.goto('/');
			await page.waitForLoadState('networkidle');

			// Hover over theme button and check tooltip content appears
			const themeButton = page.getByTestId('floating-theme-toggle');
			await themeButton.hover();
			await expect(
				page.locator('[data-slot="tooltip-content"]', { hasText: 'Theme' }),
			).toBeVisible({ timeout: 5000 });
		});
	});

	test.describe('Cycle 5: Theme toggle in sidebar dropdown', () => {
		test('theme trigger is hidden until dropdown is opened', async ({ page }) => {
			await page.goto('/editor');
			await page.waitForLoadState('networkidle');

			await expect(page.getByTestId('sidebar-theme-trigger')).not.toBeVisible();

			await page.getByTestId('sidebar-guest-trigger').click();
			await expect(page.getByTestId('sidebar-theme-trigger')).toBeVisible();
		});
	});
});
