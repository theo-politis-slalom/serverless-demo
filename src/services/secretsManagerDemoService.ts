import { SecretsManagerClientWrapper } from "../clients/secretsManager";

export class SecretsManagerDemoService {
  private secretsManager = SecretsManagerClientWrapper.getInstance();

  public async process(secretName: string): Promise<unknown> {
    const secretValue = await this.secretsManager.getSecretValue(secretName);

    try {
      return JSON.parse(secretValue);
    } catch {
      return secretValue;
    }
  }
}
