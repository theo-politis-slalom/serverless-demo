import { ValidationError as YupValidationError } from 'yup';
import { ValidationError as APIValidationError } from './errorHandler';

// Validation function that validates data against a schema
export const validate = async <T>(
  data: unknown,
  schema: any // Yup schema type
): Promise<T> => {
  try {
    // Validate the data against the schema
    const result = await schema.validate(data, { 
      abortEarly: false,
      stripUnknown: true 
    });
    return result as T;
  } catch (error) {
    if (error instanceof YupValidationError) {
      const validationErrors = error.inner.map(err => ({
        path: err.path || 'unknown',
        message: err.message,
      }));
      throw new APIValidationError('Validation failed', { errors: validationErrors });
    }
    throw error;
  }
};

// Validation function that validates the request body against a schema using the validate function
export const validateRequest = async <T>(
  event: { body?: string | null },
  schema: any
): Promise<T> => {
  try {
    const requestBody = event.body ? JSON.parse(event.body) : {};
    return await validate<T>(requestBody, schema);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new APIValidationError('Validation failed', { errors: [{ path: 'body', message: 'Invalid JSON format' }] });
    }
    throw error;
  }
};
