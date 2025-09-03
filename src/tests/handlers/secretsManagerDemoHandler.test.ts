import { APIGatewayProxyEvent } from "aws-lambda";

describe("secretsManagerDemoHandler", () => {
  const mockEvent = {} as APIGatewayProxyEvent;

  const mockProcess = jest.fn();
  let consoleErrorSpy: jest.SpyInstance;

  // Mock the service implementation
  jest.mock("../../services/secretsManagerDemoService", () => {
    return {
      SecretsManagerDemoService: jest.fn().mockImplementation(() => ({
        process: mockProcess,
      })),
    };
  });

  // Import handler AFTER mocks are set up, to ensure the mocked service is used
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { handler } = require("../../handlers/secretsManagerDemoHandler");

  // Exceptions get thrown in some of the test making it noisy when running tests
  // This is just mocking the console.error to prevent that
  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should return secret value successfully", async () => {
    const mockSecret = { key: "value" };
    mockProcess.mockResolvedValueOnce(mockSecret);

    const result = await handler(mockEvent);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(body).toMatchObject({
      success: true,
      data: {
        secretValue: mockSecret,
        message: "Successfully retrieved secret",
        secretName: "demo-secret",
      },
    });
    expect(mockProcess).toHaveBeenCalled();
  });

  it("should handle service errors", async () => {
    mockProcess.mockRejectedValueOnce(new Error("Service error"));

    const result = await handler(mockEvent);
    const body = JSON.parse(result.body);

    expect(result.statusCode).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toMatchObject({
      type: "INTERNAL_SERVER_ERROR",
    });
    expect(mockProcess).toHaveBeenCalled();
  });

  it("should include CORS headers in response", async () => {
    mockProcess.mockResolvedValue("secret");

    const result = await handler(mockEvent);

    expect(result.headers).toMatchObject({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    });
  });
});
