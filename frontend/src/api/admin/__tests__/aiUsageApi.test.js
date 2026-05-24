/**
 * aiUsageApi 헬퍼 단위 테스트.
 *
 * 트랙 B PR-4 (2026-05-24): /usage-stats, /usage-logs, /usage-logs/{id}/detail
 * 3개 엔드포인트가 StandardizedApi 를 경유하는지 검증한다.
 *
 * @see frontend/src/api/admin/aiUsageApi.js
 */

import StandardizedApi from '../../../utils/standardizedApi';
import {
  AI_USAGE_ENDPOINTS,
  getAiUsageStats,
  getAiUsageLogs,
  getAiUsageLogDetail
} from '../aiUsageApi';

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn()
  }
}));

describe('aiUsageApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AI_USAGE_ENDPOINTS 가 표준 어드민 경로를 사용한다', () => {
    expect(AI_USAGE_ENDPOINTS.STATS).toBe('/api/v1/admin/ai/usage-stats');
    expect(AI_USAGE_ENDPOINTS.LOGS).toBe('/api/v1/admin/ai/usage-logs');
    expect(AI_USAGE_ENDPOINTS.LOG_DETAIL(42)).toBe('/api/v1/admin/ai/usage-logs/42/detail');
  });

  it('getAiUsageStats(period) 가 StandardizedApi.get 에 query 로 전달된다', async() => {
    StandardizedApi.get.mockResolvedValueOnce({ tenantId: 't1', callsToday: 10 });

    await getAiUsageStats('today');

    expect(StandardizedApi.get).toHaveBeenCalledWith(
      '/api/v1/admin/ai/usage-stats',
      { period: 'today' }
    );
  });

  it('getAiUsageStats() period 미지정 시 빈 객체 전달', async() => {
    StandardizedApi.get.mockResolvedValueOnce({});

    await getAiUsageStats();

    expect(StandardizedApi.get).toHaveBeenCalledWith(
      '/api/v1/admin/ai/usage-stats',
      {}
    );
  });

  it('getAiUsageLogs(params) 가 필터·페이징 그대로 전달된다', async() => {
    StandardizedApi.get.mockResolvedValueOnce({ content: [] });

    await getAiUsageLogs({ provider: 'openai', caller: 'wellness', status: 'failed', page: 1, size: 30 });

    expect(StandardizedApi.get).toHaveBeenCalledWith(
      '/api/v1/admin/ai/usage-logs',
      { provider: 'openai', caller: 'wellness', status: 'failed', page: 1, size: 30 }
    );
  });

  it('getAiUsageLogDetail(id) 가 path param 으로 호출된다', async() => {
    StandardizedApi.get.mockResolvedValueOnce({ id: 7 });

    await getAiUsageLogDetail(7);

    expect(StandardizedApi.get).toHaveBeenCalledWith(
      '/api/v1/admin/ai/usage-logs/7/detail'
    );
  });

  it('네트워크 오류 시 예외를 그대로 throw 한다', async() => {
    const error = new Error('네트워크 오류');
    StandardizedApi.get.mockRejectedValueOnce(error);

    await expect(getAiUsageStats('today')).rejects.toThrow('네트워크 오류');
  });
});
