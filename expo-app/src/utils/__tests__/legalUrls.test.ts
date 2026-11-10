/**
 * resolveLegalUrls — env 우선, 없으면 공개 /legal/* 호스트 빌더
 *
 * @author MindGarden
 * @since 2026-11-10
 */

jest.mock('@/config/webBaseUrl', () => ({
  getWebBaseUrl: jest.fn(),
}));

import { getWebBaseUrl } from '@/config/webBaseUrl';
import { resolveLegalUrls } from '@/utils/legalUrls';

const mockedGetWebBaseUrl = getWebBaseUrl as jest.MockedFunction<
  typeof getWebBaseUrl
>;

describe('resolveLegalUrls', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_TERMS_URL;
    delete process.env.EXPO_PUBLIC_PRIVACY_URL;
    mockedGetWebBaseUrl.mockReturnValue('https://app.core-solution.co.kr');
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('env 없으면 /legal/privacy·/legal/terms 로 공개 호스트를 쓴다', () => {
    const urls = resolveLegalUrls('mindgarden');
    expect(urls.privacy).toBe(
      'https://mindgarden.core-solution.co.kr/legal/privacy',
    );
    expect(urls.terms).toBe(
      'https://mindgarden.core-solution.co.kr/legal/terms',
    );
  });

  test('env URL 이 있으면 그대로 우선한다', () => {
    process.env.EXPO_PUBLIC_TERMS_URL = 'https://example.com/custom-terms';
    process.env.EXPO_PUBLIC_PRIVACY_URL = 'https://example.com/custom-privacy';
    const urls = resolveLegalUrls('mindgarden');
    expect(urls).toEqual({
      terms: 'https://example.com/custom-terms',
      privacy: 'https://example.com/custom-privacy',
    });
  });
});
