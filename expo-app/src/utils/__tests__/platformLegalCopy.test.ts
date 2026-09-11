/**
 * platformLegalCopy — ## refund 섹션 추출·plain 변환
 *
 * @author MindGarden
 * @since 2026-09-11
 */

jest.mock('@/config/webBaseUrl', () => ({
  getWebBaseUrl: jest.fn(() => 'https://dev.core-solution.co.kr'),
}));

import { PLATFORM_LEGAL_SECTIONS } from '@/constants/legalPublic';
import {
  extractPlatformLegalSection,
  renderQuietLegalPlainFromMarkdown,
} from '@/utils/platformLegalCopy';

const SAMPLE_MD = `## terms

약관 본문

## privacy

개인정보 본문

## refund

### 메타

- 공개 경로 SSOT

# 환불·취소·청약철회 안내

## 1. 청약철회 기간

1. 이용자는 7일 이내에 청약철회를 할 수 있습니다.
`;

describe('extractPlatformLegalSection', () => {
  test('## refund 섹션만 추출한다', () => {
    const section = extractPlatformLegalSection(
      SAMPLE_MD,
      PLATFORM_LEGAL_SECTIONS.REFUND,
    );
    expect(section).toContain('청약철회 기간');
    expect(section).not.toContain('약관 본문');
    expect(section).not.toContain('개인정보 본문');
  });

  test('없는 섹션은 빈 문자열', () => {
    expect(
      extractPlatformLegalSection('## terms\n\nx', PLATFORM_LEGAL_SECTIONS.REFUND),
    ).toBe('');
  });
});

describe('renderQuietLegalPlainFromMarkdown', () => {
  test('헤딩·리스트를 plain 으로 변환한다', () => {
    const plain = renderQuietLegalPlainFromMarkdown(
      extractPlatformLegalSection(SAMPLE_MD, PLATFORM_LEGAL_SECTIONS.REFUND),
    );
    expect(plain).toContain('청약철회 기간');
    expect(plain).toContain('• 공개 경로 SSOT');
    expect(plain).toContain('1. 이용자는 7일 이내에');
    expect(plain).not.toMatch(/^### /m);
  });
});
