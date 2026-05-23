/**
 * aiHealthApi 헬퍼 단위 테스트.
 *
 * 트랙 B PR-3 (2026-05-23): GET /api/v1/admin/ai/health 호출이
 * StandardizedApi 를 경유하는지 검증한다.
 *
 * @see frontend/src/api/admin/aiHealthApi.js
 */

import StandardizedApi from '../../../utils/standardizedApi';
import { getAiProviderHealth, AI_HEALTH_ENDPOINTS } from '../aiHealthApi';

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn()
  }
}));

describe('aiHealthApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AI_HEALTH_ENDPOINTS.HEALTH 가 표준 어드민 경로를 사용한다', () => {
    expect(AI_HEALTH_ENDPOINTS.HEALTH).toBe('/api/v1/admin/ai/health');
  });

  it('getAiProviderHealth 가 StandardizedApi.get 으로 호출된다', async() => {
    const fixture = {
      tenantId: 'tenant-pr3',
      activeProvider: 'openai',
      openaiKeyRegistered: true,
      geminiKeyRegistered: false,
      checkedAt: '2026-05-23T12:00:00Z'
    };
    StandardizedApi.get.mockResolvedValueOnce(fixture);

    const result = await getAiProviderHealth();

    expect(StandardizedApi.get).toHaveBeenCalledTimes(1);
    expect(StandardizedApi.get).toHaveBeenCalledWith('/api/v1/admin/ai/health');
    expect(result).toEqual(fixture);
  });

  it('헬스 API 가 ApiResponse 래퍼 unwrap 후 객체를 그대로 반환한다', async() => {
    const fixture = {
      tenantId: 'tenant-pr3-2',
      activeProvider: 'gemini',
      openaiKeyRegistered: false,
      geminiKeyRegistered: true,
      checkedAt: '2026-05-23T13:00:00Z'
    };
    StandardizedApi.get.mockResolvedValueOnce(fixture);

    const result = await getAiProviderHealth();

    expect(result.activeProvider).toBe('gemini');
    expect(result.geminiKeyRegistered).toBe(true);
    expect(result.openaiKeyRegistered).toBe(false);
  });

  it('네트워크 오류 시 예외를 그대로 throw 한다', async() => {
    const error = new Error('헬스체크 실패');
    StandardizedApi.get.mockRejectedValueOnce(error);

    await expect(getAiProviderHealth()).rejects.toThrow('헬스체크 실패');
  });
});
