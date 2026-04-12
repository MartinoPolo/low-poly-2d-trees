import { expect, test } from '@playwright/test';

test.describe('app shell sidebar (anonymous)', () => {
	test('renders the sidebar with navigation links and a sign-in button on /editor', async ({
		page,
	}) => {
		await page.goto('/editor');

		await expect(page.getByRole('link', { name: 'Single Editor' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Scene Editor' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Gallery' })).toBeVisible();
		await expect(page.getByTestId('sidebar-sign-in')).toBeVisible();
	});

	test('renders the sidebar on the landing page', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByTestId('sidebar-sign-in')).toBeVisible();
	});

	test('nav link to Gallery redirects anonymous users to /auth', async ({ page }) => {
		await page.goto('/editor');
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
});
