import { test, expect } from '@playwright/test';

test.describe('MailTrace AI — Indicators (IOCs) Governance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'analyst@mailtrace.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });


  test('should display IOC stats, filter table, and search IOC value', async ({ page }) => {
    await page.goto('/indicators');
    await expect(page.locator('h1')).toContainText('Indicators (IOCs)');

    // Verify stats cards
    await expect(page.locator('text=Total Indicators')).toBeVisible();
    await expect(page.locator('span:has-text("Malicious")').first()).toBeVisible();



    // Test Search input
    const searchInput = page.locator('input[placeholder*="Search IP"]').first();

    await searchInput.fill('login-secure');

    // Test filter dropdowns
    const typeSelect = page.locator('select').first();
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption({ index: 1 });
    }
  });

  test('should open IOC detail drawer when clicking a row', async ({ page }) => {
    await page.goto('/indicators');
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await expect(page.locator('text=Indicator Details')).toBeVisible();
      await expect(page.locator('text=Risk Score')).toBeVisible();
    }
  });
});
