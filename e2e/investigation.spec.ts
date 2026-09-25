import { test, expect } from '@playwright/test';

test.describe('MailTrace AI — Investigation Management & Detail Views', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'analyst@mailtrace.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });


  test('should load Investigations list and navigate to detail page', async ({ page }) => {
    await page.goto('/investigations');
    await expect(page.locator('h1')).toContainText('Investigation Cases');


    // Check search filter exists
    const searchInput = page.locator('input[placeholder*="Search cases"]').first();

    await expect(searchInput).toBeVisible();

    // If investigations exist, click the first one
    const inspectLink = page.locator('table tbody tr a:has-text("Inspect")').first();
    if (await inspectLink.isVisible()) {
      await inspectLink.click();
      await page.waitForURL(/.*investigations\/.*/);
      await expect(page.locator('h1')).toContainText('MT-');

      // Verify detail tabs exist
      await expect(page.locator('button:has-text("Forensic Overview")')).toBeVisible();
      await expect(page.locator('button:has-text("Investigation Graph")')).toBeVisible();
      await expect(page.locator('button:has-text("Agent Workflow")')).toBeVisible();
      await expect(page.locator('button:has-text("Analyst Notes")')).toBeVisible();
    }
  });

  test('should switch tabs seamlessly on Investigation detail page', async ({ page }) => {
    await page.goto('/investigations');
    const inspectLink = page.locator('table tbody tr a:has-text("Inspect")').first();
    if (await inspectLink.isVisible()) {
      await inspectLink.click();
      await page.waitForURL(/.*investigations\/.*/);

      // Header Analysis tab
      await page.locator('button:has-text("Header Analysis")').click();
      await expect(page.locator('text=Received Chain')).toBeVisible();

      // Agent Workflow tab
      await page.locator('button:has-text("Agent Workflow")').click();
      await expect(page.locator('text=Email Forensics Agent')).toBeVisible();

      // Evidence Artifacts tab
      await page.locator('button:has-text("Evidence Artifacts")').click();
      await expect(page.locator('text=Associated Evidence')).toBeVisible();

      // Audit Log tab
      await page.locator('button:has-text("Audit Log")').click();
      await expect(page.locator('text=Chain of Custody')).toBeVisible();
    }
  });
});
