import { expect, test } from '@playwright/test';

test.describe('app shell sidebar (anonymous)', () => {
	test('sidebar starts expanded by default on desktop (no cookie)', async ({ page }) => {
		await page.goto('/editor');
		const sidebar = page.locator('[data-slot="sidebar"]');
		await expect(sidebar).toHaveAttribute('data-state', 'expanded');
	});

	test('renders the sidebar with navigation links on /editor', async ({ page }) => {
		await page.goto('/editor');
		await expect(page.getByRole('link', { name: 'Single Editor' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Scene Editor' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Gallery' })).toBeVisible();
	});

	test('renders the sidebar on the landing page', async ({ page }) => {
		await page.goto('/');
		const sidebar = page.locator('[data-slot="sidebar"]');
		await expect(sidebar).toHaveAttribute('data-state', 'expanded');
	});

	test('nav link to Gallery redirects anonymous users to /auth', async ({ page }) => {
		await page.goto('/editor');
		await page.getByRole('link', { name: 'Gallery' }).click();
		await page.waitForURL(/\/auth/);
		await expect(page).toHaveURL(/\/auth/);
	});

	test('sidebar-toggle button no longer exists in the DOM', async ({ page }) => {
		await page.goto('/editor');
		await expect(page.getByTestId('sidebar-toggle')).toHaveCount(0);
	});

	test('sidebar uses offcanvas collapsible mode (visible when collapsed)', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');
		const sidebar = page.locator('[data-slot="sidebar"]');
		await expect(sidebar).toHaveAttribute('data-state', 'expanded');
		const trigger = page.getByTestId('desktop-sidebar-trigger');
		await expect(trigger).toBeVisible();
		await trigger.click();
		await expect(sidebar).toHaveAttribute('data-state', 'collapsed', { timeout: 5000 });
		await expect(sidebar).toHaveAttribute('data-collapsible', 'offcanvas');
	});

	test('desktop sidebar trigger is visible on desktop viewport', async ({ page }) => {
		await page.goto('/editor');
		await expect(page.getByTestId('desktop-sidebar-trigger')).toBeVisible();
	});

	test('floating save button in single editor is disabled for anonymous users', async ({
		page,
	}) => {
		await page.goto('/editor');
		const saveButton = page.getByTestId('floating-save');
		await expect(saveButton).toBeVisible();
		await expect(saveButton).toBeDisabled();
	});

	test('all tree editing controls are visible when signed out', async ({ page }) => {
		await page.goto('/editor');
		const cardTitle = (name: string) =>
			page.locator('[data-slot="card-title"]', { hasText: new RegExp(`^${name}$`) });
		await expect(cardTitle('Shape')).toBeVisible();
		await expect(cardTitle('Canopy')).toBeVisible();
		await expect(cardTitle('Trunk')).toBeVisible();
		await expect(cardTitle('Branches')).toBeVisible();
	});
});
