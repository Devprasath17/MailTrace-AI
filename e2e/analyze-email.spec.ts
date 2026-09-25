import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('MailTrace AI — E2E Email Analysis & Multi-Agent Workflow', () => {
  test('should upload .EML file and execute multi-agent investigation', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'analyst@mailtrace.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    await page.goto('/analyze');

    await expect(page.locator('h1')).toContainText('Email Threat Forensic Hub');


    const fileInput = page.locator('input[type="file"]');
    const fixturePath = path.join(__dirname, 'fixtures', 'suspicious-phishing.eml');
    await fileInput.setInputFiles(fixturePath);

    const submitBtn = page.locator('button:has-text("Execute Forensic Analysis")').first();
    await submitBtn.click();

    // Wait for forensic analysis output to render inline
    await expect(page.locator('text=MailTrace Risk Score')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Evidence SHA-256 Digest Verified')).toBeVisible();

    // Click Open Case to view detailed investigation timeline
    const openCaseBtn = page.locator('button:has-text("Open Case")');
    await openCaseBtn.click();

    await page.waitForURL(/.*investigations\/.*/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('MT-', { timeout: 15000 });


    // Verify Agent Workflow Tab
    const agentTab = page.locator('button:has-text("Agent Workflow")');
    await agentTab.click();

    await expect(page.locator('text=Email Forensics Agent')).toBeVisible();
    await expect(page.locator('text=IOC Correlation Agent')).toBeVisible();
    await expect(page.locator('text=Deterministic Risk Scoring Agent')).toBeVisible();
  });

  test('should analyze pasted raw email headers and body text', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'analyst@mailtrace.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    await page.goto('/analyze');
    await expect(page.locator('h1')).toContainText('Email Threat Forensic Hub');

    // Switch to Paste Raw Headers tab
    await page.click('button:has-text("Paste Raw Headers / Body")');

    const rawEmailSnippet = `From: "Finance Alert" <security-alert@phish-domain.com>
To: "User" <user@company.com>
Subject: Security Verification Required
Date: Fri, 25 Sep 2026 10:00:00 +0000
Received: from mail.phish-domain.com (198.51.100.99) by mx.company.com; Fri, 25 Sep 2026 10:00:01 +0000
Authentication-Results: mx.company.com; spf=fail; dkim=fail; dmarc=fail

Please verify your account immediately at http://verify-secure-login.phish-domain.com/login`;

    await page.fill('textarea', rawEmailSnippet);

    const submitBtn = page.locator('button:has-text("Execute Forensic Analysis")').first();
    await submitBtn.click();

    await expect(page.locator('text=MailTrace Risk Score')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Evidence SHA-256 Digest Verified')).toBeVisible();
  });

  test('should enforce validation error when submitting with empty input', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'analyst@mailtrace.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await page.goto('/analyze');
    
    // Click submit on upload tab with no file selected
    const submitBtn = page.locator('button:has-text("Execute Forensic Analysis")').first();
    await submitBtn.click();

    await expect(page.locator('text=Please select an .EML email file to analyze.')).toBeVisible();
  });
});

