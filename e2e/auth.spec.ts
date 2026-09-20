import { test, expect } from '@playwright/test';

test.describe('MailTrace AI — Authentication & Navigation Flow', () => {
  test('should display Landing Page and navigate to Login', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText('MailTrace AI');
    await expect(page.locator('h1')).toContainText('actionable forensic intelligence');

    const loginBtn = page.locator('a:has-text("Sign In"), button:has-text("Sign In"), a:has-text("Login")').first();
    await loginBtn.click();
    await expect(page).toHaveURL(/.*login/);
  });


  test('should authenticate user and access Dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'analyst@mailtrace.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('SOC Security Dashboard');
  });

  test('should retain navigation across Protected Routes', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'analyst@mailtrace.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('SOC Security Dashboard');

    await page.click('a:has-text("Indicators (IOCs)")');
    await expect(page.locator('h1')).toContainText('Indicators (IOCs)');

    await page.click('a:has-text("Evidence Vault")');
    await expect(page.locator('h1')).toContainText('Evidence Vault');

    await page.click('a:has-text("Integrations")');
    await expect(page.locator('h1')).toContainText('Integrations');
  });
});

