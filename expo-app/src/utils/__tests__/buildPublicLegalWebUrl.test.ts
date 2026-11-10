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

  test('app. env 마커를 tenant 로 교체한다 (prepend 금지)', () => {
    mockedGetWebBaseUrl.mockReturnValue('https://app.core-solution.co.kr');
    expect(buildPublicLegalWebUrl('/legal/privacy', 'mindgarden')).toBe(
      'https://mindgarden.core-solution.co.kr/legal/privacy',
    );
  });

  test('dev. env 마커를 tenant 로 교체한다', () => {
    mockedGetWebBaseUrl.mockReturnValue('https://dev.core-solution.co.kr');
    expect(buildPublicLegalWebUrl('/legal/refund', 'mindgarden')).toBe(
      'https://mindgarden.core-solution.co.kr/legal/refund',
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

  test('bare apex 에는 tenant 를 prepend 한다', () => {
    mockedGetWebBaseUrl.mockReturnValue('https://example.com');
    expect(buildPublicLegalWebUrl('/legal/terms', 'acme')).toBe(
      'https://acme.example.com/legal/terms',
    );
  });

  test('tenantCode 없으면 base + path', () => {
    mockedGetWebBaseUrl.mockReturnValue('https://app.core-solution.co.kr');
    expect(buildPublicLegalWebUrl('/legal/privacy')).toBe(
      'https://app.core-solution.co.kr/legal/privacy',
    );
  });

  test('getWebBaseUrl(env) 오버라이드를 그대로 따른다', () => {
    mockedGetWebBaseUrl.mockReturnValue('https://staging.core-solution.co.kr');
    expect(buildPublicLegalWebUrl('/legal/privacy', 'tenantx')).toBe(
      'https://tenantx.core-solution.co.kr/legal/privacy',
    );
  });
});
