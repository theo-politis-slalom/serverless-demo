import { ErrorWrapper, BadRequestError } from '../../utils/errorHandler';
import { APIGatewayProxyEvent } from 'aws-lambda';

describe('ErrorWrapper', () => {
  const mockEvent = {} as APIGatewayProxyEvent;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should pass through successful response', async () => {
    const handler = jest.fn().mockResolvedValue({ 
      statusCode: 200, 
      body: 'success' 
    });
    const wrappedHandler = ErrorWrapper(handler);
    
    const result = await wrappedHandler(mockEvent);
    
    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('success');
  });

  it('should handle BadRequestError', async () => {
    const handler = jest.fn().mockRejectedValue(new BadRequestError('Invalid input'));
    const wrappedHandler = ErrorWrapper(handler);
    
    const result = await wrappedHandler(mockEvent);
    const body = JSON.parse(result.body);
    
    expect(result.statusCode).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toMatchObject({
      type: 'BAD_REQUEST',
      message: 'Invalid input'
    });
  });

  it('should handle unknown errors', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('Unknown error'));
    const wrappedHandler = ErrorWrapper(handler);
    
    const result = await wrappedHandler(mockEvent);
    const body = JSON.parse(result.body);
    
    expect(result.statusCode).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toMatchObject({
      type: 'INTERNAL_SERVER_ERROR',
      code: 'UNHANDLED_ERROR',
      message: 'An unexpected error occurred'
    });
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });
});
