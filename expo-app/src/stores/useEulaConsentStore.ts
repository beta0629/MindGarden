/**
 * Apple G1.2 UGC (P2-C) — EULA 동의 게이트 로컬 스토어.
 *
 * <p>부팅 후 BE 의 {@code /api/v1/users/me/eula-consent} 조회 결과를 MMKV 에 캐시한다.
 * 캐시는 BE 의 `requiresReconsent` 가 `false` 일 때만 유지되고, `true` 면 다음 부팅에서도
 * EULA 화면이 표시된다. 캐시 키는 사용자 id 별로 분리한다 (계정 전환 시 격리).</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createZustandMmkvPersistStorage } from '@/lib/getMmkv';

const zustandMMKVStorage = createZustandMmkvPersistStorage('eula-consent-store');

export interface EulaConsentRecord {
  /** 동의한 EULA 버전 — `null` 이면 미동의. */
  acceptedVersion: string | null;
  /** 동의 ISO 시각 — `null` 이면 미동의. */
  acceptedAt: string | null;
}

interface EulaConsentState {
  /** key = userId.toString(), value = 동의 캐시. */
  recordsByUserId: Record<string, EulaConsentRecord>;
  setRecord: (userId: number, record: EulaConsentRecord) => void;
  clearRecord: (userId: number) => void;
  getRecord: (userId: number) => EulaConsentRecord | undefined;
  reset: () => void;
}

export const useEulaConsentStore = create<EulaConsentState>()(
  persist(
    (set, get) => ({
      recordsByUserId: {},

      setRecord: (userId, record) => {
        set((state) => ({
          recordsByUserId: {
            ...state.recordsByUserId,
            [String(userId)]: record,
          },
        }));
      },

      clearRecord: (userId) => {
        set((state) => {
          const next = { ...state.recordsByUserId };
          delete next[String(userId)];
          return { recordsByUserId: next };
        });
      },

      getRecord: (userId) => {
        return get().recordsByUserId[String(userId)];
      },

      reset: () => {
        set({ recordsByUserId: {} });
      },
    }),
    {
      name: 'eula-consent-store',
      storage: zustandMMKVStorage,
    },
  ),
);

/**
 * 캐시 + 현재 버전 비교로 게이트 발동 여부를 판정한다.
 *
 * <p>BE 응답을 받기 전 부팅 직후 “깜빡임 방지” 가드로 사용 — 캐시가 현재 버전과 일치하면
 * 즉시 통과시키고, 그렇지 않으면 BE 결과로 보정한다.</p>
 *
 * @param userId 현재 사용자 id
 * @param currentVersion 현재 시행 EULA 버전
 * @returns 캐시 기준 게이트 발동 필요 여부
 */
export function shouldShowEulaGateFromCache(
  userId: number | null | undefined,
  currentVersion: string,
): boolean {
  if (userId == null) {
    return false;
  }
  const record = useEulaConsentStore.getState().getRecord(userId);
  if (!record || !record.acceptedVersion) {
    return true;
  }
  return record.acceptedVersion !== currentVersion;
}
