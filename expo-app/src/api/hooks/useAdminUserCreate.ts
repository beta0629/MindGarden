/**
 * 어드민·스태프 — 내담자·상담사·스태프 등록 및 중복 검사
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '../client';
import { ADMIN_MOBILE_API } from '../endpoints';
import { useAdminApiTenantSync } from '@/hooks/useAdminApiTenantSync';
import { useAdminApiQueryReady } from '@/hooks/useAdminApiQueryReady';
import { invalidateAdminApiQueries } from '@/utils/invalidateAdminApiQueries';
import {
  extractApiErrorMessage,
  extractCreatedEntityId,
} from '@/utils/adminSchedulePickerNormalize';
import { unwrapApiResponse } from '../unwrapApiResponse';
import { isAdminMobileShellRole } from '@/utils/adminRole';
import { useAuthStore } from '@/stores/useAuthStore';

const CREATE_BASE = ['admin-mobile', 'user-create'] as const;

export const ADMIN_USER_CREATE_QUERY_KEYS = {
  all: CREATE_BASE,
  duplicateEmail: (tenantId: string, email: string) =>
    [...CREATE_BASE, 'duplicate-email', tenantId, email] as const,
  duplicatePhone: (tenantId: string, phone: string) =>
    [...CREATE_BASE, 'duplicate-phone', tenantId, phone] as const,
};

export type AdminCreateClientPayload = {
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly password?: string;
  readonly status?: string;
};

export type AdminCreateConsultantPayload = {
  readonly email: string;
  readonly phone?: string;
  readonly status?: string;
  readonly grade?: string;
};

export type AdminCreateStaffPayload = {
  readonly email: string;
  readonly name?: string;
  readonly phone?: string;
  readonly password?: string;
};

export type AdminDuplicateCheckResult = {
  readonly isDuplicate: boolean;
  readonly available: boolean;
  readonly message: string;
};

function parseDuplicateCheck(raw: unknown): AdminDuplicateCheckResult {
  const data = unwrapApiResponse<Record<string, unknown>>(raw);
  const isDuplicate = Boolean(data?.isDuplicate);
  const available = data?.available !== false && !isDuplicate;
  const message =
    typeof data?.message === 'string' && data.message.trim()
      ? data.message.trim()
      : isDuplicate
        ? '이미 사용 중입니다.'
        : '사용 가능합니다.';
  return { isDuplicate, available, message };
}

export function useAdminDuplicateCheckEmail(email: string, enabled: boolean) {
  const { ready, tenantId } = useAdminApiQueryReady();
  const trimmed = email.trim();
  useAdminApiTenantSync();

  return useQuery({
    queryKey: ADMIN_USER_CREATE_QUERY_KEYS.duplicateEmail(tenantId, trimmed),
    queryFn: async () => {
      const raw = await apiGet<unknown>(ADMIN_MOBILE_API.DUPLICATE_CHECK_EMAIL, { email: trimmed });
      return parseDuplicateCheck(raw);
    },
    enabled: ready && enabled && trimmed.includes('@'),
    staleTime: 0,
    retry: false,
  });
}

export function useAdminDuplicateCheckPhone(phone: string, enabled: boolean) {
  const { ready, tenantId } = useAdminApiQueryReady();
  const trimmed = phone.trim();
  useAdminApiTenantSync();

  return useQuery({
    queryKey: ADMIN_USER_CREATE_QUERY_KEYS.duplicatePhone(tenantId, trimmed),
    queryFn: async () => {
      const raw = await apiGet<unknown>(ADMIN_MOBILE_API.DUPLICATE_CHECK_PHONE, { phone: trimmed });
      return parseDuplicateCheck(raw);
    },
    enabled: ready && enabled && trimmed.replace(/\D/g, '').length >= 10,
    staleTime: 0,
    retry: false,
  });
}

function useAdminUserCreateMutation<TPayload>(
  endpoint: string,
  fallbackError: string,
) {
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.role);
  const allowed = isAdminMobileShellRole(role);
  useAdminApiTenantSync();

  return useMutation({
    mutationFn: async (payload: TPayload) => {
      const raw = await apiPost<unknown>(endpoint, payload);
      const id = extractCreatedEntityId(raw);
      if (id == null) {
        const root = raw != null && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
        if (root?.success === false) {
          throw new Error(
            typeof root.message === 'string' ? root.message : fallbackError,
          );
        }
      }
      return { raw, id };
    },
    onSuccess: () => {
      invalidateAdminApiQueries(queryClient);
    },
    meta: { allowed },
  });
}

export function useAdminCreateClient() {
  return useAdminUserCreateMutation<AdminCreateClientPayload>(
    ADMIN_MOBILE_API.CREATE_CLIENT,
    '내담자 등록에 실패했습니다.',
  );
}

export function useAdminCreateConsultant() {
  return useAdminUserCreateMutation<AdminCreateConsultantPayload>(
    ADMIN_MOBILE_API.CREATE_CONSULTANT,
    '상담사 등록에 실패했습니다.',
  );
}

export function useAdminCreateStaff() {
  return useAdminUserCreateMutation<AdminCreateStaffPayload>(
    ADMIN_MOBILE_API.CREATE_STAFF,
    '스태프 등록에 실패했습니다.',
  );
}

export function getAdminUserCreateErrorMessage(error: unknown, fallback: string): string {
  return extractApiErrorMessage(error, fallback);
}
