import { APIGatewayProxyEvent } from "aws-lambda";
import { ErrorWrapper } from "../utils/errorHandler";
import { SecretsManagerDemoService } from "../services/secretsManagerDemoService";

// Get the secret name from environment variables
const SECRET_NAME = process.env.SECRET_NAME || "demo-secret";

/**
 * Demo handler to demonstrate Secrets Manager integration
 */

// Initialize the service once when the Lambda container starts (Stops the need to initialize it on every invocation)
const secretsManagerService = new SecretsManagerDemoService();

const secretsManagerDemoHandler = async (event: APIGatewayProxyEvent) => {
  const secretName = SECRET_NAME;

  try {
    const parsedSecret = await secretsManagerService.process(secretName);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
      body: JSON.stringify({
        success: true,
        data: {
          secretName,
          secretValue: parsedSecret,
          message: "Successfully retrieved secret",
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
