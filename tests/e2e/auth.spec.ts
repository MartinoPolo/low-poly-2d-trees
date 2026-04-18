import { expect, test } from '@playwright/test';

test.describe('/auth/sign-in page', () => {
	test('renders heading, description, and 3 social buttons', async ({ page }) => {
		await page.goto('/auth/sign-in');
		await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
		await expect(
			page.getByText(/Continue with a social account, passkey, or email/i),
		).toBeVisible();
		await expect(page.getByTestId('sign-in-google')).toBeVisible();
		await expect(page.getByTestId('sign-in-github')).toBeVisible();
		await expect(page.getByTestId('sign-in-passkey')).toBeVisible();
	});

	test('renders email and password form with submit button', async ({ page }) => {
		await page.goto('/auth/sign-in');
		await expect(page.getByTestId('auth-email')).toBeVisible();
		await expect(page.getByTestId('auth-password')).toBeVisible();
		await expect(page.getByTestId('auth-email-submit')).toBeVisible();
	});

	test('has cross-link to sign-up page', async ({ page }) => {
		await page.goto('/auth/sign-in');
		const crossLink = page.getByTestId('auth-cross-link');
		await expect(crossLink).toBeVisible();
		await expect(crossLink).toHaveText(/Sign up/);
		await crossLink.click();
		await expect(page).toHaveURL(/\/auth\/sign-up$/);
	});
});

test.describe('/auth/sign-up page', () => {
	test('renders heading, description, and 2 social buttons (no passkey)', async ({ page }) => {
		await page.goto('/auth/sign-up');
		await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible();
		await expect(page.getByText(/Create your account to get started/i)).toBeVisible();
		await expect(page.getByTestId('sign-up-google')).toBeVisible();
		await expect(page.getByTestId('sign-up-github')).toBeVisible();
		await expect(page.getByTestId('sign-in-passkey')).toHaveCount(0);
	});

	test('renders name, email, password, confirm password form with submit', async ({ page }) => {
		await page.goto('/auth/sign-up');
		await expect(page.getByTestId('auth-name')).toBeVisible();
		await expect(page.getByTestId('auth-email')).toBeVisible();
		await expect(page.getByTestId('auth-password')).toBeVisible();
		await expect(page.getByTestId('auth-confirm-password')).toBeVisible();
		await expect(page.getByTestId('auth-email-submit')).toBeVisible();
	});

	test('has cross-link to sign-in page', async ({ page }) => {
		await page.goto('/auth/sign-up');
		const crossLink = page.getByTestId('auth-cross-link');
		await expect(crossLink).toBeVisible();
		await expect(crossLink).toHaveText(/Sign in/);
		await crossLink.click();
		await expect(page).toHaveURL(/\/auth\/sign-in$/);
	});

	test('shows password mismatch error', async ({ page }) => {
		await page.goto('/auth/sign-up', { waitUntil: 'networkidle' });
		await page.getByTestId('auth-name').fill('Test User');
		await page.getByTestId('auth-email').fill('test@example.com');
		await page.getByTestId('auth-password').fill('password123');
		await page.getByTestId('auth-confirm-password').fill('differentpassword');
		await page.getByTestId('auth-email-submit').click();
		await expect(page.getByRole('alert')).toContainText('Passwords do not match');
	});
});

test.describe('/auth route', () => {
	test('old /auth route returns 404', async ({ page }) => {
		const response = await page.goto('/auth');
		expect(response?.status()).toBe(404);
	});
});
