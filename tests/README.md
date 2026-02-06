# ClawSec Tests

## Test Structure

```
tests/
├── validator.test.js       # JSON schema validation tests (30+ cases)
├── integration/            # Integration tests (API, client-server)
└── e2e/                    # End-to-end tests
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test File
```bash
npm test tests/validator.test.js
```

### With Coverage
```bash
npm test -- --coverage
```

### Watch Mode (Development)
```bash
npm test -- --watch
```

## Validator Tests

The `validator.test.js` file contains comprehensive tests for the JSON validation system:

### Test Categories

1. **Report Validation** (10 tests)
   - Valid complete reports
   - Minimal valid reports
   - Missing required fields
   - Invalid patterns
   - Invalid enums
   - Range violations
   - Empty strings
   - Mismatched counts
   - Invalid timestamps

2. **Finding Validation** (8 tests)
   - Valid complete findings
   - Minimal findings
   - Invalid threat IDs
   - Invalid severities
   - Title length violations
   - Missing fields
   - Invalid remediation structure
   - Type mismatches

3. **Scan Input Validation** (5 tests)
   - Valid OpenClaw configs
   - Minimal configs
   - Empty configs
   - Invalid ports
   - Invalid policies

4. **Error Formatting** (2 tests)
   - Clear error messages
   - Helpful context

5. **validateOrThrow** (3 tests)
   - No throw on valid
   - Throw on invalid
   - Unknown type handling

### Test Coverage

- ✅ 30+ test cases
- ✅ All validation paths
- ✅ Edge cases
- ✅ Error messages
- ✅ Integration scenarios

### Running Validator Tests

```bash
# Run validation tests only
npm test tests/validator.test.js

# Watch mode
npm test -- --watch tests/validator.test.js

# Verbose output
npm test -- --verbose tests/validator.test.js

# Coverage report
npm test -- --coverage tests/validator.test.js
```

## Writing New Tests

### Test Template

```javascript
describe('My Feature', () => {
  test('should do something', () => {
    // Arrange
    const input = { /* test data */ };
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe(expectedValue);
  });
});
```

### Best Practices

1. **Descriptive names** - Test names should clearly state what they test
2. **Arrange-Act-Assert** - Follow the AAA pattern
3. **One assertion per test** - Keep tests focused
4. **Test edge cases** - Not just happy paths
5. **Mock external dependencies** - Keep tests isolated
6. **Clean up after tests** - Reset state if needed

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch commits
- Pre-deployment checks

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)
- [ClawSec Validation Docs](../docs/validation.md)
