/**
 * 어드민·스태프 — 신규 매칭 POST
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../client';
import { ADMIN_MOBILE_API } from '../endpoints';
import { useAdminApiTenantSync } from '@/hooks/useAdminApiTenantSync';
import { useAdminApiQueryReady } from '@/hooks/useAdminApiQueryReady';
import { invalidateAdminApiQueries } from '@/utils/invalidateAdminApiQueries';
import {
  buildAdminMappingCreateRequestBody,
  type AdminMappingCreateFormInput,
} from '@/utils/adminMappingCreateBody';
import { extractApiErrorMessage } from '@/utils/adminSchedulePickerNormalize';
import { canManageMappingsOnMobile } from '@/utils/adminRole';
import { useAuthStore } from '@/stores/useAuthStore';

export type { AdminMappingCreateFormInput, AdminMappingPaymentFormInput } from '@/utils/adminMappingCreateBody';

async function postCreateMapping(input: AdminMappingCreateFormInput): Promise<unknown> {
  const body = buildAdminMappingCreateRequestBody(input);
  return apiPost<unknown>(ADMIN_MOBILE_API.MAPPINGS, body);
}

export function useAdminCreateMapping() {
  const queryClient = useQueryClient();
  const { ready } = useAdminApiQueryReady();
  const role = useAuthStore((s) => s.role);
  const accessToken = useAuthStore((s) => s.accessToken);
  const allowed = canManageMappingsOnMobile(role, accessToken);
  useAdminApiTenantSync();

  return useMutation({
    mutationFn: postCreateMapping,
    onSuccess: () => {
      invalidateAdminApiQueries(queryClient);
    },
    meta: { ready, allowed },
  });
}

export function getAdminCreateMappingErrorMessage(error: unknown): string {
  return extractApiErrorMessage(error, '매칭 생성 중 오류가 발생했습니다.');
}
