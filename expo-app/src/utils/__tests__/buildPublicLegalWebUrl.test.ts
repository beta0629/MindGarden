/**
 * buildPublicLegalWebUrl — 테넌트 서브도메인 호스트
 *
 * @author MindGarden
 * @since 2026-09-11
 */

jest.mock('@/config/webBaseUrl', () => ({
  getWebBaseUrl: jest.fn(),
}));

import { getWebBaseUrl } from '@/config/webBaseUrl';
import { buildPublicLegalWebUrl } from '@/utils/buildPublicLegalWebUrl';

const mockedGetWebBaseUrl = getWebBaseUrl as jest.MockedFunction<
  typeof getWebBaseUrl
>;

describe('buildPublicLegalWebUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('apex 호스트에 tenantCode 를 앞에 붙인다', () => {
    mockedGetWebBaseUrl.mockReturnValue('https://dev.core-solution.co.kr');
    expect(buildPublicLegalWebUrl('/legal/refund', 'mindgarden')).toBe(
      'https://mindgarden.dev.core-solution.co.kr/legal/refund',
    );
  });

  test('이미 테넌트 호스트면 첫 라벨을 교체한다', () => {
    mockedGetWebBaseUrl.mockReturnValue(
      'https://other.dev.core-solution.co.kr/',
    );
    expect(buildPublicLegalWebUrl('/legal/terms', 'mindgarden')).toBe(
      'https://mindgarden.dev.core-solution.co.kr/legal/terms',
    );
  });

  test('tenantCode 없으면 base + path', () => {
    mockedGetWebBaseUrl.mockReturnValue('https://dev.core-solution.co.kr');
    expect(buildPublicLegalWebUrl('/legal/privacy')).toBe(
      'https://dev.core-solution.co.kr/legal/privacy',
    );
  });
});
