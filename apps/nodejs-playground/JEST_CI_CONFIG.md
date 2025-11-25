# Jest Configuration for CI/CD

Configuration cho Jest để support GitHub Actions CI/CD pipeline.

## 📋 Required Configuration

### 1. jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // ✅ Enable coverage collection
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  
  // ✅ Include json-summary for CI reporting
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // ✅ Configure JUnit reporter for GitHub Actions
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '.',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ]
  ]
}
```

### 2. package.json scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --coverage --ci --reporters=default --reporters=jest-junit"
  }
}
```

### 3. package.json devDependencies

```json
{
  "devDependencies": {
    "jest": "^30.0.5",
    "jest-junit": "^16.0.0",
    "ts-jest": "^29.4.1",
    "@types/jest": "^30.0.0"
  }
}
```

## 📊 Generated Files

Khi chạy `pnpm test:ci`, các file sau sẽ được tạo:

### 1. junit.xml
```
./apps/nodejs-playground/junit.xml
```
- Format: JUnit XML
- Được dùng bởi: `dorny/test-reporter@v1` trong GitHub Actions
- Chứa: Test results (passed/failed/skipped)

### 2. coverage-summary.json
```
./apps/nodejs-playground/coverage/coverage-summary.json
```
- Format: JSON
- Được dùng bởi: Workflow script để parse coverage %
- Chứa: Coverage metrics (lines, statements, functions, branches)

### 3. Other Coverage Files
```
./apps/nodejs-playground/coverage/
├── coverage-summary.json  (for CI)
├── lcov.info              (for IDE integration)
└── html/                  (for human review)
    └── index.html
```

## 🔍 Verification

### Local Test:
```bash
cd apps/nodejs-playground

# Run tests with coverage
pnpm test:ci

# Check generated files
ls -la junit.xml
ls -la coverage/coverage-summary.json

# View coverage in browser
open coverage/html/index.html
```

### Expected Output:
```
✓ junit.xml exists (for test results)
✓ coverage/coverage-summary.json exists (for coverage %)
✓ coverage/html/index.html exists (for viewing)
```

## 🐛 Troubleshooting

### Coverage not showing:
**Symptom:**
```
⚠️ Coverage: Not available
```

**Fixes:**
1. Check `collectCoverage: true` is enabled
2. Verify `json-summary` in `coverageReporters`
3. Run locally: `pnpm test:ci`
4. Check file exists: `coverage/coverage-summary.json`

### JUnit XML not found:
**Symptom:**
```
Error: No test report files were found
```

**Fixes:**
1. Check `jest-junit` is in devDependencies
2. Verify reporters config in jest.config.js
3. Check outputDirectory: `'.'` (current dir)
4. Run locally: `pnpm test:ci`
5. Check file exists: `junit.xml`

### Tests not running:
**Symptom:**
```
No tests found
```

**Fixes:**
1. Check testMatch pattern: `['**/__tests__/**/*.test.ts', '**/*.test.ts']`
2. Verify test files exist in correct location
3. Check file naming: `*.test.ts` or in `__tests__/` folder

## 📚 References

- [Jest Configuration](https://jestjs.io/docs/configuration)
- [jest-junit](https://github.com/jest-community/jest-junit)
- [Coverage Reporters](https://jestjs.io/docs/configuration#coveragereporters-arraystring--string-options)
- [GitHub Actions: dorny/test-reporter](https://github.com/dorny/test-reporter)

## ✅ Checklist

Trước khi commit, đảm bảo:

- [ ] `collectCoverage: true` enabled
- [ ] `json-summary` in coverageReporters
- [ ] `jest-junit` reporter configured
- [ ] `test:ci` script exists
- [ ] `jest-junit` package installed
- [ ] Local test passes: `pnpm test:ci`
- [ ] `junit.xml` generated
- [ ] `coverage-summary.json` generated

---

**Last Updated:** October 29, 2025
