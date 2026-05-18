/**
 * 어드민·스태프 — 상담 일정 등록 mutation
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../client';
import { SCHEDULE_API } from '../endpoints';
import { useAdminApiTenantSync } from '@/hooks/useAdminApiTenantSync';
import { useAdminApiQueryReady } from '@/hooks/useAdminApiQueryReady';
import { invalidateAdminApiQueries } from '@/utils/invalidateAdminApiQueries';
import {
  buildScheduleCreateRequestBody,
  type AdminScheduleCreateFormInput,
} from '@/utils/adminScheduleCreateBody';
import { extractApiErrorMessage } from '@/utils/adminSchedulePickerNormalize';
import { isAdminMobileShellRole } from '@/utils/adminRole';
import { useAuthStore } from '@/stores/useAuthStore';

export type { AdminScheduleCreateFormInput, ScheduleCreateRequestBody } from '@/utils/adminScheduleCreateBody';

async function postCreateSchedule(input: AdminScheduleCreateFormInput): Promise<unknown> {
  const body = buildScheduleCreateRequestBody(input, {
    includeTentative: true,
  });
  return apiPost<unknown>(SCHEDULE_API.SCHEDULE_CREATE_CONSULTANT, body);
}

export function useAdminCreateSchedule() {
  const queryClient = useQueryClient();
  const { ready } = useAdminApiQueryReady();
  const role = useAuthStore((s) => s.role);
  const allowed = isAdminMobileShellRole(role);
  useAdminApiTenantSync();

  return useMutation({
    mutationFn: postCreateSchedule,
    onSuccess: () => {
      invalidateAdminApiQueries(queryClient);
    },
    meta: { ready, allowed },
  });
}

export function getAdminCreateScheduleErrorMessage(error: unknown): string {
  return extractApiErrorMessage(error, '일정 등록 중 오류가 발생했습니다.');
}
