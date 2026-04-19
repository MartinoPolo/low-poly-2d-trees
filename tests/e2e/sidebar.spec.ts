import { expect, test } from '@playwright/test';

test.describe('app shell sidebar (anonymous)', () => {
	test('renders the sidebar with navigation links and a sign-in button on /editor', async ({
		page,
	}) => {
		await page.goto('/editor');

		// Sidebar is collapsed by default — expand it first
		await page.keyboard.press('Control+b');
		await page.waitForTimeout(300);

		await expect(page.getByRole('link', { name: 'Single Editor' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Scene Editor' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Gallery' })).toBeVisible();
		await expect(page.getByTestId('sidebar-sign-in')).toBeVisible();
	});

	test('renders the sidebar on the landing page', async ({ page }) => {
		await page.goto('/');
		// Sidebar is collapsed by default — expand it first
		await page.keyboard.press('Control+b');
		await page.waitForTimeout(300);
		await expect(page.getByTestId('sidebar-sign-in')).toBeVisible();
	});

	test('nav link to Gallery redirects anonymous users to /auth', async ({ page }) => {
		await page.goto('/editor');
		// Sidebar is collapsed by default — expand it first
		await page.keyboard.press('Control+b');
		await page.waitForTimeout(300);
		await page.getByRole('link', { name: 'Gallery' }).click();
		await page.waitForURL(/\/auth/);
		await expect(page).toHaveURL(/\/auth/);
	});

	test('save button in single editor is disabled for anonymous users', async ({ page }) => {
		await page.goto('/editor');
		const saveButton = page.getByTestId('save-tree-button');
		await expect(saveButton).toBeVisible();
		await expect(saveButton).toBeDisabled();
		await expect(saveButton).toHaveText(/Sign in to save/i);
	});

	test('all tree editing controls are visible when signed out', async ({ page }) => {
		await page.goto('/editor');
		const cardTitle = (name: string) =>
			page.locator('[data-slot="card-title"]', { hasText: name });
		await expect(cardTitle('Shape')).toBeVisible();
		await expect(cardTitle('Geometry')).toBeVisible();
		await expect(cardTitle('Trunk')).toBeVisible();
		await expect(cardTitle('Branches')).toBeVisible();
	});
});
