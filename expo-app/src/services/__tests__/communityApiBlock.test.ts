/**
 * Apple T2 (1.2 UGC) — communityApi 차단/신고 단위 테스트.
 *
 * <p>{@code blockRemoteCommunityUser}, {@code unblockRemoteCommunityUser},
 * {@code fetchRemoteCommunityBlockedUsers}, {@code createRemoteCommunityReport} 가
 * `apiPost`/`apiDelete`/`apiGet` 을 올바른 엔드포인트와 페이로드로 호출하는지 검증한다.</p>
 */

jest.mock('@/api/client', () => ({
  __esModule: true,
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiDelete: jest.fn(),
  apiPatch: jest.fn(),
}));

import {
  blockRemoteCommunityUser,
  createRemoteCommunityReport,
  fetchRemoteCommunityBlockedUsers,
  unblockRemoteCommunityUser,
} from '../communityApi';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const apiClient = require('@/api/client');

describe('communityApi — Apple T2 1.2 UGC 차단·신고 헬퍼', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('blockRemoteCommunityUser: POST /api/v1/community/users/{id}/block', async () => {
    apiClient.apiPost.mockResolvedValueOnce({});
    await blockRemoteCommunityUser(123, '광고성');
    expect(apiClient.apiPost).toHaveBeenCalledWith(
      '/api/v1/community/users/123/block',
      { reason: '광고성' },
    );
  });

  test('blockRemoteCommunityUser: reason 미지정 시 빈 페이로드', async () => {
    apiClient.apiPost.mockResolvedValueOnce({});
    await blockRemoteCommunityUser(456);
    expect(apiClient.apiPost).toHaveBeenCalledWith(
      '/api/v1/community/users/456/block',
      {},
    );
  });

  test('unblockRemoteCommunityUser: DELETE /api/v1/community/users/{id}/block', async () => {
    apiClient.apiDelete.mockResolvedValueOnce({});
    await unblockRemoteCommunityUser(789);
    expect(apiClient.apiDelete).toHaveBeenCalledWith(
      '/api/v1/community/users/789/block',
    );
  });

  test('fetchRemoteCommunityBlockedUsers: GET 결과 정규화', async () => {
    const sample = [
      { id: 1, blockedUserId: 100, blockedDisplayName: '익명123', blockedAt: '2026-06-01T00:00:00' },
    ];
    apiClient.apiGet.mockResolvedValueOnce({ data: sample });
    const result = await fetchRemoteCommunityBlockedUsers();
    expect(apiClient.apiGet).toHaveBeenCalledWith('/api/v1/community/users/blocked');
    expect(result).toEqual(sample);
  });

  test('fetchRemoteCommunityBlockedUsers: 비배열 응답은 빈 배열로 안전하게 처리', async () => {
    apiClient.apiGet.mockResolvedValueOnce({ data: null });
    const result = await fetchRemoteCommunityBlockedUsers();
    expect(result).toEqual([]);
  });

  test('createRemoteCommunityReport: P2-C 5종 — SELF_HARM 전송', async () => {
    apiClient.apiPost.mockResolvedValueOnce({});
    await createRemoteCommunityReport(5001, {
      reasonCode: 'SELF_HARM',
      detailMessage: '자해 조장',
      commentId: 9001,
    });
    expect(apiClient.apiPost).toHaveBeenCalledWith(
      '/api/v1/community/5001/reports',
      expect.objectContaining({
        reasonCode: 'SELF_HARM',
        commentId: 9001,
      }),
    );
  });

  test('createRemoteCommunityReport: 레거시 코드(ABUSIVE_LANGUAGE)도 타입상 허용', async () => {
    apiClient.apiPost.mockResolvedValueOnce({});
    await createRemoteCommunityReport(5001, {
      reasonCode: 'ABUSIVE_LANGUAGE',
      detailMessage: '욕설',
    });
    expect(apiClient.apiPost).toHaveBeenCalledWith(
      '/api/v1/community/5001/reports',
      expect.objectContaining({ reasonCode: 'ABUSIVE_LANGUAGE' }),
    );
  });
});
