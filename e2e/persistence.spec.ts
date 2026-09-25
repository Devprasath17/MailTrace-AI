import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('MailTrace AI — Database Persistence & Data Retention E2E', () => {
  test('should analyze email, persist to database, retain data across page refresh, and display in list/dashboard', async ({ page }) => {
    // Step 1: Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'analyst@mailtrace.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Step 2: Navigate to Analyze Email and upload .eml file
    await page.goto('/analyze');
    await expect(page.locator('h1')).toContainText('Email Threat Forensic Hub');

    const fileInput = page.locator('input[type="file"]');
    const fixturePath = path.join(__dirname, 'fixtures', 'suspicious-phishing.eml');
    await fileInput.setInputFiles(fixturePath);

    // Step 3: Execute Analysis
    const submitBtn = page.locator('button:has-text("Execute Forensic Analysis")').first();
    await submitBtn.click();

    // Step 4: Verify Analysis Completed inline
    await expect(page.locator('text=MailTrace Risk Score')).toBeVisible({ timeout: 20000 });
    await expect(page.locator('text=Evidence SHA-256 Digest Verified')).toBeVisible();

    // Capture Case Reference Number
    const caseNumberText = await page.locator('h2.font-mono').innerText();
    expect(caseNumberText).toContain('MT-');

    // Step 5: Open Case Detail
    const openCaseBtn = page.locator('button:has-text("Open Case")');
    await openCaseBtn.click();

    await page.waitForURL(/.*investigations\/.*/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('MT-', { timeout: 15000 });

    // Step 6: Perform Hard Page Refresh & Verify Data Still Exists
    await page.reload();
    await expect(page.locator('h1')).toContainText('MT-', { timeout: 15000 });
    await expect(page.locator('text=Risk Rating')).toBeVisible();

    // Step 7: Navigate to Investigations List and verify persistent record is listed
    await page.goto('/investigations');
    await expect(page.locator(`text=${caseNumberText}`)).toBeVisible();

    // Step 8: Navigate to SOC Security Dashboard and verify case is counted
    await page.goto('/dashboard');
    await expect(page.locator(`text=${caseNumberText}`)).toBeVisible();
  });
});
