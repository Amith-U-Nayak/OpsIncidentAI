# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> test
- Location: tests\auth.spec.js:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: '👁️' })

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - heading "⚡ OpsIncidentAI" [level=1] [ref=e6]
    - paragraph [ref=e7]: AI-Powered Incident Management
  - generic [ref=e8]:
    - heading "Create Account" [level=2] [ref=e9]
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: Full Name
        - textbox "Enter your full name" [ref=e13]: test1
      - generic [ref=e14]:
        - generic [ref=e15]: Email
        - textbox "Enter your email" [ref=e16]: test1@gmail.com
      - generic [ref=e17]:
        - generic [ref=e18]: Password
        - generic [ref=e19]:
          - textbox "••••••••" [ref=e20]: test1password
          - button "🙈" [active] [ref=e21] [cursor=pointer]
      - generic [ref=e22]:
        - generic [ref=e23]: Organization (Optional)
        - textbox "Add Organization or leave blank for personal use" [ref=e24]
      - generic [ref=e25]:
        - generic [ref=e26]: Role
        - combobox [ref=e27]:
          - option "Engineer" [selected]
          - option "Admin"
          - option "Viewer"
      - button "Create Account" [ref=e28] [cursor=pointer]
    - paragraph [ref=e29]:
      - text: Already have an account?
      - link "Sign In" [ref=e30] [cursor=pointer]:
        - /url: /login
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('test', async ({ page }) => {
  4  |     await page.goto('http://localhost:5173/login');
  5  |     await page.getByRole('textbox', { name: 'you@example.com' }).click();
  6  |     await page.getByRole('link', { name: 'Register' }).click();
  7  |     await page.getByRole('textbox', { name: 'Enter your full name' }).click();
  8  |     await page.getByRole('textbox', { name: 'Enter your full name' }).fill('tester1');
  9  |     await page.getByRole('textbox', { name: 'Enter your email' }).click();
  10 |     await page.getByRole('textbox', { name: 'Enter your email' }).fill('test1@gmail.com');
  11 |     await page.getByRole('textbox', { name: 'Enter your full name' }).click();
  12 |     await page.getByRole('textbox', { name: 'Enter your full name' }).click();
  13 |     await page.getByRole('textbox', { name: 'Enter your full name' }).press('ArrowLeft');
  14 |     await page.getByRole('textbox', { name: 'Enter your full name' }).fill('test1');
  15 |     await page.getByRole('textbox', { name: '••••••••' }).click();
  16 |     await page.getByRole('textbox', { name: '••••••••' }).fill('test1password');
  17 |     await page.getByRole('button', { name: '👁️' }).click();
> 18 |     await page.getByRole('button', { name: '👁️' }).click();
     |                                                     ^ Error: locator.click: Test timeout of 30000ms exceeded.
  19 |     await page.getByRole('button', { name: '🙈' }).click();
  20 |     await page.getByRole('textbox', { name: 'Add Organization or leave' }).click();
  21 |     await page.getByRole('button', { name: 'Create Account' }).click();
  22 |     await page.getByRole('textbox', { name: 'you@example.com' }).click();
  23 |     await page.getByRole('textbox', { name: 'you@example.com' }).fill('test1@gmail.com');
  24 |     await page.getByRole('textbox', { name: '••••••••' }).click();
  25 |     await page.getByRole('textbox', { name: '••••••••' }).fill('test1password');
  26 |     await page.getByRole('button', { name: 'Sign In' }).click();
  27 |     await page.getByRole('link', { name: '🚨 Incidents' }).click();
  28 |     await page.getByRole('cell', { name: 'Database connection failure' }).click();
  29 |     await page.getByRole('link', { name: '📖 Runbooks' }).click();
  30 |     await page.getByRole('link', { name: '➕ New Incident' }).click();
  31 |     await page.getByRole('link', { name: '📊 Dashboard' }).click();
  32 |     await page.getByRole('application').filter({ hasText: 'W33W34W3501234' }).click();
  33 |     await page.getByText('Open / Investigating2 /').click();
  34 |     await page.getByText('5', { exact: true }).click();
  35 |     await page.getByRole('button', { name: '🚪 Logout' }).click();
  36 | });
```