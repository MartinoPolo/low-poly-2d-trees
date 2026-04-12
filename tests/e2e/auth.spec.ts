import { expect, test } from '@playwright/test';

test.describe('/auth page', () => {
	test('renders heading and explainer copy', async ({ page }) => {
		await page.goto('/auth');
		await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
		await expect(
			page.getByText(/Continue with a social account, passkey, or email/i),
		).toBeVisible();
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

	test('renders email/password form with sign-in/sign-up toggle', async ({ page }) => {
		await page.goto('/auth');
		await expect(page.getByTestId('auth-email')).toBeVisible();
		await expect(page.getByTestId('auth-password')).toBeVisible();
		await expect(page.getByTestId('auth-email-submit')).toBeVisible();

		// Toggle to sign-up mode
		await page.getByTestId('auth-toggle-mode').click();
		await expect(page.getByRole('heading', { name: 'Sign up' })).toBeVisible();
		await expect(page.getByTestId('auth-name')).toBeVisible();
		await expect(page.getByTestId('auth-confirm-password')).toBeVisible();

		// Toggle back to sign-in mode
		await page.getByTestId('auth-toggle-mode').click();
		await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
	});
});
