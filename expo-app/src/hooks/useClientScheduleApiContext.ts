/**
 * 내담자 일정 API — auth·tenant hydrate + effective userId
 *
 * @author MindGarden
 * @since 2026-05-22
 */
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import {
  isClientScheduleQueryEnabled,
  resolveEffectiveClientScheduleUserId,
} from '@/utils/resolveClientScheduleUserId';

export type ClientScheduleApiContext = {
  ready: boolean;
  tenantId: string;
  userId: number | undefined;
  effectiveUserId: number | undefined;
  queryEnabled: boolean;
};

export function useClientScheduleApiContext(
  clientId?: number | string,
): ClientScheduleApiContext {
  const { ready, tenantId, userId } = useApiQueryReady({ requireUserId: true });
  const effectiveUserId = resolveEffectiveClientScheduleUserId(clientId, userId);
  const queryEnabled = isClientScheduleQueryEnabled(ready, effectiveUserId);

  return { ready, tenantId, userId, effectiveUserId, queryEnabled };
}

export { resolveEffectiveClientScheduleUserId };
