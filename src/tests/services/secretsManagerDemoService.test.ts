import { SecretsManagerDemoService } from "../../services/secretsManagerDemoService";
import { SecretsManagerClientWrapper } from "../../clients/secretsManager";

// Mock the SecretsManagerClientWrapper
jest.mock("../../clients/secretsManager", () => ({
  SecretsManagerClientWrapper: {
    getInstance: jest.fn().mockReturnValue({
      getSecretValue: jest.fn(),
    }),
  },
}));

describe("SecretsManagerDemoService", () => {
  let service: SecretsManagerDemoService;
  let mockGetSecretValue: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SecretsManagerDemoService();
    mockGetSecretValue = SecretsManagerClientWrapper.getInstance()
      .getSecretValue as jest.Mock;
  });

  it("should return parsed JSON when secret is valid JSON", async () => {
    const mockSecret = { key: "value" };
    mockGetSecretValue.mockResolvedValue(JSON.stringify(mockSecret));

    const result = await service.process("test-secret");

    expect(result).toEqual(mockSecret);
    expect(mockGetSecretValue).toHaveBeenCalledWith("test-secret");
  });

  it("should return raw string when secret is not JSON", async () => {
    const mockSecret = "plain-text-secret";
    mockGetSecretValue.mockResolvedValue(mockSecret);

    const result = await service.process("test-secret");

    expect(result).toBe(mockSecret);
    expect(mockGetSecretValue).toHaveBeenCalledWith("test-secret");
  });

  it("should propagate errors from the client", async () => {
    const error = new Error("Secret not found");
    mockGetSecretValue.mockRejectedValue(error);

    await expect(service.process("test-secret")).rejects.toThrow(error);
    expect(mockGetSecretValue).toHaveBeenCalledWith("test-secret");
  });
});
