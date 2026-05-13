/**
 * 「마음 정원」성장 이벤트 가중치·주간 상한·단계 정의 (비경쟁·MVP)
 *
 * @author MindGarden
 * @since 2026-05-13
 * @see docs/project-management/CONSULTANT_CLIENT_APP_PLAN.md Phase 4(B)
 */

export const GARDEN_GROWTH_WEEKLY_POINTS_CAP = 60;

/** 누적 성장점 구간 — 단계 인덱스 산출용 (과도한 세션 보상 완화는 주간 캡으로 별도 처리) */
export const GARDEN_STAGE_THRESHOLDS = [0, 45, 110, 220, 400] as const;

export const GARDEN_STAGE_LABELS = [
  '씨앗',
  '새싹',
  '줄기',
  '꽃봉오리',
  '만개한 정원',
] as const;

export const GARDEN_EVENT_WEIGHTS = {
  SESSION_COMPLETED: 18,
  HOMEWORK_COMPLETED: 12,
  SELF_CARE_COMPLETED: 10,
} as const;

export type GardenGrowthEventType = keyof typeof GARDEN_EVENT_WEIGHTS;

export const GARDEN_POLICY_COPY_KO = {
  nonCompetitive:
    '다른 사람과 비교하거나 순위를 매기지 않아요. 나만의 속도로 정원이 자라요.',
  weeklyCap: `한 주에 모을 수 있는 성장점은 최대 ${GARDEN_GROWTH_WEEKLY_POINTS_CAP}점이에요. 건강한 리듬을 위해 정해진 한도예요.`,
  noDecay: '잠시 쉬어도 정원이 시들지 않아요. 언제든 다시 만나요.',
} as const;

export interface GardenVisualElement {
  readonly id: string;
  readonly label: string;
  readonly minStageIndex: number;
}

export const GARDEN_VISUAL_ELEMENTS: readonly GardenVisualElement[] = [
  { id: 'el-seed', label: '씨앗', minStageIndex: 0 },
  { id: 'el-sprout', label: '새싹', minStageIndex: 1 },
  { id: 'el-stem', label: '잎과 줄기', minStageIndex: 2 },
  { id: 'el-bud', label: '꽃봉오리', minStageIndex: 3 },
  { id: 'el-bloom', label: '꽃', minStageIndex: 4 },
];

/**
 * 월요일 00:00 기준 주 키 (같은 주에 주간 캡 집계)
 *
 * @param d 기준 시각
 * @returns YYYY-MM-DD 형식의 해당 주 월요일
 */
export function getGardenWeekKey(d: Date = new Date()): string {
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const dayNum = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayNum}`;
}

/**
 * 누적 성장점으로 단계 인덱스 계산
 *
 * @param totalPoints 누적 성장점
 * @returns 0 이상 단계 인덱스
 */
export function getGardenStageIndexFromPoints(totalPoints: number): number {
  let stage = 0;
  GARDEN_STAGE_THRESHOLDS.forEach((threshold, i) => {
    if (totalPoints >= threshold) {
      stage = i;
    }
  });
  const maxIdx = GARDEN_STAGE_LABELS.length - 1;
  return Math.min(stage, maxIdx);
}

export interface GardenStageProgress {
  readonly stageIndex: number;
  readonly stageLabel: string;
  readonly currentThreshold: number;
  readonly pointsInStage: number;
  readonly pointsToNext: number | null;
  readonly nextThreshold: number | null;
}

/**
 * 현재 단계·다음 단계까지 진행량
 *
 * @param totalPoints 누적 성장점
 */
export function getGardenStageProgress(totalPoints: number): GardenStageProgress {
  const stageIndex = getGardenStageIndexFromPoints(totalPoints);
  const labelIndex = Math.min(stageIndex, GARDEN_STAGE_LABELS.length - 1);
  const defaultLabel = GARDEN_STAGE_LABELS[0];
  const stageLabel = GARDEN_STAGE_LABELS[labelIndex] ?? defaultLabel;
  const currentThreshold = GARDEN_STAGE_THRESHOLDS[stageIndex] ?? 0;
  const nextIdx = stageIndex + 1;
  const nextThreshold: number | null =
    nextIdx < GARDEN_STAGE_THRESHOLDS.length
      ? (GARDEN_STAGE_THRESHOLDS[nextIdx] ?? null)
      : null;
  const pointsInStage = totalPoints - currentThreshold;
  const pointsToNext =
    nextThreshold === null ? null : Math.max(0, nextThreshold - totalPoints);
  return {
    stageIndex,
    stageLabel,
    currentThreshold,
    pointsInStage,
    pointsToNext,
    nextThreshold,
  };
}
