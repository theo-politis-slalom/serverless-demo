import { SecretsManagerClient, GetSecretValueCommand, GetSecretValueCommandInput } from '@aws-sdk/client-secrets-manager';

/**
 * Client for interacting with AWS Secrets Manager
 */
export class SecretsManagerClientWrapper {
  private client: SecretsManagerClient;
  private static instance: SecretsManagerClientWrapper;

  private constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1', // TODO Change this default value to what you want it to be
    });
  }

  /**
   * Get the singleton instance of SecretsManagerClientWrapper
   */
  public static getInstance(): SecretsManagerClientWrapper {
    if (!SecretsManagerClientWrapper.instance) {
      SecretsManagerClientWrapper.instance = new SecretsManagerClientWrapper();
    }
    return SecretsManagerClientWrapper.instance;
  }

  /**
   * Get a secret value from AWS Secrets Manager
   * @param secretId - The ID or ARN of the secret
   * @returns The secret value as a string
   * @throws Error if the secret cannot be retrieved
   */
  public async getSecretValue(secretId: string): Promise<string> {
    const params: GetSecretValueCommandInput = {
      SecretId: secretId,
    };

    try {
      const command = new GetSecretValueCommand(params);
      const response = await this.client.send(command);

      if (response.SecretString) {
        return response.SecretString;
      } else if (response.SecretBinary) {
        return Buffer.from(response.SecretBinary.toString(), 'base64').toString('ascii');
      }

      throw new Error('No secret value found');
    } catch (error) {
      console.error(`Error retrieving secret ${secretId}:`, error);
      throw new Error(`Failed to retrieve secret: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a secret value and parse it as JSON
   * @param secretId - The ID or ARN of the secret
   * @returns The parsed JSON object
   * @throws Error if the secret cannot be retrieved or parsed
   */
  public async getSecretJson<T = any>(secretId: string): Promise<T> {
    try {
      const secretValue = await this.getSecretValue(secretId);
      return JSON.parse(secretValue) as T;
    } catch (error) {
      console.error(`Error parsing secret ${secretId} as JSON:`, error);
      throw new Error(`Failed to parse secret as JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const secretsManager = SecretsManagerClientWrapper.getInstance();
