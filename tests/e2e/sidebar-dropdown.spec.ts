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

	test('does not show standalone dark mode toggle in sidebar', async ({ page }) => {
		await page.goto('/editor');
		// DarkModeToggle used to render a button with aria-label "Toggle theme (...)"
		const themeToggle = page.locator('button[aria-label^="Toggle theme"]');
		await expect(themeToggle).not.toBeVisible();
	});
});
