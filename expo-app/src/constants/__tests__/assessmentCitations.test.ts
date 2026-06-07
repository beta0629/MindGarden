/**
 * Apple T3 — 자가검사 표준 인용(seed) 회귀 테스트.
 *
 * PHQ-9 / GAD-7 / PSS 표준 인용은 디자이너 핸드오프(§4)·
 * `APPLE_T3_CITATION_DESIGN_HANDOFF.md` 와 1:1 대응되어야 한다.
 *
 * @author MindGarden
 * @since 2026-06-07
 */

import {
  ASSESSMENT_CITATIONS,
  MIND_WEATHER_AI_BANNER_BODY_KO,
  MIND_WEATHER_AI_BANNER_TITLE_KO,
  MIND_WEATHER_METHODOLOGY_KO,
} from '../assessmentCitations';

describe('ASSESSMENT_CITATIONS — Apple T3 표준 인용', () => {
  it('PHQ-9 표준 인용은 Kroenke 2001 / JGIM 16(9) 606-613 / Pfizer 라이선스 명기', () => {
    const c = ASSESSMENT_CITATIONS.PHQ9;
    expect(c.title).toContain('PHQ-9');
    expect(c.authors).toContain('Kroenke');
    expect(c.year).toBe(2001);
    expect(c.journal).toContain('Journal of General Internal Medicine');
    expect(c.url).toMatch(/^https:\/\//);
    expect(c.license).toContain('Pfizer');
  });

  it('GAD-7 표준 인용은 Spitzer 2006 / Archives of Internal Medicine 166(10) 1092-1097', () => {
    const c = ASSESSMENT_CITATIONS.GAD7;
    expect(c.title).toContain('GAD-7');
    expect(c.authors).toContain('Spitzer');
    expect(c.year).toBe(2006);
    expect(c.journal).toContain('Archives of Internal Medicine');
    expect(c.url).toMatch(/^https:\/\//);
  });

  it('PSS 표준 인용은 Cohen 1983 / Journal of Health and Social Behavior 24(4) 385-396', () => {
    const c = ASSESSMENT_CITATIONS.PSS;
    expect(c.title).toContain('PSS');
    expect(c.authors).toContain('Cohen');
    expect(c.year).toBe(1983);
    expect(c.journal).toContain('Journal of Health and Social Behavior');
    expect(c.url).toMatch(/^https:\/\//);
  });

  it('마음 날씨 AI 배너 카피는 「AI 생성·진단 아님」/전문가 상담 안내를 포함한다', () => {
    expect(MIND_WEATHER_AI_BANNER_TITLE_KO).toContain('AI 생성');
    expect(MIND_WEATHER_AI_BANNER_TITLE_KO).toContain('진단');
    expect(MIND_WEATHER_AI_BANNER_BODY_KO).toContain('AI');
    expect(MIND_WEATHER_AI_BANNER_BODY_KO).toContain('전문가');
  });

  it('마음 날씨 분석 방식 — 모델·가이드라인 출처(WHO mhGAP) 정의', () => {
    expect(MIND_WEATHER_METHODOLOGY_KO.modelName).toContain('모델');
    expect(MIND_WEATHER_METHODOLOGY_KO.guidelineSource.label).toContain('WHO');
    expect(MIND_WEATHER_METHODOLOGY_KO.guidelineSource.author).toBe('World Health Organization');
    expect(MIND_WEATHER_METHODOLOGY_KO.guidelineSource.url).toMatch(/^https:\/\/www\.who\.int/);
  });
});
