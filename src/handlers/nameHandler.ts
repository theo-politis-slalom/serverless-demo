import { APIGatewayProxyEvent } from 'aws-lambda';
import { NameService } from '../services/nameService';
import { validateRequest } from '../utils/validation';
import { nameRequestSchema } from '../models/nameModel';
import { 
  ErrorWrapper,
  BadRequestError,
  ValidationError 
} from '../utils/errorHandler';

/**
 * Handles POST requests with a name in the request body
 * @param event - The API Gateway event containing the name in the request body
 * @returns Promise with the greeting response
 */
const nameHandler = async (event: APIGatewayProxyEvent) => {
  console.log('Event: ', JSON.stringify(event, null, 2));
  
  // Validate the request using the new validation utility
  const { name } = await validateRequest<{ name: string }>(event, nameRequestSchema);
  
  // Process the name using the service
  const result = await NameService.processName(name);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    }),
  };
};

// Wrap the handler with error handling
export const handler = ErrorWrapper(nameHandler);
