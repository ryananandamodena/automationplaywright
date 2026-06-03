# 🚀 Applitools Quick Reference

## Run Commands

```powershell
# Set API key (sekali per session)
$env:APPLITOOLS_API_KEY="your_api_key_here"

# Run semua visual tests
npx playwright test prive/prive-visual-ai.spec.js --headed

# Run specific test
npx playwright test prive/prive-visual-ai.spec.js -g "Homepage Hero"

# Run dalam headless mode (faster)
npx playwright test prive/prive-visual-ai.spec.js
```

## Test Structure

```javascript
const { eyes, runner } = setupEyes();

try {
  // 1. Open visual session
  await eyes.open(page, 'App Name', 'Test Name');
  
  // 2. Navigate & interact
  await page.goto('https://example.com');
  
  // 3. Visual checkpoint (AI screenshot)
  await eyes.check('Checkpoint Name', Target.window().fully());
  
  // 4. Close and compare
  await eyes.close();
  
} catch (error) {
  await eyes.abort();
}
```

## Common Patterns

### Full Page Screenshot
```javascript
await eyes.check('Full Page', Target.window().fully());
```

### Specific Region
```javascript
await eyes.check('Header', Target.region('.header-class'));
```

### Ignore Dynamic Content
```javascript
await eyes.check('Homepage', 
  Target.window().fully()
    .ignore(page.locator('.ads'))
    .ignore(page.locator('.timestamp'))
);
```

### Layout Check Only
```javascript
await eyes.check('Dynamic Content', 
  Target.window().fully().layout()
);
```

### Multiple Viewports
```javascript
await page.setViewportSize({ width: 1920, height: 1080 });
await eyes.check('Desktop View');

await page.setViewportSize({ width: 375, height: 667 });
await eyes.check('Mobile View');
```

## Dashboard URLs

- **Login:** https://eyes.applitools.com/
- **API Key:** https://eyes.applitools.com/app/admin
- **Test Results:** https://eyes.applitools.com/app/batches/
- **Documentation:** https://applitools.com/docs/

## Free Account Limits

- ✅ Unlimited tests (open source)
- ✅ 100 checkpoints/month (private)
- ✅ Classic runner (sequential)
- ✅ Basic dashboard
- ❌ Ultrafast Grid (paid only)

## Environment Variables

```powershell
# PowerShell (temporary)
$env:APPLITOOLS_API_KEY="abc123xyz"

# Or create .env file
APPLITOOLS_API_KEY=abc123xyz
```

## CI/CD Integration

```yaml
# GitHub Actions
env:
  APPLITOOLS_API_KEY: ${{ secrets.APPLITOOLS_API_KEY }}
run: npx playwright test prive/prive-visual-ai.spec.js
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| API key not found | Set `$env:APPLITOOLS_API_KEY` |
| Connection timeout | Check internet connection |
| Target page closed | Increase `timeout` in goto |
| Results not showing | Wait 1-2 min, refresh dashboard |

## Workflow

1. **First Run** → Creates baseline
2. **Second Run** → Compares vs baseline
3. **Review** → Accept ✅ or Reject ❌
4. **Repeat** → Baseline updated

## Match Levels

```javascript
// Strict (pixel-perfect)
Target.window().fully().strict()

// Layout (ignore colors/text)
Target.window().fully().layout()

// Content (ignore dynamic elements)
Target.window().fully().content()
```

## Getting Help

- Docs: https://applitools.com/docs/
- Support: support@applitools.com
- Community: https://applitools.com/community/
