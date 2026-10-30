/**
 * MYPAGE withdrawal endpoint constants — App Store 5.1.1(v) 계약 회귀.
 * (client/RN 의존 없이 endpoints 상수만 검증)
 */
import { API_ENDPOINTS, MYPAGE_API } from '@/api/endpoints';

describe('MYPAGE_API withdrawal endpoints', () => {
  it('mirrors web /api/v1/mypage/withdrawal/* contract', () => {
    expect(MYPAGE_API.WITHDRAWAL_REQUEST).toBe('/api/v1/mypage/withdrawal/request');
    expect(MYPAGE_API.WITHDRAWAL_CANCEL).toBe('/api/v1/mypage/withdrawal/cancel');
    expect(MYPAGE_API.WITHDRAWAL_STATUS).toBe('/api/v1/mypage/withdrawal/status');
    expect(API_ENDPOINTS.MYPAGE).toBe(MYPAGE_API);
  });
});
