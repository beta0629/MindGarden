/**
 * 명상 콘텐츠 Mock 데이터
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { colors } from '@/theme/tokens';

export type MeditationCategory =
  | 'all'
  | 'breathing'
  | 'mindfulness'
  | 'sleep'
  | 'nature';

export interface MeditationTrack {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly category: MeditationCategory;
  readonly categoryLabel: string;
  readonly durationSeconds: number;
  readonly gradientColors: readonly [string, string];
  /** 트랙별 스트림(HTTPS URL 또는 Metro `require()` 자산 번호). 없으면 폴백 규칙 적용 */
  readonly audioUri?: string | number;
}

/**
 * 선택적 원격 데모 스트림(자사·라이선스 확보 URL만). 비어 있으면 외부 CDN을 쓰지 않는다.
 * 운영: `/api/v1/meditations` 등 응답의 `contentUrl` 우선.
 */
const envDemoStream =
  typeof process !== 'undefined' &&
  typeof process.env.EXPO_PUBLIC_MEDITATION_DEMO_STREAM_URL === 'string'
    ? process.env.EXPO_PUBLIC_MEDITATION_DEMO_STREAM_URL.trim()
    : '';
export const MEDITATION_DEFAULT_STREAM_URI: string | undefined =
  envDemoStream.length > 0 ? envDemoStream : undefined;

/** 무음 짧은 클립 — 리포지토리 내 생성 WAV(제3자 음원 없음). UI·플레이어 데모 폴백용 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const MEDITATION_LOCAL_DEMO_SILENCE = require('../../assets/audio/demo-silence.wav') as number;

export const MEDITATION_CATEGORIES: readonly {
  key: MeditationCategory | 'favorites';
  label: string;
}[] = [
  { key: 'all', label: '전체' },
  { key: 'breathing', label: '호흡' },
  { key: 'mindfulness', label: '마음챙김' },
  { key: 'sleep', label: '수면' },
  { key: 'nature', label: '자연소리' },
  { key: 'favorites', label: '즐겨찾기' },
] as const;

export const MEDITATION_GRADIENT_MAP: Record<
  MeditationCategory,
  readonly [string, string]
> = {
  all: [colors.client.primary, colors.client.primaryLight],
  breathing: [colors.client.accent, colors.consultant.accent],
  mindfulness: [colors.consultant.primaryLight, colors.client.accent],
  sleep: [colors.consultant.primary, colors.consultant.primaryLight],
  nature: [colors.consultant.accent, colors.client.primaryLight],
} as const;

export const MOCK_MEDITATION_TRACKS: MeditationTrack[] = [
  {
    id: 1,
    title: '깊은 호흡 명상',
    description: '코로 깊이 들이쉬고 천천히 내쉬며 몸과 마음을 이완하는 기본 호흡 명상입니다.',
    category: 'breathing',
    categoryLabel: '호흡',
    durationSeconds: 600,
    gradientColors: MEDITATION_GRADIENT_MAP.breathing,
  },
  {
    id: 2,
    title: '4-7-8 호흡법',
    description: '4초 들이쉬고, 7초 멈추고, 8초 내쉬는 이완 호흡 기법으로 긴장을 풀어보세요.',
    category: 'breathing',
    categoryLabel: '호흡',
    durationSeconds: 480,
    gradientColors: MEDITATION_GRADIENT_MAP.breathing,
  },
  {
    id: 3,
    title: '아침 호흡 루틴',
    description: '상쾌한 아침을 여는 5분 호흡 루틴. 하루를 활력 있게 시작하세요.',
    category: 'breathing',
    categoryLabel: '호흡',
    durationSeconds: 300,
    gradientColors: MEDITATION_GRADIENT_MAP.breathing,
  },
  {
    id: 4,
    title: '바디 스캔 마음챙김',
    description: '발끝에서 머리끝까지 신체 감각을 하나씩 관찰하며 현재에 머무르는 명상입니다.',
    category: 'mindfulness',
    categoryLabel: '마음챙김',
    durationSeconds: 900,
    gradientColors: MEDITATION_GRADIENT_MAP.mindfulness,
  },
  {
    id: 5,
    title: '지금 이 순간에 집중하기',
    description: '생각을 멈추고 현재에 온전히 머무르는 마음챙김 연습입니다.',
    category: 'mindfulness',
    categoryLabel: '마음챙김',
    durationSeconds: 720,
    gradientColors: MEDITATION_GRADIENT_MAP.mindfulness,
  },
  {
    id: 6,
    title: '걷기 명상',
    description: '한 걸음 한 걸음에 집중하며 걷는 마음챙김 명상입니다.',
    category: 'mindfulness',
    categoryLabel: '마음챙김',
    durationSeconds: 600,
    gradientColors: MEDITATION_GRADIENT_MAP.mindfulness,
  },
  {
    id: 7,
    title: '수면 유도 명상',
    description: '편안한 안내 음성과 함께 깊은 잠으로 이끌어주는 수면 명상입니다.',
    category: 'sleep',
    categoryLabel: '수면',
    durationSeconds: 1200,
    gradientColors: MEDITATION_GRADIENT_MAP.sleep,
  },
  {
    id: 8,
    title: '잠들기 전 이완',
    description: '하루의 긴장을 풀고 편안하게 잠들 수 있도록 도와주는 이완 명상입니다.',
    category: 'sleep',
    categoryLabel: '수면',
    durationSeconds: 1800,
    gradientColors: MEDITATION_GRADIENT_MAP.sleep,
  },
  {
    id: 9,
    title: '빗소리 자연 명상',
    description: '부드러운 빗소리와 함께하는 자연 명상으로 마음을 안정시켜 보세요.',
    category: 'nature',
    categoryLabel: '자연소리',
    durationSeconds: 1500,
    gradientColors: MEDITATION_GRADIENT_MAP.nature,
  },
  {
    id: 10,
    title: '파도 소리',
    description: '잔잔한 파도 소리를 들으며 해변에 있는 듯한 평온함을 느껴보세요.',
    category: 'nature',
    categoryLabel: '자연소리',
    durationSeconds: 1200,
    gradientColors: MEDITATION_GRADIENT_MAP.nature,
  },
  {
    id: 11,
    title: '새벽 숲 소리',
    description: '새들의 지저귐과 숲의 고요함 속에서 마음을 정화하세요.',
    category: 'nature',
    categoryLabel: '자연소리',
    durationSeconds: 900,
    gradientColors: MEDITATION_GRADIENT_MAP.nature,
  },
  {
    id: 12,
    title: '박스 브리딩',
    description: '4초 흡입→4초 멈춤→4초 호출→4초 멈춤. 규칙적 호흡으로 안정을 찾으세요.',
    category: 'breathing',
    categoryLabel: '호흡',
    durationSeconds: 360,
    gradientColors: MEDITATION_GRADIENT_MAP.breathing,
  },
] as const;

export const RECOMMENDED_TRACK_ID = 4;

export const MOCK_PRACTICE_STATS = {
  totalMinutes: 42,
  streakDays: 3,
} as const;

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}분 ${s}초` : `${m}분`;
}

export function formatPlayerTime(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
