import { APIGatewayProxyResult } from 'aws-lambda';

export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST'
}

export interface APIError extends Error {
  statusCode: number;
  type: ErrorType;
  details?: Record<string, unknown>;
  code?: string;
}

export class ValidationError extends Error implements APIError {
  statusCode = 400;
  type = ErrorType.VALIDATION;
  details: Record<string, unknown>;

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class NotFoundError extends Error implements APIError {
  statusCode = 404;
  type = ErrorType.NOT_FOUND;

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error implements APIError {
  statusCode = 401;
  type = ErrorType.UNAUTHORIZED;

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error implements APIError {
  statusCode = 403;
  type = ErrorType.FORBIDDEN;

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class InternalServerError extends Error implements APIError {
  statusCode = 500;
  type = ErrorType.INTERNAL;
  code?: string;

  constructor(message: string = 'Internal server error', code?: string) {
    super(message);
    this.name = 'InternalServerError';
    this.code = code;
  }
}

export class BadRequestError extends Error implements APIError {
  statusCode = 400;
  type = ErrorType.BAD_REQUEST;

  constructor(message: string = 'Bad request') {
    super(message);
    this.name = 'BadRequestError';
  }
}

export const errorHandler = (error: unknown): APIGatewayProxyResult => {
  console.error('Error:', error);

  // Default error response
  let statusCode = 500;
  let errorType = ErrorType.INTERNAL;
  let message = 'An unexpected error occurred';
  let details: Record<string, unknown> | undefined;
  let errorCode: string | undefined;

  // Handle known error types
  if (error instanceof ValidationError) {
    statusCode = error.statusCode;
    errorType = error.type;
    message = error.message;
    details = error.details;
  } 
  else if (error instanceof NotFoundError || 
           error instanceof UnauthorizedError ||
           error instanceof ForbiddenError ||
           error instanceof BadRequestError) {
    statusCode = error.statusCode;
    errorType = error.type as ErrorType;
    message = error.message;
  }
  else if (error instanceof Error) {
    // Handle other Error instances (do not expose internal messages)
    // Log the real error but return a generic message to the client
    message = 'An unexpected error occurred';
    errorCode = 'UNHANDLED_ERROR';
  }

  // Log additional details for internal server errors
  if (statusCode >= 500) {
    // TODO fix eslint errors for typescript
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace available');
  }

  // Prepare error response
  const errorResponse: any = {
    success: false,
    error: {
      type: errorType,
      message,
      ...(details && { details }),
      ...(errorCode && { code: errorCode }),
      timestamp: new Date().toISOString(),
      environment: process.env.ENVIRONMENT || 'development',
    },
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(errorResponse),
  };
};

/**
 * Wraps a Lambda handler function with error handling
 * @param handler - The Lambda handler function to wrap
 * @returns A new handler function with error handling
 */
export const ErrorWrapper = <T>(
  handler: (event: T) => Promise<APIGatewayProxyResult>
) => {
  return async (event: T): Promise<APIGatewayProxyResult> => {
    try {
      return await handler(event);
    } catch (error) {
      return errorHandler(error);
    }
  };
};
