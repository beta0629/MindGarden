/**
 * pgApi webhook-secret PATCH 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-03-24
 */

jest.mock('../standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

import StandardizedApi from '../standardizedApi';
import { patchPgConfigurationWebhookSecret } from '../pgApi';

describe('pgApi.patchPgConfigurationWebhookSecret', () => {
  const TENANT_ID = 'tenant-pg-wh';
  const CONFIG_ID = 'cfg-pg-wh';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls StandardizedApi.patch with tenant base path and webhookSecret body', async () => {
    StandardizedApi.patch.mockResolvedValue({
      configId: CONFIG_ID,
      portoneWebhookSecretConfigured: true,
      settingsJson: '{"portoneChannelKey":"ck"}'
    });

    const result = await patchPgConfigurationWebhookSecret(TENANT_ID, CONFIG_ID, 'whsec_value');

    expect(StandardizedApi.patch).toHaveBeenCalledTimes(1);
    expect(StandardizedApi.patch).toHaveBeenCalledWith(
      `/api/v1/tenants/${TENANT_ID}/pg-configurations/${CONFIG_ID}/webhook-secret`,
      { webhookSecret: 'whsec_value' }
    );
    expect(result.portoneWebhookSecretConfigured).toBe(true);
    expect(result.settingsJson).not.toContain('portoneWebhookSecret');
  });
});
