import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5174';
const API_URL  = 'http://localhost:8000';
const WAIT     = 1000;

const browser = await chromium.launch({ headless: false });
const page    = await browser.newPage();
page.setDefaultTimeout(5000);

let todoId = null;

try {
  // ── 1. Load the app ──────────────────────────────────────────────────────
  await page.goto(BASE_URL);
  await page.waitForSelector('h1:has-text("Todo List")');
  console.log('App loaded');
  await page.waitForTimeout(WAIT);

  // ── 2. Create a new todo ──────────────────────────────────────────────────
  await page.locator('input[placeholder="What needs to be done?"]').fill('E2E test item');
  await page.locator('button[type="submit"]').click();

  // Grab the new row by name
  const row = page.locator('tbody tr').filter({ hasText: 'E2E test item' }).first();
  await row.waitFor();
  console.log('Todo created');
  await page.waitForTimeout(WAIT);

  // ── 3. Edit the name ─────────────────────────────────────────────────────
  await row.locator('td:nth-child(2) span').click();
  const nameInput = page.locator('tbody tr td:nth-child(2) input.input');
  await nameInput.waitFor();
  await nameInput.fill('E2E renamed item');
  await nameInput.press('Enter');
  await page.waitForSelector('tbody tr td span:has-text("E2E renamed item")');
  console.log('Name changed');
  await page.waitForTimeout(WAIT);

  // ── 4. Change priority to High (1) ───────────────────────────────────────
  const renamedRow = page.locator('tbody tr').filter({ hasText: 'E2E renamed item' }).first();
  await renamedRow.locator('td:nth-child(3) > span').click();
  const prioritySelect = renamedRow.locator('select');
  await prioritySelect.waitFor();
  await prioritySelect.selectOption('1');
  await page.waitForSelector('tbody tr td .tag:has-text("High")');
  console.log('Priority changed to High');
  await page.waitForTimeout(WAIT);

  // Read the todo id from the API so we can delete it later
  const todos = await (await fetch(`${API_URL}/todos`)).json();
  const todo  = todos.find(t => t.name === 'E2E renamed item');
  if (!todo) throw new Error('Could not find todo via API');
  todoId = todo.id;

  // ── 5. Mark as done ───────────────────────────────────────────────────────
  const activeRow = renamedRow;
  await activeRow.locator('input.todo-check').click();
  console.log('Marked as done — waiting for fade-out...');

  // Wait for the item to disappear from the active list (fade + state update)
  await page.locator('tbody tr td:nth-child(2) span', { hasText: 'E2E renamed item' }).waitFor({ state: 'detached', timeout: 5000 });
  console.log('Item removed from active list');
  await page.waitForTimeout(WAIT);

  // ── 6. Show completed and verify item is there ────────────────────────────
  await page.locator('button', { hasText: /show completed/i }).click();
  await page.waitForSelector(':text("E2E renamed item")');
  console.log('Item visible in completed section');
  await page.waitForTimeout(WAIT);

  // ── 7. Delete via API ─────────────────────────────────────────────────────
  const res = await fetch(`${API_URL}/todos/${todoId}`, { method: 'DELETE' });
  if (res.status !== 204) throw new Error(`DELETE returned ${res.status}`);
  console.log(`Todo ${todoId} deleted via API`);

  console.log('\nAll steps passed ✓');
} catch (err) {
  console.error('\nTest FAILED:', err.message);
  // Clean up if we got an id
  if (todoId !== null) {
    await fetch(`${API_URL}/todos/${todoId}`, { method: 'DELETE' }).catch(() => null);
  }
  process.exit(1);
} finally {
  await browser.close();
}
