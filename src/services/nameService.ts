import { NameResponseData } from '../models/nameModel';

/**
 * Service for handling name-related business logic
 */
export class NameService {
  /**
   * Process a name and return a greeting
   * @param name - The name to greet (already validated)
   * @returns A greeting response
   */
  public static async processName(name: string): Promise<NameResponseData> {
    return {
      message: `Hello, ${name}!`,
      environment: process.env.ENVIRONMENT || 'dev',
      timestamp: new Date().toISOString(),
    };
  }
}
