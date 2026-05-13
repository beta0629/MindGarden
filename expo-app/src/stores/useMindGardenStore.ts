/**
 * 「마음 정원」로컬 성장 상태 — Zustand + MMKV 영속화 (서버 동기화 전 MVP)
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import {
  GARDEN_EVENT_WEIGHTS,
  GARDEN_GROWTH_WEEKLY_POINTS_CAP,
  getGardenWeekKey,
  type GardenGrowthEventType,
} from '@/constants/mindGardenGrowth';
import { gardenGrowthLocalEventQueueStub } from '@/services/gardenGrowthEventQueue';
import type { MindGardenServerState } from '@/types/mindGarden';

const mmkv = createMMKV({ id: 'mind-garden-store' });

const zustandMMKVStorage = createJSONStorage(() => ({
  getItem: (name: string) => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string) => mmkv.set(name, value),
  removeItem: (name: string) => mmkv.remove(name),
}));

const MAX_PROCESSED_KEYS = 96;

function buildDedupeKey(
  eventType: GardenGrowthEventType,
  sourceId: string | undefined,
): string | null {
  if (!sourceId) {
    return null;
  }
  return `${eventType}:${sourceId}`;
}

export interface GardenGrowthApplyResult {
  readonly earned: number;
  readonly duplicate: boolean;
  readonly weeklyCapReached: boolean;
  readonly remainingWeeklyBudget: number;
}

interface MindGardenState {
  /** 누적 성장점 (주간 캡 적용 후 실제 반영분만 증가) */
  totalGardenPoints: number;
  activeWeekKey: string;
  weeklyPointsThisWeek: number;
  processedEventKeys: string[];
  /** 마지막으로 받은 서버 리비전 (동기화 훅에서 사용) */
  lastServerRevision: number;

  recordGrowthEvent: (
    eventType: GardenGrowthEventType,
    options?: { sourceId?: string; skipDedupe?: boolean },
  ) => GardenGrowthApplyResult;
  mergeServerState: (server: MindGardenServerState) => void;
  resetForDemo: () => void;
}

export const useMindGardenStore = create<MindGardenState>()(
  persist(
    (set, get) => ({
      totalGardenPoints: 0,
      activeWeekKey: getGardenWeekKey(),
      weeklyPointsThisWeek: 0,
      processedEventKeys: [],
      lastServerRevision: 0,

      recordGrowthEvent: (eventType, options) => {
        const now = new Date();
        const weekKey = getGardenWeekKey(now);
        const state = get();
        let weeklyPoints = state.weeklyPointsThisWeek;
        let activeWeekKey = state.activeWeekKey;
        let processed = [...state.processedEventKeys];

        if (weekKey !== activeWeekKey) {
          weeklyPoints = 0;
          activeWeekKey = weekKey;
        }

        const dedupeKey =
          options?.skipDedupe === true
            ? null
            : buildDedupeKey(eventType, options?.sourceId);
        if (dedupeKey && processed.includes(dedupeKey)) {
          return {
            earned: 0,
            duplicate: true,
            weeklyCapReached: weeklyPoints >= GARDEN_GROWTH_WEEKLY_POINTS_CAP,
            remainingWeeklyBudget: Math.max(
              0,
              GARDEN_GROWTH_WEEKLY_POINTS_CAP - weeklyPoints,
            ),
          };
        }

        const baseWeight = GARDEN_EVENT_WEIGHTS[eventType];
        const remaining = Math.max(
          0,
          GARDEN_GROWTH_WEEKLY_POINTS_CAP - weeklyPoints,
        );
        const earned = Math.min(baseWeight, remaining);
        const weeklyCapReached = remaining <= baseWeight && earned < baseWeight;

        if (earned > 0) {
          if (dedupeKey) {
            processed = [...processed, dedupeKey];
            if (processed.length > MAX_PROCESSED_KEYS) {
              processed = processed.slice(processed.length - MAX_PROCESSED_KEYS);
            }
          }
          set({
            totalGardenPoints: state.totalGardenPoints + earned,
            weeklyPointsThisWeek: weeklyPoints + earned,
            activeWeekKey,
            processedEventKeys: processed,
          });
          gardenGrowthLocalEventQueueStub.enqueue({
            eventType,
            sourceId: options?.sourceId,
            occurredAt: now.toISOString(),
          });
        } else {
          set({ activeWeekKey, weeklyPointsThisWeek: weeklyPoints });
        }

        return {
          earned,
          duplicate: false,
          weeklyCapReached,
          remainingWeeklyBudget: Math.max(
            0,
            GARDEN_GROWTH_WEEKLY_POINTS_CAP - weeklyPoints - earned,
          ),
        };
      },

      mergeServerState: (server) => {
        const local = get();
        if (server.revision < local.lastServerRevision) {
          return;
        }
        set({
          totalGardenPoints: server.totalPoints,
          weeklyPointsThisWeek: server.weeklyPointsCredited,
          activeWeekKey: server.weekKey,
          lastServerRevision: server.revision,
        });
      },

      resetForDemo: () =>
        set({
          totalGardenPoints: 0,
          activeWeekKey: getGardenWeekKey(),
          weeklyPointsThisWeek: 0,
          processedEventKeys: [],
          lastServerRevision: 0,
        }),
    }),
    {
      name: 'mind-garden-storage',
      storage: zustandMMKVStorage,
      partialize: (s) => ({
        totalGardenPoints: s.totalGardenPoints,
        activeWeekKey: s.activeWeekKey,
        weeklyPointsThisWeek: s.weeklyPointsThisWeek,
        processedEventKeys: s.processedEventKeys,
        lastServerRevision: s.lastServerRevision,
      }),
    },
  ),
);
