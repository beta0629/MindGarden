/**
 * Apple G1.2 UGC (P2-C) — EULA consent service 단위 테스트.
 *
 * <p>{@code fetchEulaConsentStatus} / {@code submitEulaConsent} 가
 * `/api/v1/users/me/eula-consent` 를 올바른 메서드·본문으로 호출하는지 검증.</p>
 */

jest.mock('@/api/client', () => ({
  __esModule: true,
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

import {
  fetchEulaConsentStatus,
  submitEulaConsent,
} from '../eulaConsentService';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const apiClient = require('@/api/client');

const ENDPOINT = '/api/v1/users/me/eula-consent';

describe('eulaConsentService — P2-C EULA 동의 API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetchEulaConsentStatus: GET /api/v1/users/me/eula-consent — unwrap 결과 반환', async () => {
    apiClient.apiGet.mockResolvedValueOnce({
      success: true,
      data: {
        currentVersion: '1.0.0',
        acceptedVersion: null,
        acceptedAt: null,
        marketingConsent: false,
        requiresReconsent: true,
      },
    });
    const result = await fetchEulaConsentStatus();
    expect(apiClient.apiGet).toHaveBeenCalledWith(ENDPOINT);
    expect(result.requiresReconsent).toBe(true);
    expect(result.currentVersion).toBe('1.0.0');
  });

  test('fetchEulaConsentStatus: 응답 unwrap 실패 시 throw', async () => {
    apiClient.apiGet.mockResolvedValueOnce(null);
    await expect(fetchEulaConsentStatus()).rejects.toThrow('EULA_STATUS_PARSE_FAILED');
  });

  test('submitEulaConsent: POST /api/v1/users/me/eula-consent — termsConsent/privacyConsent/termsVersion 전송', async () => {
    apiClient.apiPost.mockResolvedValueOnce({
      success: true,
      data: {
        currentVersion: '1.0.0',
        acceptedVersion: '1.0.0',
        acceptedAt: '2026-06-11T00:00:00',
        marketingConsent: true,
        requiresReconsent: false,
      },
    });
    const result = await submitEulaConsent({
      termsConsent: true,
      privacyConsent: true,
      marketingConsent: true,
      termsVersion: '1.0.0',
    });
    expect(apiClient.apiPost).toHaveBeenCalledWith(
      ENDPOINT,
      expect.objectContaining({
        termsConsent: true,
        privacyConsent: true,
        marketingConsent: true,
        termsVersion: '1.0.0',
      }),
    );
    expect(result.requiresReconsent).toBe(false);
    expect(result.acceptedVersion).toBe('1.0.0');
  });
});
