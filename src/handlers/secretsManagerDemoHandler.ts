import { APIGatewayProxyEvent } from 'aws-lambda';
import { SecretsManagerClientWrapper } from '../clients/secretsManager';
import { ErrorWrapper } from '../utils/errorHandler';
import { BadRequestError } from '../utils/errorHandler';

// Get the secret name from environment variables
const SECRET_NAME = process.env.SECRET_NAME || 'demo-secret';

/**
 * Demo handler to demonstrate Secrets Manager integration
 */
const secretsManagerDemoHandler = async (event: APIGatewayProxyEvent) => {
  // Use the environment variable for the secret name
  const secretName = SECRET_NAME;

  try {
    // Get the secret value
    const secretsManager = SecretsManagerClientWrapper.getInstance();
    const secretValue = await secretsManager.getSecretValue(secretName);
    
    // Parse the secret if it's a JSON string
    let parsedSecret: unknown;
    try {
      parsedSecret = JSON.parse(secretValue);
    } catch {
      parsedSecret = secretValue; // Return as string if not JSON
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        data: {
          secretName,
          secretValue: parsedSecret,
          message: 'Successfully retrieved secret',
        },
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    // TODO Log the error to a logging service
    console.error(`Failed to retrieve secret '${secretName}':`, error);
    throw error; // Will be handled by ErrorWrapper
  }
};

// Wrap the handler with error handling
export const handler = ErrorWrapper(secretsManagerDemoHandler);
