/**
 * JSON Schema Validator for ClawSec Reports
 * 
 * Provides robust validation for:
 * - Scan input payloads
 * - Report outputs
 * - Finding objects
 * 
 * Uses Ajv (Another JSON Schema Validator) for validation
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');

// Initialize Ajv with strict mode (allow union types for schema compatibility)
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: true,
  strictTypes: false,  // Allow union types in schemas
  validateFormats: true
});

// Add format validators (date-time, email, etc.)
addFormats(ajv);

// Load schemas
const reportSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../schemas/report-schema.json'), 'utf8')
);

const scanInputSchema = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../schemas/scan-input-schema.json'), 'utf8')
);

// Compile validators
const validateReport = ajv.compile(reportSchema);
const validateScanInput = ajv.compile(scanInputSchema);
const validateFinding = ajv.compile(reportSchema.definitions.finding);

/**
 * Validate a complete scan report
 * 
 * @param {object} report - The report object to validate
 * @returns {object} Validation result with { valid: boolean, errors: array }
 */
function validateScanReport(report) {
  const valid = validateReport(report);
  
  if (!valid) {
    return {
      valid: false,
      errors: formatErrors(validateReport.errors)
    };
  }
  
  // Additional validation: findings array if present
  if (report.findings && Array.isArray(report.findings)) {
    const findingErrors = [];
    report.findings.forEach((finding, index) => {
      const findingValid = validateFinding(finding);
      if (!findingValid) {
        findingErrors.push({
          index,
          errors: formatErrors(validateFinding.errors)
        });
      }
    });
    
    if (findingErrors.length > 0) {
      return {
        valid: false,
        errors: [{
          field: 'findings',
          message: 'Invalid finding objects',
          details: findingErrors
        }]
      };
    }
  }
  
  // Additional validation: findings_count matches findings array
  if (report.findings && report.findings_count !== report.findings.length) {
    return {
      valid: false,
      errors: [{
        field: 'findings_count',
        message: `findings_count (${report.findings_count}) does not match findings array length (${report.findings.length})`
      }]
    };
  }
  
  return { valid: true, errors: [] };
}

/**
 * Validate scan input configuration
 * 
 * @param {object} scanInput - The scan input to validate
 * @returns {object} Validation result
 */
function validateScanInputData(scanInput) {
  const valid = validateScanInput(scanInput);
  
  if (!valid) {
    return {
      valid: false,
      errors: formatErrors(validateScanInput.errors)
    };
  }
  
  // Additional validation: input is not empty
  if (Object.keys(scanInput).length === 0) {
    return {
      valid: false,
      errors: [{
        field: 'root',
        message: 'Scan input cannot be empty'
      }]
    };
  }
  
  return { valid: true, errors: [] };
}

/**
 * Validate a single finding object
 * 
 * @param {object} finding - The finding to validate
 * @returns {object} Validation result
 */
function validateSingleFinding(finding) {
  const valid = validateFinding(finding);
  
  if (!valid) {
    return {
      valid: false,
      errors: formatErrors(validateFinding.errors)
    };
  }
  
  return { valid: true, errors: [] };
}

/**
 * Format Ajv errors into human-readable messages
 * 
 * @param {array} ajvErrors - Raw Ajv error objects
 * @returns {array} Formatted error objects
 */
function formatErrors(ajvErrors) {
  if (!ajvErrors) return [];
  
  return ajvErrors.map(err => {
    const field = err.instancePath || err.schemaPath || 'unknown';
    let message = err.message || 'Validation failed';
    
    // Enhance error messages based on keyword
    switch (err.keyword) {
      case 'required':
        message = `Missing required field: ${err.params.missingProperty}`;
        break;
      case 'type':
        message = `Expected type ${err.params.type} but got ${typeof err.data}`;
        break;
      case 'enum':
        message = `Value must be one of: ${err.params.allowedValues.join(', ')}`;
        break;
      case 'pattern':
        message = `Value does not match required pattern: ${err.params.pattern}`;
        break;
      case 'minimum':
        message = `Value must be >= ${err.params.limit}`;
        break;
      case 'maximum':
        message = `Value must be <= ${err.params.limit}`;
        break;
      case 'minLength':
        message = `String must be at least ${err.params.limit} characters`;
        break;
      case 'maxLength':
        message = `String must be at most ${err.params.limit} characters`;
        break;
      case 'format':
        message = `Invalid ${err.params.format} format`;
        break;
      case 'additionalProperties':
        message = `Additional property not allowed: ${err.params.additionalProperty}`;
        break;
      default:
        message = err.message;
    }
    
    return {
      field: field.replace(/^\//, '').replace(/\//g, '.') || 'root',
      message,
      keyword: err.keyword,
      params: err.params
    };
  });
}

/**
 * Validate and throw if invalid
 * 
 * @param {object} data - Data to validate
 * @param {string} type - Type of validation ('report', 'input', 'finding')
 * @throws {Error} If validation fails
 */
function validateOrThrow(data, type = 'report') {
  let result;
  
  switch (type) {
    case 'report':
      result = validateScanReport(data);
      break;
    case 'input':
      result = validateScanInputData(data);
      break;
    case 'finding':
      result = validateSingleFinding(data);
      break;
    default:
      throw new Error(`Unknown validation type: ${type}`);
  }
  
  if (!result.valid) {
    const errorDetails = result.errors.map(e => `  - ${e.field}: ${e.message}`).join('\n');
    throw new Error(`Validation failed:\n${errorDetails}`);
  }
}

/**
 * Create a validation middleware for Express
 * 
 * @param {string} type - Type of validation
 * @returns {Function} Express middleware
 */
function validationMiddleware(type = 'input') {
  return (req, res, next) => {
    try {
      validateOrThrow(req.body, type);
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message,
        details: error.message.split('\n').slice(1) // Remove "Validation failed:" line
      });
    }
  };
}

module.exports = {
  validateScanReport,
  validateScanInputData,
  validateSingleFinding,
  validateOrThrow,
  validationMiddleware,
  // Export raw validators for testing
  _validators: {
    report: validateReport,
    scanInput: validateScanInput,
    finding: validateFinding
  }
};
