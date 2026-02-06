# JSON Validation System

## Overview

ClawSec implements comprehensive JSON schema validation to ensure all LLM-generated reports meet strict quality and consistency requirements. This validation system catches errors early, provides clear feedback, and ensures API consumers can reliably parse report outputs.

## Architecture

### Components

1. **JSON Schemas** (`server/schemas/`)
   - `report-schema.json` - Defines report output structure
   - `scan-input-schema.json` - Defines scan input structure

2. **Validator Module** (`server/lib/validator.js`)
   - Schema compilation and caching
   - Validation functions for each data type
   - Human-readable error formatting
   - Express middleware integration

3. **Test Suite** (`tests/validator.test.js`)
   - 30+ test cases covering all validation scenarios
   - Edge case testing
   - Error message validation

## Validation Features

### ✅ Required Field Validation
- Ensures all mandatory fields are present
- Catches missing data before it reaches API consumers

### ✅ Type Checking
- Validates data types (string, number, boolean, object, array)
- Prevents type mismatches that break downstream processing

### ✅ Format Validation
- ISO 8601 timestamps (`2026-02-06T20:00:00.000Z`)
- Threat ID patterns (`T001`, `T002`, etc.)
- Scan ID patterns (`clawsec-1234567890-abc123`)

### ✅ Enum Validation
- Risk levels: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`
- Severities: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`
- Exec policies: `allow-all`, `allowlist`, `denylist`, `prompt`

### ✅ Range Validation
- Port numbers: 1-65535
- String lengths: min/max constraints
- Numeric ranges: positive integers for counts

### ✅ Nested Object Validation
- Findings array validation
- Remediation object structure
- Evidence object validation

### ✅ Cross-field Validation
- `findings_count` must match `findings` array length
- Ensures data consistency across related fields

### ✅ Clear Error Messages
- Human-readable error descriptions
- Field-level error reporting
- Actionable feedback for developers

## Usage Examples

### Basic Report Validation

```javascript
const { validateScanReport } = require('./lib/validator');

const report = {
  scan_id: 'clawsec-1234567890-abc123',
  timestamp: '2026-02-06T20:00:00.000Z',
  report: '# Security Report\n\nNo issues found.',
  findings_count: 0,
  risk_level: 'LOW'
};

const result = validateScanReport(report);

if (result.valid) {
  console.log('✅ Report is valid');
} else {
  console.error('❌ Validation errors:', result.errors);
}
```

### Validation in API Endpoint

```javascript
const { validateScanReport } = require('./lib/validator');

app.post('/api/v1/scan', async (req, res) => {
  // ... generate report ...
  
  const response = {
    scan_id: scanId,
    timestamp: new Date().toISOString(),
    report: reportMarkdown,
    findings_count: findings.length,
    risk_level: calculateRiskLevel(findings),
    findings: findings
  };
  
  // Validate before sending
  const validation = validateScanReport(response);
  if (!validation.valid) {
    console.error('Report validation failed:', validation.errors);
    return res.status(500).json({
      error: 'Report generation failed validation',
      details: validation.errors
    });
  }
  
  res.json(response);
});
```

### Using Middleware

```javascript
const { validationMiddleware } = require('./lib/validator');

// Validate scan input
app.post('/api/v1/scan', 
  validationMiddleware('input'), // Validates req.body
  async (req, res) => {
    // Input is guaranteed to be valid here
    const scanInput = req.body;
    // ... process scan ...
  }
);
```

### Validate and Throw

```javascript
const { validateOrThrow } = require('./lib/validator');

try {
  validateOrThrow(report, 'report');
  // Continue processing
} catch (error) {
  console.error('Validation failed:', error.message);
  // Handle error
}
```

## Schema Definitions

### Report Schema

```json
{
  "type": "object",
  "required": ["scan_id", "timestamp", "report", "findings_count", "risk_level"],
  "properties": {
    "scan_id": {
      "type": "string",
      "pattern": "^clawsec-[0-9]+-[a-z0-9]+$"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "report": {
      "type": "string",
      "minLength": 1
    },
    "findings_count": {
      "type": "integer",
      "minimum": 0
    },
    "risk_level": {
      "type": "string",
      "enum": ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    },
    "findings": {
      "type": "array",
      "items": { "$ref": "#/definitions/finding" }
    }
  }
}
```

### Finding Schema

