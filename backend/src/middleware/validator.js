// Input validation middleware using simple validation
// (Lightweight alternative to joi/zod — can be swapped later)

/**
 * Validates that the request body contains all required fields and they
 * pass basic type checks.
 *
 * @param {Object} schema - { fieldName: { type, required, min, max, enum } }
 */
const validate = (schema) => (req, res, next) => {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = req.body[field];

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`'${field}' is required`);
      continue;
    }

    // Skip optional missing fields
    if (value === undefined || value === null) continue;

    // Type check
    if (rules.type === 'string' && typeof value !== 'string') {
      errors.push(`'${field}' must be a string`);
    } else if (rules.type === 'number' && typeof value !== 'number') {
      errors.push(`'${field}' must be a number`);
    } else if (rules.type === 'array' && !Array.isArray(value)) {
      errors.push(`'${field}' must be an array`);
    }

    // Min/Max for numbers
    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`'${field}' must be at least ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`'${field}' must be at most ${rules.max}`);
      }
    }

    // String length
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        errors.push(`'${field}' must be at least ${rules.minLength} characters`);
      }
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        errors.push(`'${field}' must be at most ${rules.maxLength} characters`);
      }
    }

    // Enum check
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`'${field}' must be one of: ${rules.enum.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors,
    });
  }

  next();
};

// Pre-built validation schemas for common endpoints
const testGenerationSchema = {
  subject: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  topic: { type: 'string', required: false, minLength: 1, maxLength: 100 },
  numberOfQuestions: { type: 'number', required: false, min: 5, max: 50 },
  difficulty: {
    type: 'string',
    required: false,
    enum: ['easy', 'medium', 'hard', 'adaptive'],
  },
  timeLimit: { type: 'number', required: false, min: 1, max: 120 },
  userAvgScore: { type: 'number', required: false, min: 0, max: 100 },
};

module.exports = { validate, testGenerationSchema };
