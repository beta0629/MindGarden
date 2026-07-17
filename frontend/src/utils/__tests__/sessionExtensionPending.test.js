/**
 * sessionExtensionPending — attachPendingSessionExtensions 스모크
 */
import {
  attachPendingSessionExtensions,
  normalizePendingSessionExtension,
  SESSION_EXTENSION_UI
} from '../sessionExtensionPending';

describe('sessionExtensionPending', () => {
  test('PENDING 요청을 mappingId로 부착한다', () => {
    const mappings = [
      { id: 1, packageName: '기본10회', totalSessions: 10 },
      { id: 2, packageName: '하이브리드', totalSessions: 8 }
    ];
    const pending = [
      {
        id: 101,
        mappingId: 2,
        additionalSessions: 5,
        packagePrice: 400000,
        status: 'PENDING'
      }
    ];

    const result = attachPendingSessionExtensions(mappings, pending);
    expect(result[0].pendingSessionExtension).toBeNull();
    expect(result[1].pendingSessionExtension).toEqual(
      expect.objectContaining({
        id: 101,
        mappingId: 2,
        additionalSessions: 5,
        amount: 400000
      })
    );
  });

  test('UI 상수에 통합스케줄 안내가 포함된다', () => {
    expect(SESSION_EXTENSION_UI.SUCCESS_HINT).toContain('통합 스케줄');
    expect(normalizePendingSessionExtension({ id: 1, mappingId: 9 }).mappingId).toBe(9);
  });
});
