/**
 * 자가 점검(PHQ-9 / GAD-7 / PSS) 표준 원저작 인용 상수.
 *
 * Apple Guideline 1.4.1 (Plan A · T3) 대응을 위해 자가검사 문항·결과 화면 하단에
 * 원저작자/출처를 표기한다. 표기는 정적 텍스트이며, 도구별 사용·인용 조건은
 * 원 저작·배포 정책을 따른다.
 *
 * @author MindGarden
 * @since 2026-06-07
 * @see docs/project-management/2026-06-04/APPLE_T3_CITATION_DESIGN_HANDOFF.md §4
 */

import type { AssessmentType } from '@/constants/assessmentQuestions';

export interface AssessmentCitation {
  readonly title: string;
  readonly authors: string;
  readonly year: number;
  readonly journal: string;
  readonly url: string;
  readonly license?: string;
}

export const ASSESSMENT_CITATIONS: Record<AssessmentType, AssessmentCitation> = {
  PHQ9: {
    title: 'PHQ-9 (Patient Health Questionnaire-9)',
    authors: 'Kroenke K, Spitzer RL, Williams JBW',
    year: 2001,
    journal: 'Journal of General Internal Medicine, 16(9), 606-613',
    url: 'https://doi.org/10.1046/j.1525-1497.2001.016009606.x',
    license: 'Pfizer 라이선스 하에 의료·연구 목적 무료 사용 가능',
  },
  GAD7: {
    title: 'GAD-7 (Generalized Anxiety Disorder-7)',
    authors: 'Spitzer RL, Kroenke K, Williams JBW, Löwe B',
    year: 2006,
    journal: 'Archives of Internal Medicine, 166(10), 1092-1097',
    url: 'https://doi.org/10.1001/archinte.166.10.1092',
  },
  PSS: {
    title: 'PSS (Perceived Stress Scale)',
    authors: 'Cohen S, Kamarck T, Mermelstein R',
    year: 1983,
    journal: 'Journal of Health and Social Behavior, 24(4), 385-396',
    url: 'https://doi.org/10.2307/2136404',
  },
} as const;

/** 마음 날씨 「AI 생성·진단 아님」 배너 — 핸드오프 §5.1 */
export const MIND_WEATHER_AI_BANNER_TITLE_KO = 'AI 생성·의학적 진단 아님';
export const MIND_WEATHER_AI_BANNER_BODY_KO =
  '이 결과는 AI가 생성한 분석이며 의학적 진단이 아닙니다. 자세한 진단은 정신건강 전문가와 상담하세요.';

/** 마음 날씨 분석 모델·가이드라인 출처 — 핸드오프 §5.2 */
export const MIND_WEATHER_METHODOLOGY_KO = {
  modelName: 'OpenAI GPT 계열 분석 모델',
  guidelineSource: {
    label: 'WHO mhGAP Intervention Guide',
    url: 'https://www.who.int/publications/i/item/9789241548069',
    author: 'World Health Organization',
    publishedYear: 2016,
  },
} as const;
