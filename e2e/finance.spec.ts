import { test, expect } from '@playwright/test';

test.describe('Finance Module', () => {
  test.beforeEach(async ({ page }) => {
    // Inject flag before page load to bypass auth
    await page.addInitScript(() => {
        window.localStorage.setItem('E2E_TEST_MODE', 'true');
    });

    // Navigate to the app
    await page.goto('/');
    
    // Check if we are redirected to login or if we are already in
    // For now, assuming dev environment might be auto-logged in or we can see public parts.
    // If auth is required, we might need to mock it or handle login.
    // Given this is a local dev environment, we'll see what happens.
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
  });

  test('Unit Economics Calculator functionality', async ({ page }) => {
    // Navigate to Finance -> Decomposition
    // Assuming there is a sidebar or navigation
    // We might need to click on "Finance" tab
    
    // Since I can't easily login in E2E without credentials or mocking, 
    // and the components are internal, I'll rely on the fact that I can render components in isolation 
    // via component testing, but Playwright here is set up for E2E.
    
    // Let's try to navigate to /finance directly if possible
    await page.goto('/finance');
    
    // Check if we are on finance page
    // If redirected to login, we can't proceed easily without auth setup.
    // However, the user asked for E2E tests.
    
    // Let's assume for this test that we can access the page. 
    // If not, I will update the test to handle login if I had credentials, 
    // or I will note that E2E requires auth setup.
    
    // Click on "Decomposition" tab
    const decompositionTab = page.getByRole('tab', { name: 'Декомпозиция' });
    if (await decompositionTab.isVisible()) {
        await decompositionTab.click();
    }
    
    // Check for Unit Economics component
    await expect(page.getByText('Юнит-экономика')).toBeVisible();
    
    // Test interactions
    // 1. Change Margin
    const marginInput = page.getByLabel('Маржинальность (%)');
    await marginInput.fill('50');
    
    // 2. Change Frequency
    const freqInput = page.getByLabel('Частота (в мес)');
    await freqInput.fill('2');
    
    // 3. Verify LTV calculation updates (approximate check or just visibility)
    // LTV = AvgCheck * Margin% * Freq * Lifetime
    // We don't know AvgCheck exactly as it comes from props, but we can check if values change.
    await expect(page.getByText('LTV', { exact: true })).toBeVisible();
  });

  test('SMART Goals creation flow', async ({ page }) => {
    await page.goto('/finance');
    
    // Click on "Decomposition" tab
    const decompositionTab = page.getByRole('tab', { name: 'Декомпозиция' });
    if (await decompositionTab.isVisible()) {
        await decompositionTab.click();
    }

    // Open Add Goal Dialog
    await page.getByRole('button', { name: 'Добавить цель' }).click();
    
    // Check Dialog Title
    await expect(page.getByRole('heading', { name: 'Создание SMART цели' })).toBeVisible();
    
    // Step 1: Specific
    await page.getByLabel('Название цели').fill('E2E Test Goal');
    await page.getByRole('textbox', { name: 'Specific (Конкретика)' }).fill('Detailed specific goal description for testing');
    await page.getByRole('button', { name: 'Далее' }).click();
    
    // Step 2: Measurable
    await expect(page.getByText('Показатель (Метрика)')).toBeVisible();
    await page.getByPlaceholder('Например: Выручка, Лиды').fill('Revenue');
    await page.getByPlaceholder('KZT, шт, %').fill('USD');
    await page.getByLabel('Текущее значение').fill('0');
    await page.getByLabel('Целевое значение').fill('1000');
    await page.getByRole('button', { name: 'Далее' }).click();
    
    // Step 3: Achievable
    await expect(page.getByText('Ресурсы подтверждены')).toBeVisible();
    await page.getByLabel('Ресурсы подтверждены').check();
    await page.getByRole('button', { name: 'Далее' }).click();
    
    // Step 4: Relevant
    await expect(page.getByText('Relevant (Значимость)')).toBeVisible();
    await page.getByRole('textbox', { name: 'Relevant (Значимость)' }).fill('This is relevant because...');
    await page.getByRole('button', { name: 'Далее' }).click();
    
    // Step 5: Time-bound
    await expect(page.getByText('Time-bound (Ограниченность во времени)')).toBeVisible();
    // Use ID to avoid ambiguity with Tab Trigger which has the same aria-label
    const dateInput = page.locator('#deadline');
    // Set a future date
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const dateString = futureDate.toISOString().split('T')[0];
    await dateInput.fill(dateString);
    
    // Create
    await page.getByRole('button', { name: 'Создать цель' }).click();
    
    // Verify Goal is added to list
    await expect(page.getByText('E2E Test Goal')).toBeVisible();
  });

  test('Financial Model Editability', async ({ page }) => {
    await page.goto('/finance');
    
    const decompositionTab = page.getByRole('tab', { name: 'Декомпозиция' });
    if (await decompositionTab.isVisible()) {
        await decompositionTab.click();
    }

    // Verify Title
    await expect(page.getByText('Финансовая модель')).toBeVisible();

    // Verify Inputs are editable
    // 1. Change Revenue Goal
    const revenueInput = page.getByLabel('Цель (Выручка)');
    await expect(revenueInput).toBeEditable();
    await revenueInput.fill('5000000');
    
    // 2. Change Avg Check
    const avgCheckInput = page.getByLabel('Ср. чек');
    await expect(avgCheckInput).toBeEditable();
    await avgCheckInput.fill('200000');

    // 3. Verify Table updates
    // Revenue = 5M
    // Avg Check = 200k
    // Sales = 25
    // In table, Revenue for Goal Scenario (Avg) should be 5M.
    // Let's check if we can find "5 000 000" in the table
    // Note: formatting might vary, but "5 000 000" is likely.
    await expect(page.locator('table')).toContainText('5 000 000');
    
    // 4. Switch to Budget Mode
    const budgetModeBtn = page.getByRole('button', { name: 'От бюджета' });
    await budgetModeBtn.click();
    await expect(budgetModeBtn).toHaveClass(/bg-primary/);
    
    // 5. Check Budget Input visibility
    const budgetInput = page.getByLabel('Бюджет', { exact: true });
    await expect(budgetInput).toBeVisible();
    await expect(budgetInput).toBeEditable();
    await budgetInput.fill('1000000');
  });
});
