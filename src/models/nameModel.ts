import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as yup from 'yup';

export interface NameRequestBody {
  name: string;
}

export interface NameResponseData {
  message: string;
  environment: string;
  timestamp: string;
}

export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export type APIGatewayResponse = APIGatewayProxyResult & {
  body: string;
};

// Request validation schema
export const nameRequestSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .matches(/^[a-zA-Z\s-]+$/, 'Name can only contain letters, spaces, and hyphens'),
});

// Type for validated request data
export type ValidatedNameRequest = yup.InferType<typeof nameRequestSchema>;

// Validation error type
export interface ValidationError {
  path: string;
  message: string;
}

// Validation result type
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Validates the request body against the schema
 */
export const validateRequest = async <T>(
  data: unknown,
  schema: yup.AnySchema
): Promise<ValidationResult<T>> => {
  try {
    const validatedData = await schema.validate(data, { abortEarly: false });
    return { isValid: true, data: validatedData as T };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const validationErrors: ValidationError[] = error.inner.map((err) => ({
        path: err.path || 'unknown',
        message: err.message,
      }));
      return { isValid: false, errors: validationErrors };
    }
    throw error;
  }
};
