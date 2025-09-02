import { InternalServerError } from '../utils/errorHandler';
import { bytesToMB } from '../utils/numbers';

/**
 * Service for handling health check operations
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  environment: string;
  uptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

export class HealthCheckService {
  /**
   * Get the current health status of the service
   * @returns Health check response with system information
   */
  public static async checkHealth(): Promise<HealthCheckResponse> {
    try {
      // TODO fix process throwing linting errors dues through ESlint "process" is built into JS
      const memoryUsage = process.memoryUsage();
      // For Demo purposes only lots of the information here does not need to be sent back from the API simple 200 will suffice
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.ENVIRONMENT || 'dev',
        uptime: process.uptime(),
        memoryUsage: {
          rss: bytesToMB(memoryUsage.rss),
          heapTotal: bytesToMB(memoryUsage.heapTotal),
          heapUsed: bytesToMB(memoryUsage.heapUsed),
          external: bytesToMB(memoryUsage.external),
        },
      };
    } catch (error) {
      // Log the error for debugging
      console.error('Health check failed:', error);
      
      // Re-throw as an internal server error
      throw new InternalServerError('Failed to perform health check', 'HEALTH_CHECK_FAILED');
    }
  }

  /**
   * Convert bytes to megabytes
   * @param bytes - The number of bytes
   * @returns The number of megabytes
   */
  // Bytes to MB conversion is now handled by the numbers utility
}