```json
{
  "type": "object",
  "required": ["threat_id", "severity", "title", "description", "impact", "likelihood"],
  "properties": {
    "threat_id": {
      "type": "string",
      "pattern": "^T[0-9]{3}$"
    },
    "severity": {
      "type": "string",
      "enum": ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "description": { "type": "string", "minLength": 1 },
    "impact": { "type": "string", "minLength": 1 },
    "likelihood": {
      "type": "string",
      "enum": ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    },
    "evidence": { "type": "object" },
    "remediation": {
      "type": "object",
      "properties": {
        "immediate": { "type": "array", "items": { "type": "string" } },
        "short_term": { "type": "array", "items": { "type": "string" } },
        "long_term": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

## Error Format

Validation errors follow a consistent format:

```javascript
{
  valid: false,
  errors: [
    {
      field: 'scan_id',
      message: 'Value does not match required pattern: ^clawsec-[0-9]+-[a-z0-9]+$',
      keyword: 'pattern',
      params: { pattern: '^clawsec-[0-9]+-[a-z0-9]+$' }
    },
    {
      field: 'risk_level',
      message: 'Value must be one of: CRITICAL, HIGH, MEDIUM, LOW',
      keyword: 'enum',
      params: { allowedValues: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] }
    }
  ]
}
```

## Common Validation Errors

### Missing Required Field
```
Missing required field: timestamp
```
**Fix:** Add the missing field to your data object.

### Invalid Type
```
Expected type string but got number
```
**Fix:** Convert the value to the expected type.

### Pattern Mismatch
```
Value does not match required pattern: ^clawsec-[0-9]+-[a-z0-9]+$
```
**Fix:** Ensure the scan_id follows the format `clawsec-TIMESTAMP-RANDOM`.

### Enum Value
```
Value must be one of: CRITICAL, HIGH, MEDIUM, LOW
```
**Fix:** Use one of the allowed enum values.

### Array Length Mismatch
```
findings_count (5) does not match findings array length (3)
```
**Fix:** Ensure findings_count equals findings.length.

## Testing

Run the validation test suite:

```bash
# Run all tests
npm test tests/validator.test.js

# Run with coverage
npm test -- --coverage tests/validator.test.js

# Run in watch mode (development)
npm test -- --watch tests/validator.test.js
```

### Test Coverage

- ✅ 30+ test cases
- ✅ All validation paths covered
- ✅ Edge cases tested
- ✅ Error message validation
- ✅ Performance validated

## Performance

- **Schema compilation:** Once at startup (cached)
- **Validation time:** < 1ms for typical reports
- **Memory overhead:** < 100KB for schemas
- **No runtime dependencies** (except ajv)

## Integration with LLM Pipeline

The validation system integrates seamlessly with the LLM report generation:

1. **LLM generates report** → Raw JSON structure
2. **Validator checks structure** → Catches schema violations
3. **Error handling** → Clear feedback for debugging
4. **API response** → Validated, consistent output

### Development Mode

In development, validation errors cause requests to fail:

```javascript
if (!validation.valid) {
  return res.status(500).json({
    error: 'Report validation failed',
    details: validation.errors
  });
}
```

### Production Mode

In production, validation errors are logged but don't fail requests (graceful degradation):

```javascript
if (!validation.valid) {
  console.error('Validation failed:', validation.errors);
  // Continue anyway - log for investigation
}
```

## Best Practices

1. **Always validate before sending** - Catch errors at the source
2. **Log validation errors** - Track patterns for improvement
3. **Test edge cases** - Use the test suite as examples
4. **Keep schemas in sync** - Update schemas when changing data structures
5. **Use TypeScript** (optional) - Generate types from schemas
6. **Document schema changes** - Keep this doc updated

## Future Enhancements

- [ ] JSON Schema draft-2020-12 support
- [ ] Custom validation rules (e.g., security-specific checks)
- [ ] Schema versioning (v1, v2, etc.)
- [ ] Validation performance metrics
- [ ] Auto-generate TypeScript types from schemas
- [ ] OpenAPI integration
- [ ] Schema documentation generator

## Dependencies

- **ajv** (v8.12.0+) - JSON Schema validator
- **ajv-formats** (v3.0.1+) - Format validators (date-time, email, etc.)

Install with:
```bash
npm install ajv ajv-formats
```

## Resources

- [JSON Schema Specification](https://json-schema.org/)
- [Ajv Documentation](https://ajv.js.org/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [ClawSec API Reference](./api-reference.md)

---

**Last Updated:** 2026-02-06  
**Author:** Ubik (@ClawSecAI)  
**Status:** Production Ready ✅
