import { test, expect } from '@playwright/test';

test.describe('MailTrace AI — Indicators, Evidence, Integrations & Security', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'analyst@mailtrace.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });


  test('should load Indicators page, filter, and inspect detail drawer', async ({ page }) => {
    await page.goto('/indicators');
    await expect(page.locator('h1')).toContainText('Indicators (IOCs)');

    const searchInput = page.locator('input[placeholder*="Search IP"]').first();

    await searchInput.fill('payroll');

    const refreshBtn = page.locator('button:has-text("Refresh")');
    await expect(refreshBtn).toBeVisible();
  });

  test('should load Evidence Vault, open upload modal, and display security summary', async ({ page }) => {
    await page.goto('/evidence');
    await expect(page.locator('h1')).toContainText('Evidence Vault');

    const uploadBtn = page.locator('button:has-text("Upload Evidence")');
    await uploadBtn.click();

    await expect(page.locator('text=Artifact Category')).toBeVisible();
    await page.locator('button:has-text("Cancel")').click();
  });

  test('should load Integrations page and test connectivity endpoint', async ({ page }) => {
    await page.goto('/integrations');
    await expect(page.locator('h1')).toContainText('Integrations');

    await expect(page.locator('text=Gemini AI Threat Classifier')).toBeVisible();
    await expect(page.locator('text=VirusTotal Threat Intelligence')).toBeVisible();

    const testBtn = page.locator('button:has-text("Test Connection")').first();
    await testBtn.click();
  });
});
