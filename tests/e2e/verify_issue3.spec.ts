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

		// Find the first range input (Canopy Polygons)
		const slider = page.locator('input[type="range"]').first();
		const sliderBox = await slider.boundingBox();
		expect(sliderBox).not.toBeNull();

		// Get initial value
		const initialValue = await slider.inputValue();

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
		const finalValue = await slider.inputValue();
		console.log(`Slider value: ${initialValue} -> ${finalValue}`);
		expect(Number(finalValue)).not.toBe(Number(initialValue));
	});

	test('3a. /editor pine shape disables branchCount and trunkBranchRatio sliders', async ({
		page,
	}) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		// Select pine shape via shadcn select trigger (bits-ui uses data-slot, not role=combobox)
		const trigger = page.locator('[data-slot="select-trigger"]').first();
		await trigger.click();
		await page.waitForTimeout(300);
		// Find pine option
		const pineOption = page.locator('[role="option"]').filter({ hasText: /pine/i }).first();
		await pineOption.click();
		await page.waitForTimeout(300);

		// Find branchCount slider by id
		const branchCountSlider = page.locator('#range-branches');
		const trunkBranchSlider = page.locator('#range-trunk-branch-ratio');

		const branchDisabled = await branchCountSlider.getAttribute('disabled');
		const trunkBranchDisabled = await trunkBranchSlider.getAttribute('disabled');
		console.log('branchCount disabled attr:', branchDisabled);
		console.log('trunkBranchRatio disabled attr:', trunkBranchDisabled);

		expect(branchDisabled).not.toBeNull();
		expect(trunkBranchDisabled).not.toBeNull();

		// Visual check via screenshot
		await page.screenshot({ path: '/tmp/pine_disabled.png', fullPage: false });
	});

	test('3b. /editor oak shape does NOT disable branchCount and trunkBranchRatio', async ({
		page,
	}) => {
		await page.goto('/editor');
		await page.waitForLoadState('networkidle');

		// Should be oak by default, but let's confirm
		const branchCountSlider = page.locator('#range-branches');
		const trunkBranchSlider = page.locator('#range-trunk-branch-ratio');

		const branchDisabled = await branchCountSlider.getAttribute('disabled');
		const trunkBranchDisabled = await trunkBranchSlider.getAttribute('disabled');
		console.log('oak branchCount disabled:', branchDisabled);
		console.log('oak trunkBranchRatio disabled:', trunkBranchDisabled);

		expect(branchDisabled).toBeNull();
		expect(trunkBranchDisabled).toBeNull();
	});

	test('4. / scene editor aside has select-none class', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		const aside = page.locator('aside');
		const classes = await aside.getAttribute('class');
		console.log('scene aside classes:', classes);
		expect(classes).toContain('select-none');
	});

	test('5. / scene editor has all 7 card titles', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const expectedTitles = [
			'Scene Settings',
			'Canopy',
			'Trunk & Branches',
			'Canopy Color',
			'Trunk Color',
			'Lighting',
			'Debug',
		];

		for (const title of expectedTitles) {
			const el = page.locator('text=' + title).first();
			const visible = await el.isVisible();
			console.log(`Card "${title}" visible:`, visible);
			expect(visible, `Card title "${title}" should be visible`).toBe(true);
		}

		// Lighting card has light angle and depth variance sliders
		const lightingSection = page.locator('text=Light Angle').first();
		expect(await lightingSection.isVisible()).toBe(true);
		const depthSection = page.locator('text=Depth Variance').first();
		expect(await depthSection.isVisible()).toBe(true);
	});

	test('6. / scene editor slider drag produces no text selection', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const slider = page.locator('input[type="range"]').first();
		const sliderBox = await slider.boundingBox();
		expect(sliderBox).not.toBeNull();

		const initialValue = await slider.inputValue();
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

		const finalValue = await slider.inputValue();
		console.log(`Scene slider value: ${initialValue} -> ${finalValue}`);
		expect(Number(finalValue)).not.toBe(Number(initialValue));
	});
});
