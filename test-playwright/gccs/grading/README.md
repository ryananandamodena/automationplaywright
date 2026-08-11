# GCCS Master Grading — Playwright TypeScript Suite

E2E tests for GCCS Master Grading: Login, Grade Categories, Questions Setup, Item Grading.
See [TEST_CASES.md](./TEST_CASES.md) for the full test case table and findings.

## Structure

```
grading/
├── playwright.config.ts
├── fixtures/authFixture.ts   ← logged-in page fixture (reused across specs)
├── pages/                    ← Page Object Model
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── GradeCategoriesPage.ts
│   ├── QuestionsSetupPage.ts
│   └── ItemGradingPage.ts
├── utils/
│   ├── testData.ts           ← data-driven test cases (valid/invalid/BVA/EP/security payloads)
│   └── assertions.ts         ← custom assertions (console errors, perf timing)
└── tests/
    ├── 01-login.spec.ts
    ├── 02-grade-categories.spec.ts
    ├── 03-questions-setup.spec.ts
    └── 04-item-grading.spec.ts
```

## Run

From this folder (uses the `@playwright/test` already installed at the repo root):

```bash
cd Ryan/test-playwright/gccs/grading
npx playwright test
npx playwright test --headed
npx playwright test tests/02-grade-categories.spec.ts
npx playwright show-report report
```

Retries=1 and screenshot/video/trace-on-failure are enabled by default in `playwright.config.ts`.

## Credentials (TEST env only)

- URL: `https://gccs-test.modena.com`
- User: `FE_GCCS` / `P@ssw0rd.1`
