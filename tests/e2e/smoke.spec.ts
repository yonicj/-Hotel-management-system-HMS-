import { test, expect } from '@playwright/test';

test.describe('E2E Smoke Tests', () => {
  const apiBaseUrl = process.env.API_URL || 'http://localhost:4000';
  const webBaseUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  test('GET /health on API returns ok', async ({ request }) => {
    const response = await request.get(`${apiBaseUrl}/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });

  test('GET / on Web app loads home page', async ({ page }) => {
    const response = await page.goto(webBaseUrl);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('h1')).toContainText('Hotel Management System');
  });
});

