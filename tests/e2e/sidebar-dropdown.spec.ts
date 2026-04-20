import { expect, test } from '@playwright/test';

test.describe('sidebar user dropdown (anonymous)', () => {
	test('does not show user dropdown trigger when anonymous', async ({ page }) => {
		await page.goto('/editor');
		await expect(page.getByTestId('sidebar-user-trigger')).not.toBeVisible();
	});

	test('shows guest dropdown trigger when anonymous', async ({ page }) => {
		await page.goto('/editor');
		await expect(page.getByTestId('sidebar-guest-trigger')).toBeVisible();
	});

	test('guest dropdown contains theme submenu and sign-in', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');
		await page.getByTestId('sidebar-guest-trigger').click();
		await expect(page.getByTestId('sidebar-theme-trigger')).toBeVisible({ timeout: 10000 });
		await expect(page.getByTestId('sidebar-dropdown-sign-in')).toBeVisible();
	});

	test('theme submenu contains Light, Dark, System radio items', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');
		await page.getByTestId('sidebar-guest-trigger').click();
		await expect(page.getByTestId('sidebar-theme-trigger')).toBeVisible({ timeout: 10000 });
		await page.getByTestId('sidebar-theme-trigger').click();
		await expect(page.getByRole('menuitemradio', { name: 'Light' })).toBeVisible();
		await expect(page.getByRole('menuitemradio', { name: 'Dark' })).toBeVisible();
		await expect(page.getByRole('menuitemradio', { name: 'System' })).toBeVisible();
	});
});
