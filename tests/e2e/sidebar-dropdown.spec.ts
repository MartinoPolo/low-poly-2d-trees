import { expect, test } from '@playwright/test';

test.describe('sidebar user dropdown (anonymous)', () => {
	test('does not show user dropdown trigger when anonymous', async ({ page }) => {
		await page.goto('/editor');
		await expect(page.getByTestId('sidebar-user-trigger')).not.toBeVisible();
	});

	test('shows sign-in button when anonymous', async ({ page }) => {
		await page.goto('/editor');
		await expect(page.getByTestId('sidebar-sign-in')).toBeVisible();
	});

	test('shows theme switcher in sidebar when anonymous', async ({ page }) => {
		await page.goto('/editor');
		await expect(page.getByTestId('sidebar-theme-trigger')).toBeVisible();
	});
});
