import { expect, test } from '@playwright/test';

test.describe('/auth page', () => {
	test('renders heading and explainer copy', async ({ page }) => {
		await page.goto('/auth');
		await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
		await expect(page.getByText(/Continue with Google, GitHub, or a passkey/i)).toBeVisible();
	});

	test('renders all three provider buttons', async ({ page }) => {
		await page.goto('/auth');
		await expect(page.getByTestId('sign-in-google')).toBeVisible();
		await expect(page.getByTestId('sign-in-github')).toBeVisible();
		await expect(page.getByTestId('sign-in-passkey')).toBeVisible();
		await expect(page.getByTestId('sign-in-google')).toHaveText(/Continue with Google/);
		await expect(page.getByTestId('sign-in-github')).toHaveText(/Continue with GitHub/);
		await expect(page.getByTestId('sign-in-passkey')).toHaveText(/Continue with Passkey/);
	});
});
