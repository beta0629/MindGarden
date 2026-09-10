/**
 * platformLegalCopy 섹션 파서
 *
 * @author CoreSolution
 * @since 2026-09-10
 */

import {
  extractPlatformLegalSection,
  renderQuietLegalHtmlFromMarkdown
} from '../platformLegalCopy';
import { PLATFORM_LEGAL_SECTIONS } from '../../constants/legalPublic';

const SAMPLE = `# title

## terms

### 메타

# 이용약관

본문 약관입니다.

## privacy

# 개인정보처리방침

본문 개인정보입니다.
`;

describe('platformLegalCopy', () => {
  test('## terms / ## privacy 섹션을 분리한다', () => {
    const terms = extractPlatformLegalSection(SAMPLE, PLATFORM_LEGAL_SECTIONS.TERMS);
    const privacy = extractPlatformLegalSection(SAMPLE, PLATFORM_LEGAL_SECTIONS.PRIVACY);
    expect(terms).toContain('이용약관');
    expect(terms).not.toContain('개인정보처리방침');
    expect(privacy).toContain('개인정보처리방침');
    expect(privacy).not.toContain('이용약관');
  });

  test('섹션 없으면 빈 문자열 (fail-closed)', () => {
    expect(extractPlatformLegalSection('# only', PLATFORM_LEGAL_SECTIONS.TERMS)).toBe('');
    expect(extractPlatformLegalSection('', PLATFORM_LEGAL_SECTIONS.PRIVACY)).toBe('');
  });

  test('quiet HTML은 이스케이프한다', () => {
    const html = renderQuietLegalHtmlFromMarkdown('### 제목\n\n<script>x</script>');
    expect(html).toContain('<h3>제목</h3>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});
