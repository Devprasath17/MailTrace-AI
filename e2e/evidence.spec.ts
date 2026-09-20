import { test, expect } from '@playwright/test';

test.describe('MailTrace AI — Evidence Vault & Chain of Custody', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'analyst@mailtrace.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });


  test('should display Evidence Vault metrics and artifact table', async ({ page }) => {
    await page.goto('/evidence');
    await expect(page.locator('h1')).toContainText('Evidence Vault');

    await expect(page.locator('text=Total Evidence')).toBeVisible();
    await expect(page.locator('text=Verified Integrity')).toBeVisible();


    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
  });

  test('should trigger Upload Evidence modal and handle cancellation', async ({ page }) => {
    await page.goto('/evidence');
    const uploadBtn = page.locator('button:has-text("Upload Evidence")');
    await uploadBtn.click();

    await expect(page.locator('text=Upload Forensic Evidence')).toBeVisible();
    await expect(page.locator('text=Artifact Category')).toBeVisible();

    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('text=Upload Forensic Evidence')).not.toBeVisible();
  });
});
