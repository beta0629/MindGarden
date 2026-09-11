/**
 * 플랫폼 legal SSOT MD — terms/privacy/refund 현행화 스모크
 *
 * @author CoreSolution
 * @since 2026-09-11
 */

import fs from 'fs';
import path from 'path';
import { extractPlatformLegalSection } from '../../../utils/platformLegalCopy';
import { PLATFORM_LEGAL_SECTIONS } from '../../../constants/legalPublic';

const MD_PATH = path.resolve(
  __dirname,
  '../../../../public/legal/clinic-os-platform-legal-copy.md'
);

describe('clinic-os-platform-legal-copy SSOT', () => {
  const markdown = fs.readFileSync(MD_PATH, 'utf8');

  test('terms·privacy·refund 섹션이 모두 있고 약관이 현행이다', () => {
    const terms = extractPlatformLegalSection(
      markdown,
      PLATFORM_LEGAL_SECTIONS.TERMS
    );
    const privacy = extractPlatformLegalSection(
      markdown,
      PLATFORM_LEGAL_SECTIONS.PRIVACY
    );
    const refund = extractPlatformLegalSection(
      markdown,
      PLATFORM_LEGAL_SECTIONS.REFUND
    );

    expect(terms).toContain('상담센터 SaaS');
    expect(terms).toContain('제9조 (청약철회·취소 및 환불)');
    expect(terms).toContain('/legal/refund');
    expect(terms).toContain('잔여 회기를 모두 소진할 때까지');
    expect(terms).toContain('달력일수');
    expect(privacy).toContain('개인정보 보호책임자');
    expect(privacy).not.toContain('의료법에 의한 의료기록');
    expect(privacy).not.toContain('전화: 9.');
    expect(refund).toContain('청약철회 기간');
    expect(refund).toContain('LEGAL_PUBLIC_PATHS.REFUND');
    expect(refund).toContain('이용기간과의 관계');
    expect(refund).toContain('잔여 회기를 모두 소진할 때까지');
  });

  test('최종 수정일이 2026-09-11 현행이다', () => {
    expect(markdown).toContain('최종 수정일: 2026년 9월 11일');
  });
});
