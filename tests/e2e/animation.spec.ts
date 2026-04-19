import { expect, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Scene page (/) — animation controls
// ---------------------------------------------------------------------------

test.describe('Scene page animation controls', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
		// Wait for hydration: animation controls must be interactive
		await expect(page.locator('[data-testid="animation-controls"]')).toBeVisible();
	});

	test('has animation controls section with three checkboxes', async ({ page }) => {
		await expect(page.locator('[data-testid="animate-canopy-sway"]')).toBeVisible();
		await expect(page.locator('[data-testid="animate-branches"]')).toBeVisible();
		await expect(page.locator('[data-testid="animate-growth"]')).toBeVisible();
	});

	test('canopy sway checkbox toggles animation on canopy blobs', async ({ page }) => {
		// Verify SVG canopy group elements exist
		const svg = page.locator('svg').first();
		await expect(svg).toBeAttached();

		// Check the canopy sway checkbox
		await page.locator('[data-testid="animate-canopy-sway"]').click();

		// After: canopy blob elements should have animation CSS applied
		const canopyBlob = page.locator('.canopy-blob').first();
		await expect(canopyBlob).toHaveClass(/animate-canopy-sway/);

		// Uncheck
		await page.locator('[data-testid="animate-canopy-sway"]').click();
		await expect(canopyBlob).not.toHaveClass(/animate-canopy-sway/);
	});

	test('branch movement checkbox toggles animation on branch groups', async ({ page }) => {
		// Click branch movement checkbox
		await page.locator('[data-testid="animate-branches"]').click();

		// Branch groups may not exist for all shapes; check if any appear
		const branchGroupCount = await page.locator('.branch-group').count();
		if (branchGroupCount === 0) {
			return;
		}

		const branchGroup = page.locator('.branch-group').first();
		await expect(branchGroup).toHaveClass(/animate-branch-sway/);

		// Uncheck
		await page.locator('[data-testid="animate-branches"]').click();
		await expect(branchGroup).not.toHaveClass(/animate-branch-sway/);
	});

	test('growth checkbox toggles animation on branch groups and canopy blobs', async ({
		page,
	}) => {
		await page.locator('[data-testid="animate-growth"]').click();

		const branchGroupCount = await page.locator('.branch-group').count();
		if (branchGroupCount > 0) {
			const branchGroup = page.locator('.branch-group').first();
			await expect(branchGroup).toHaveClass(/animate-branch-growth/);
		}

		const canopyBlob = page.locator('.canopy-blob').first();
		await expect(canopyBlob).toHaveClass(/animate-canopy-pulse/);

		await page.locator('[data-testid="animate-growth"]').click();

		if (branchGroupCount > 0) {
			const branchGroup = page.locator('.branch-group').first();
			await expect(branchGroup).not.toHaveClass(/animate-branch-growth/);
		}
		await expect(canopyBlob).not.toHaveClass(/animate-canopy-pulse/);
	});

	test('multiple animations can be enabled simultaneously', async ({ page }) => {
		await page.locator('[data-testid="animate-canopy-sway"]').click();
		await page.locator('[data-testid="animate-growth"]').click();

		const canopyBlob = page.locator('.canopy-blob').first();
		await expect(canopyBlob).toHaveClass(/animate-canopy-sway/);
		await expect(canopyBlob).toHaveClass(/animate-canopy-pulse/);
	});
});

// ---------------------------------------------------------------------------
// Editor page (/editor) — animation controls
// ---------------------------------------------------------------------------

test.describe('Editor page animation controls', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/editor', { waitUntil: 'networkidle' });
		await expect(page.locator('[data-testid="animation-controls"]')).toBeVisible();
	});

	test('has animation controls section with three checkboxes', async ({ page }) => {
		await expect(page.locator('[data-testid="animate-canopy-sway"]')).toBeVisible();
		await expect(page.locator('[data-testid="animate-branches"]')).toBeVisible();
		await expect(page.locator('[data-testid="animate-growth"]')).toBeVisible();
	});

	test('canopy sway checkbox toggles animation on canopy blobs', async ({ page }) => {
		// Click the checkbox first, then check the class
		await page.locator('[data-testid="animate-canopy-sway"]').click();

		const canopyBlob = page.locator('.canopy-blob').first();
		await expect(canopyBlob).toHaveClass(/animate-canopy-sway/);
	});

	test('growth checkbox toggles animation on canopy blobs', async ({ page }) => {
		await page.locator('[data-testid="animate-growth"]').click();

		const canopyBlob = page.locator('.canopy-blob').first();
		await expect(canopyBlob).toHaveClass(/animate-canopy-pulse/);
	});
});
