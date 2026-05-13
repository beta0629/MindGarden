/**
 * 마음 날씨 — 감정 키워드·트렌드·옵트인 카피
 *
 * `CONSULTANT_CLIENT_APP_PLAN.md` Phase 4 A절 / `docs/design-system/v2/MIND_WEATHER_UI_UX_SPEC.md` §5
 * - 키워드는 텍스트 휴리스틱(mock) 매칭에 쓰이되, 백엔드 부착 시 응답 그대로 노출 가능
 * - 「참고용·진단 아님」 카피는 `wellnessComplianceCopy.ts` 와 함께 묶인다
 *
 * @author MindGarden
 * @since 2026-05-13
 */

/** UI 한 카드에 노출하는 최대 키워드 수 — 디자이너 스펙 칩 그룹 가독성 기준 */
export const MIND_WEATHER_KEYWORD_DISPLAY_LIMIT = 5;

/** 입력 텍스트 최소·최대 길이 (UI/유효성 공통) */
export const MIND_WEATHER_TEXT_MIN_LENGTH = 5;
export const MIND_WEATHER_TEXT_MAX_LENGTH = 500;

export interface MindWeatherKeywordDef {
  readonly key: string;
  readonly label: string;
  /** 폴라리티: 음(-1) ~ 양(+1). 한 줄 요약에서 톤을 결정. */
  readonly polarity: -1 | 0 | 1;
  /** mock 매칭용 어근 — 백엔드 부착 후에는 사용되지 않음 */
  readonly matchers: readonly string[];
}

/**
 * 한국어 1차 감정 키워드 카탈로그.
 * - mood-journal `EMOTION_TAGS` 와 의미 정합 (불안·우울·화남 등)
 * - 백엔드 도입 시 이 라벨을 그대로 사용하거나 응답 키와 매핑한다
 */
export const MIND_WEATHER_KEYWORDS: readonly MindWeatherKeywordDef[] = [
  {
    key: 'anxiety',
    label: '불안',
    polarity: -1,
    matchers: ['불안', '걱정', '초조', '두려', '무서', '떨려'],
  },
  {
    key: 'depression',
    label: '우울',
    polarity: -1,
    matchers: ['우울', '무기력', '슬프', '눈물', '울적', '허무'],
  },
  {
    key: 'anger',
    label: '화남',
    polarity: -1,
    matchers: ['화', '짜증', '분노', '열받', '억울', '서운'],
  },
  {
    key: 'loneliness',
    label: '외로움',
    polarity: -1,
    matchers: ['외로', '혼자', '쓸쓸', '소외'],
  },
  {
    key: 'fatigue',
    label: '피곤',
    polarity: -1,
    matchers: ['피곤', '지치', '졸려', '힘들', '번아웃'],
  },
  {
    key: 'stress',
    label: '스트레스',
    polarity: -1,
    matchers: ['스트레스', '압박', '부담', '치이'],
  },
  {
    key: 'calm',
    label: '평온',
    polarity: 1,
    matchers: ['평온', '차분', '편안', '안정', '잔잔'],
  },
  {
    key: 'gratitude',
    label: '감사',
    polarity: 1,
    matchers: ['감사', '고마', '다행'],
  },
  {
    key: 'happy',
    label: '행복',
    polarity: 1,
    matchers: ['행복', '기쁘', '즐거', '신나', '웃'],
  },
  {
    key: 'excited',
    label: '설렘',
    polarity: 1,
    matchers: ['설레', '두근', '기대', '신기'],
  },
] as const;

export type MindWeatherKeywordKey = (typeof MIND_WEATHER_KEYWORDS)[number]['key'];

/**
 * 한 줄 요약에 쓰는 톤 매핑.
 * 백엔드 부착 후에도 mock fallback에서 동일 톤으로 재구성한다.
 */
export const MIND_WEATHER_SUMMARY_TONE = {
  positive: '오늘은 비교적 따뜻한 마음 결을 보이고 있어요.',
  mixed: '여러 감정이 섞여 있는 하루였어요.',
  negative: '오늘은 마음에 무게가 조금 느껴지는 하루였어요.',
  empty: '아직 마음 날씨를 분석할 만한 단서를 찾지 못했어요.',
} as const;

export type MindWeatherTone = keyof typeof MIND_WEATHER_SUMMARY_TONE;

/** 트렌드 알림(주간 대비 상승) — 디자이너 §4.3, 카피는 §5 */
export const MIND_WEATHER_TREND_ALERT_THRESHOLD = 2;
export const MIND_WEATHER_TREND_ALERT_COPY =
  '최근 같은 키워드가 자주 나타나고 있어요. 상담사님과 이야기해보는 것도 도움이 될 수 있어요.';

/** 입력 출처 */
export const MIND_WEATHER_SOURCES = ['memo', 'mood-journal', 'voice'] as const;
export type MindWeatherSource = (typeof MIND_WEATHER_SOURCES)[number];

export const MIND_WEATHER_SOURCE_LABELS: Record<MindWeatherSource, string> = {
  memo: '짧은 메모',
  'mood-journal': '감정 일기',
  voice: '음성 메모',
};

/** Phase 4-A MVP에서는 텍스트만 활성. 음성/STT는 후속 트랙. */
export const MIND_WEATHER_VOICE_PLACEHOLDER_COPY =
  '음성 메모는 다음 업데이트에서 제공돼요. 지금은 짧은 글로 기록해 주세요.';

/** MMKV 캐시 키 */
export const MIND_WEATHER_STORAGE_KEY = 'mg_mind_weather';
