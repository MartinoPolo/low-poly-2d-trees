import { expect, test } from '@playwright/test';

test.describe('sidebar user dropdown (anonymous)', () => {
	test('does not show user dropdown trigger when anonymous', async ({ page }) => {
		await page.goto('/editor');
		await expect(page.getByTestId('sidebar-user-trigger')).not.toBeVisible();
	});

	test('shows sign-in button when anonymous', async ({ page }) => {
		await page.goto('/editor');
		// Sidebar is collapsed by default — expand it first
		await page.keyboard.press('Control+b');
		await page.waitForTimeout(300);
		await expect(page.getByTestId('sidebar-sign-in')).toBeVisible();
	});

	test('theme switcher is in floating buttons, not sidebar', async ({ page }) => {
		await page.goto('/editor');
		await expect(page.getByTestId('sidebar-theme-trigger')).not.toBeVisible();
		await expect(page.getByTestId('floating-theme-toggle')).toBeVisible();
	});
});
