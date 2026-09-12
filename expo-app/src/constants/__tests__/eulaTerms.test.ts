/**
 * Apple G1.2 UGC (P2-C) — EULA 약관 본문/버전 상수 회귀 테스트.
 *
 * <p>Apple G1.2 4대 키워드(`no tolerance` 대응 `zero-tolerance` / `objectionable` /
 * `abusive` / `24시간`) 누락 시 즉시 fail — 약관 텍스트가 임의로 변경되면 빌드 차단.</p>
 */

import {
  EULA_CURRENT_VERSION,
  EULA_EFFECTIVE_DATE,
  EULA_REQUIRED_KEYWORDS,
  EULA_SCREEN_LABELS,
  EULA_TERMS_BODY,
  UGC_REVIEW_SLA_COPY,
} from '../eulaTerms';

describe('eulaTerms — Apple G1.2 UGC P2-C 약관 상수', () => {
  test('EULA_CURRENT_VERSION 은 1.0.0 (BE EulaVersion.CURRENT 와 동기)', () => {
    expect(EULA_CURRENT_VERSION).toBe('1.0.0');
  });

  test('EULA_EFFECTIVE_DATE 는 2026-06-11 ISO 형식', () => {
    expect(EULA_EFFECTIVE_DATE).toBe('2026-06-11');
  });

  test.each(EULA_REQUIRED_KEYWORDS as string[])(
    'EULA_TERMS_BODY 에 Apple G1.2 필수 키워드 "%s" 포함',
    (keyword) => {
      expect(EULA_TERMS_BODY).toContain(keyword);
    },
  );

  test('EULA_TERMS_BODY §2 무관용/§3 24시간/§4 학대 조항 모두 노출', () => {
    expect(EULA_TERMS_BODY).toMatch(/제2조 \(콘텐츠 무관용 정책\)/);
    expect(EULA_TERMS_BODY).toMatch(/제3조 \(24시간 내 검토 의무\)/);
    expect(EULA_TERMS_BODY).toMatch(/제4조 \(이용자 행동 규범 — 학대 행위 금지\)/);
    expect(EULA_TERMS_BODY).toMatch(/제6조 \(자동 신고 및 모니터링\)/);
  });

  test('EULA_SCREEN_LABELS — CTA·필수/선택 라벨이 비어 있지 않음', () => {
    expect(EULA_SCREEN_LABELS.cta).toBe('동의하고 시작하기');
    expect(EULA_SCREEN_LABELS.termsConsent).toMatch(/필수/);
    expect(EULA_SCREEN_LABELS.privacyConsent).toMatch(/필수/);
    expect(EULA_SCREEN_LABELS.marketingConsent).toMatch(/선택/);
  });

  test('UGC_REVIEW_SLA_COPY — 24시간 안내 카피 포함', () => {
    expect(UGC_REVIEW_SLA_COPY.reportInfoBanner).toMatch(/24시간/);
    expect(UGC_REVIEW_SLA_COPY.reportSubmittedBody).toMatch(/24시간/);
    expect(UGC_REVIEW_SLA_COPY.blockedListFooter).toMatch(/24시간/);
  });
});
