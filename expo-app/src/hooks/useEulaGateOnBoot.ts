/**
 * Apple G1.2 UGC (P2-C) — 부팅 시 EULA 게이트 체크 훅.
 *
 * <p>인증된 사용자가 진입할 때 한 번 호출하여 EULA 동의 게이트가 필요한지 판정한다.
 * 캐시(`useEulaConsentStore`) 우선, 미일치 시 BE `/api/v1/users/me/eula-consent` 조회로 보정한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
import { useEffect, useState } from 'react';

import { EULA_CURRENT_VERSION } from '@/constants/eulaTerms';
import { fetchEulaConsentStatus } from '@/services/eulaConsentService';
import {
  shouldShowEulaGateFromCache,
  useEulaConsentStore,
} from '@/stores/useEulaConsentStore';

export type EulaGateState =
  | { readonly status: 'checking' }
  | { readonly status: 'allowed' }
  | { readonly status: 'requires-consent' }
  | { readonly status: 'skipped' };

export type UseEulaGateOnBootOptions = {
  /** 사용자 ID — `null`/`undefined` 면 게이트 검사를 건너뛴다. */
  readonly userId: number | null | undefined;
  /** 인증 상태 — 비인증이면 게이트 검사를 건너뛴다. */
  readonly isAuthenticated: boolean;
};

/**
 * 부팅 시 EULA 게이트 체크.
 *
 * <p>인증 완료된 사용자에 대해서만 동작한다. 캐시 우선·BE 보정 흐름.</p>
 *
 * @param options 옵션
 * @returns 게이트 상태
 */
export function useEulaGateOnBoot({ userId, isAuthenticated }: UseEulaGateOnBootOptions): EulaGateState {
  const [state, setState] = useState<EulaGateState>(() => {
    if (!isAuthenticated || userId == null) {
      return { status: 'skipped' };
    }
    // 캐시가 현재 버전과 일치하면 즉시 통과 — BE 호출 없이 깜빡임 방지.
    if (!shouldShowEulaGateFromCache(userId, EULA_CURRENT_VERSION)) {
      return { status: 'allowed' };
    }
    return { status: 'checking' };
  });

  useEffect(() => {
    if (!isAuthenticated || userId == null) {
      setState({ status: 'skipped' });
      return;
    }
    if (!shouldShowEulaGateFromCache(userId, EULA_CURRENT_VERSION)) {
      setState({ status: 'allowed' });
      return;
    }

    let cancelled = false;
    setState({ status: 'checking' });
    (async () => {
      try {
        const remote = await fetchEulaConsentStatus();
        if (cancelled) {
          return;
        }
        if (remote.requiresReconsent) {
          setState({ status: 'requires-consent' });
          return;
        }
        useEulaConsentStore.getState().setRecord(userId, {
          acceptedVersion: remote.acceptedVersion ?? remote.currentVersion,
          acceptedAt: remote.acceptedAt,
        });
        setState({ status: 'allowed' });
      } catch (err) {
        if (cancelled) {
          return;
        }
        console.warn('[useEulaGateOnBoot] fetch failed — falling back to gate', err);
        setState({ status: 'requires-consent' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userId]);

  return state;
}
