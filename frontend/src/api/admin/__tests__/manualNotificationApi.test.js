/**
 * manualNotificationApi 헬퍼 단위 테스트.
 *
 * 수신자 검색 API 파라미터가 백엔드(@RequestParam search)와 일치하는지 검증한다.
 *
 * @see frontend/src/api/admin/manualNotificationApi.js
 */

import StandardizedApi from '../../../utils/standardizedApi';
import {
  MANUAL_NOTIFICATION_ENDPOINTS,
  searchRecipients
} from '../manualNotificationApi';

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

describe('manualNotificationApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('MANUAL_NOTIFICATION_ENDPOINTS.RECIPIENTS 가 표준 경로를 사용한다', () => {
    expect(MANUAL_NOTIFICATION_ENDPOINTS.RECIPIENTS).toBe(
      '/api/v1/admin/manual-notifications/recipients'
    );
  });

  it('searchRecipients({ search }) 가 백엔드 search 쿼리로 전달된다', async() => {
    StandardizedApi.get.mockResolvedValueOnce([]);

    await searchRecipients({ search: '이' });

    expect(StandardizedApi.get).toHaveBeenCalledWith(
      MANUAL_NOTIFICATION_ENDPOINTS.RECIPIENTS,
      { search: '이' }
    );
  });

  it('searchRecipients() 검색어 미지정 시 빈 params 전달', async() => {
    StandardizedApi.get.mockResolvedValueOnce([]);

    await searchRecipients();

    expect(StandardizedApi.get).toHaveBeenCalledWith(
      MANUAL_NOTIFICATION_ENDPOINTS.RECIPIENTS,
      {}
    );
  });
});
