/**
 * withdrawalApi — 웹 mypageApi 계약(비밀번호·사유·커뮤니티 옵션) 단위 테스트.
 */

jest.mock('@/api/client', () => ({
  __esModule: true,
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

import {
  cancelWithdrawal,
  getWithdrawalStatus,
  requestWithdrawal,
} from '../withdrawalApi';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const apiClient = require('@/api/client');

describe('withdrawalApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('requestWithdrawal: POST password/reason/deleteCommunityBody', async () => {
    apiClient.apiPost.mockResolvedValueOnce({
      success: true,
      data: {
        userId: 1,
        lifecycleState: 'WITHDRAWAL_PENDING',
        graceDays: 30,
      },
    });
    const result = await requestWithdrawal({
      password: 'secret',
      reason: '서비스 이용 빈도가 낮음',
      deleteCommunityBody: true,
    });
    expect(apiClient.apiPost).toHaveBeenCalledWith('/api/v1/mypage/withdrawal/request', {
      password: 'secret',
      reason: '서비스 이용 빈도가 낮음',
      deleteCommunityBody: true,
    });
    expect(result.lifecycleState).toBe('WITHDRAWAL_PENDING');
  });

  test('requestWithdrawal: blank password throws before network', async () => {
    await expect(requestWithdrawal({ password: '   ' })).rejects.toThrow(
      'WITHDRAWAL_PASSWORD_REQUIRED',
    );
    expect(apiClient.apiPost).not.toHaveBeenCalled();
  });

  test('cancelWithdrawal: POST /cancel', async () => {
    apiClient.apiPost.mockResolvedValueOnce({
      success: true,
      data: { userId: 1, lifecycleState: 'ACTIVE' },
    });
    const result = await cancelWithdrawal();
    expect(apiClient.apiPost).toHaveBeenCalledWith('/api/v1/mypage/withdrawal/cancel', {});
    expect(result.lifecycleState).toBe('ACTIVE');
  });

  test('getWithdrawalStatus: GET /status', async () => {
    apiClient.apiGet.mockResolvedValueOnce({
      success: true,
      data: {
        lifecycleState: 'WITHDRAWAL_PENDING',
        cancellable: true,
      },
    });
    const result = await getWithdrawalStatus();
    expect(apiClient.apiGet).toHaveBeenCalledWith('/api/v1/mypage/withdrawal/status');
    expect(result.cancellable).toBe(true);
  });
});
