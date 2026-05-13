/**
 * 감정 일기 상수 정의
 * 이모지 5단계, 감정 태그 목록, 점수 매핑
 * (일상 기록용. 의학적 진단·의료행위를 대체하지 않음 — `EXPO_NATIVE_APP_PLAN.md` §10.1)
 *
 * @author MindGarden
 * @since 2026-05-12
 */

export interface MoodEmoji {
  readonly value: number;
  readonly emoji: string;
  readonly label: string;
}

export const MOOD_EMOJIS: readonly MoodEmoji[] = [
  { value: 1, emoji: '😢', label: '매우나쁨' },
  { value: 2, emoji: '😟', label: '나쁨' },
  { value: 3, emoji: '😐', label: '보통' },
  { value: 4, emoji: '🙂', label: '좋음' },
  { value: 5, emoji: '😊', label: '매우좋음' },
] as const;

export const EMOTION_TAGS = [
  '불안', '우울', '화남', '외로움', '감사',
  '행복', '평온', '설렘', '피곤', '스트레스',
] as const;

export type EmotionTag = (typeof EMOTION_TAGS)[number];

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export const MOOD_SCORE_MAP: Record<number, string> = {
  1: '매우나쁨',
  2: '나쁨',
  3: '보통',
  4: '좋음',
  5: '매우좋음',
};

export const MOOD_STORAGE_KEY = 'mg_mood_journal';

/** §11.1 데이터 소스 라벨: `WELLNESS_PHASE_3B_DATA_SOURCE` @see src/constants/wellnessDataSource.ts */

export const MOOD_STAT_PERIODS = ['weekly', 'monthly'] as const;
export type MoodStatPeriod = (typeof MOOD_STAT_PERIODS)[number];

export const MOOD_STAT_PERIOD_LABELS: Record<MoodStatPeriod, string> = {
  weekly: '주간',
  monthly: '월간',
};
