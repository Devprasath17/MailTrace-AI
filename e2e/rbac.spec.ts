import { test, expect } from '@playwright/test';

test.describe('MailTrace AI — Role-Based Access Control (RBAC)', () => {
  test('should display current logged in role on dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'analyst@mailtrace.local');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);


    await expect(page.locator('h1')).toContainText('SOC Security Dashboard');
    // Verify user role pill/badge is displayed in sidebar
    const userRoleBadge = page.locator('aside span').filter({ hasText: /ADMIN|ANALYST|RESPONDER/ }).first();
    await expect(userRoleBadge).toBeVisible();
  });
});

