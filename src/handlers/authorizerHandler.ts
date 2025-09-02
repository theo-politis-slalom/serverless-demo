import { APIGatewayRequestAuthorizerEventV2 } from "aws-lambda";

// Simple HTTP API Lambda authorizer using simple responses
// Expects header: x-api-key
// Compares against environment variable API_KEY
interface SimpleAuthResponse {
  isAuthorized: boolean;
  principalId?: string;
  context?: Record<string, string | number | boolean | null>;
}

export const authorizer = async (
  event: APIGatewayRequestAuthorizerEventV2
): Promise<SimpleAuthResponse> => {
    // TODO Ideally this would come from SSM or Secrets Manager
    // For now, we'll use an environment variable
  try {
    const providedKey = event.headers?.["x-api-key"] || event.headers?.["X-API-Key"];
    const expectedKey = process.env.API_KEY;

    const isAuthorized = Boolean(providedKey && expectedKey && providedKey === expectedKey);

    return {
      isAuthorized,
      context: {
        reason: isAuthorized ? "authorized" : "invalid_api_key",
      },
    };
  } catch (err) {
    // In case of unexpected error, deny by default
    return {
      isAuthorized: false,
      context: {
        reason: "error",
      },
    };
  }
};
