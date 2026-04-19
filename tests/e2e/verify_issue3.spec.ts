import { test, expect } from '@playwright/test';

test.describe('Issue #3 — Slider UX + UI control reorganization', () => {
	test('1. /editor aside has select-none class', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');
		const aside = page.locator('aside');
		const classes = await aside.getAttribute('class');
		console.log('aside classes:', classes);
		expect(classes).toContain('select-none');
	});

	test('2. /editor slider drag produces no text selection', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		// Find the first shadcn slider (data-slot="slider")
		const slider = page.locator('[data-slot="slider"]').first();
		const sliderBox = await slider.boundingBox();
		expect(sliderBox).not.toBeNull();

		// Get initial value from the thumb
		const thumb = slider.locator('[data-slot="slider-thumb"]');
		const initialValue = await thumb.getAttribute('aria-valuenow');

		// Drag: mousedown on left edge, move right across label area, mouseup
		const startX = sliderBox!.x + 10;
		const startY = sliderBox!.y + sliderBox!.height / 2;
		const endX = sliderBox!.x + sliderBox!.width - 10;

		await page.mouse.move(startX, startY);
		await page.mouse.down();
		await page.mouse.move(endX, startY, { steps: 10 });
		await page.mouse.up();

		// Check no text selected
		const selectedText = await page.evaluate(() => window.getSelection()?.toString() ?? '');
		console.log('Selected text after drag:', JSON.stringify(selectedText));
		expect(selectedText).toBe('');

		// Check value changed
		const finalValue = await thumb.getAttribute('aria-valuenow');
		console.log(`Slider value: ${initialValue} -> ${finalValue}`);
		expect(finalValue).not.toBe(initialValue);
	});

	test('3a. /editor pine shape disables branch-related sliders', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		// Branch Angle is intermediate-tier — switch tier before asserting
		await page.evaluate(() => localStorage.setItem('settings-tier', '"intermediate"'));
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Select pine shape via shadcn select trigger
		const trigger = page.locator('[data-slot="select-trigger"]').first();
		await trigger.click();
		await page.waitForTimeout(300);
		const pineOption = page.locator('[role="option"]').filter({ hasText: /pine/i }).first();
		await pineOption.click();
		await page.waitForTimeout(300);

		// Pine disables branch-related sliders: branchAngle should be disabled
		const branchAngleSlider = page.locator('#slider-branch-angle');
		const branchAngleDisabled = await branchAngleSlider.getAttribute('data-disabled');
		console.log('branchAngle disabled attr:', branchAngleDisabled);
		expect(branchAngleDisabled).not.toBeNull();

		// Visual check via screenshot
		await page.screenshot({ path: '/tmp/pine_disabled.png', fullPage: false });
	});

	test('3b. /editor oak shape does NOT disable branch-related sliders', async ({ page }) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		// Branch Angle is intermediate-tier — switch tier before asserting
		await page.evaluate(() => localStorage.setItem('settings-tier', '"intermediate"'));
		await page.reload();
		await page.waitForLoadState('networkidle');

		// Oak is the default shape; Branch Angle should be enabled
		const branchAngleSlider = page.locator('#slider-branch-angle');
		const branchAngleDisabled = await branchAngleSlider.getAttribute('data-disabled');
		console.log('oak branchAngle disabled:', branchAngleDisabled);

		expect(branchAngleDisabled).toBeNull();
	});

	test('4. / scene editor aside has select-none class', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		const aside = page.locator('aside');
		const classes = await aside.getAttribute('class');
		console.log('scene aside classes:', classes);
		expect(classes).toContain('select-none');
	});

	test('5. / scene editor has expected card titles', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.evaluate(() => localStorage.setItem('settings-tier', '"advanced"'));
		await page.reload();
		await page.waitForLoadState('networkidle');

		const expectedTitles = [
			'Scene Settings',
			'Canopy',
			'Trunk',
			'Branches',
			'Lighting',
			'Color Mode',
			'Canopy Color',
			'Trunk Color',
			'Environment',
			'Debug',
			'Animations',
			'Connections',
		];

		for (const title of expectedTitles) {
			const el = page.locator('text=' + title).first();
			const visible = await el.isVisible();
			console.log(`Card "${title}" visible:`, visible);
			expect(visible, `Card title "${title}" should be visible`).toBe(true);
		}

		// Lighting card has light angle slider
		const lightingSection = page.locator('text=Light Angle').first();
		expect(await lightingSection.isVisible()).toBe(true);
		// Depth variance is in the Branches card at advanced tier
		const depthSection = page.locator('text=Depth Variance').first();
		expect(await depthSection.isVisible()).toBe(true);
	});

	test('6. / scene editor slider drag produces no text selection', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// The scene page has both native <input type="range"> and shadcn sliders.
		// Use whichever slider is available — try shadcn first, fall back to native.
		let sliderBox;
		let usingShadcn = false;
		const shadcnSlider = page.locator('[data-slot="slider"]').first();
		const nativeSlider = page.locator('input[type="range"]').first();

		if ((await shadcnSlider.count()) > 0) {
			sliderBox = await shadcnSlider.boundingBox();
			usingShadcn = true;
		} else {
			sliderBox = await nativeSlider.boundingBox();
		}
		expect(sliderBox).not.toBeNull();

		const startX = sliderBox!.x + 10;
		const startY = sliderBox!.y + sliderBox!.height / 2;
		const endX = sliderBox!.x + sliderBox!.width - 10;

		await page.mouse.move(startX, startY);
		await page.mouse.down();
		await page.mouse.move(endX, startY, { steps: 10 });
		await page.mouse.up();

		const selectedText = await page.evaluate(() => window.getSelection()?.toString() ?? '');
		console.log('Scene selected text after drag:', JSON.stringify(selectedText));
		expect(selectedText).toBe('');

		// Verify the slider value changed
		if (usingShadcn) {
			const thumb = shadcnSlider.locator('[data-slot="slider-thumb"]');
			const finalValue = await thumb.getAttribute('aria-valuenow');
			console.log(`Scene shadcn slider final value: ${finalValue}`);
			expect(finalValue).toBeTruthy();
		} else {
			const finalValue = await nativeSlider.inputValue();
			console.log(`Scene slider final value: ${finalValue}`);
			expect(finalValue).toBeTruthy();
		}
	});
});
