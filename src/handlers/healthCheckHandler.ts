import { APIGatewayProxyEvent } from 'aws-lambda';
import { HealthCheckService, HealthCheckResponse } from '../services/healthCheckService';
import { ErrorWrapper } from '../utils/errorHandler';

/**
 * Health check handler that returns the current status of the service
 */
const healthCheckHandler = async (event: APIGatewayProxyEvent) => {
  // Get health status from the service
  const response = await HealthCheckService.checkHealth();
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
    body: JSON.stringify({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    }),
  };
};

// Wrap the handler with error handling
export const handler = ErrorWrapper(healthCheckHandler);
