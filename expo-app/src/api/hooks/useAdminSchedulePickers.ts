/**
 * 일정 등록 피커 — 상담사(휴무)·매칭 내담자·공통코드
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiGet } from '../client';
import { ADMIN_MOBILE_API, COMMON_CODE_API } from '../endpoints';
import { useAdminApiTenantSync } from '@/hooks/useAdminApiTenantSync';
import { useAdminApiQueryReady } from '@/hooks/useAdminApiQueryReady';
import { isAdminMobileShellRole } from '@/utils/adminRole';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  FALLBACK_CONSULTATION_TYPE_OPTIONS,
  FALLBACK_DURATION_OPTIONS,
  normalizeCommonCodeGroup,
  type AdminCommonCodeOption,
} from '@/utils/adminCommonCodeNormalize';
import {
  parseConsultantsWithVacationResponse,
  parseMappingClientsResponse,
  type AdminConsultantVacationPickerItem,
  type AdminMappingClientPickerItem,
} from '@/utils/adminSchedulePickerNormalize';

const PICKER_BASE = ['admin-mobile', 'schedule-pickers'] as const;

export const ADMIN_SCHEDULE_PICKER_QUERY_KEYS = {
  all: PICKER_BASE,
  consultantsVacation: (tenantId: string, dateYmd: string) =>
    [...PICKER_BASE, 'consultants-vacation', tenantId, dateYmd] as const,
  mappingClients: (tenantId: string, consultantId: number) =>
    [...PICKER_BASE, 'mapping-clients', tenantId, consultantId] as const,
  consultationTypes: (tenantId: string) =>
    [...PICKER_BASE, 'consultation-type', tenantId] as const,
  durations: (tenantId: string) => [...PICKER_BASE, 'duration', tenantId] as const,
};

export type { AdminConsultantVacationPickerItem, AdminMappingClientPickerItem };

export function useAdminConsultantsWithVacation(
  dateYmd: string,
  options?: Partial<UseQueryOptions<AdminConsultantVacationPickerItem[]>>,
) {
  const { ready, tenantId } = useAdminApiQueryReady();
  const role = useAuthStore((s) => s.role);
  const allowed = isAdminMobileShellRole(role);
  useAdminApiTenantSync();

  return useQuery({
    queryKey: ADMIN_SCHEDULE_PICKER_QUERY_KEYS.consultantsVacation(tenantId, dateYmd),
    queryFn: async () => {
      const raw = await apiGet<unknown>(ADMIN_MOBILE_API.CONSULTANTS_WITH_VACATION, { date: dateYmd });
      return parseConsultantsWithVacationResponse(raw);
    },
    enabled: ready && allowed && dateYmd.length >= 10 && options?.enabled !== false,
    staleTime: 1000 * 60,
    ...options,
  });
}

export function useAdminMappingClientsByConsultant(
  consultantId: number | null,
  options?: Partial<UseQueryOptions<AdminMappingClientPickerItem[]>>,
) {
  const { ready, tenantId } = useAdminApiQueryReady();
  const role = useAuthStore((s) => s.role);
  const allowed = isAdminMobileShellRole(role);
  useAdminApiTenantSync();
  const id = consultantId ?? 0;

  return useQuery({
    queryKey: ADMIN_SCHEDULE_PICKER_QUERY_KEYS.mappingClients(tenantId, id),
    queryFn: async () => {
      const raw = await apiGet<unknown>(ADMIN_MOBILE_API.mappingsByConsultant(id));
      return parseMappingClientsResponse(raw);
    },
    enabled: ready && allowed && id > 0 && options?.enabled !== false,
    staleTime: 1000 * 60,
    ...options,
  });
}

function useAdminCommonCodeGroup(
  group: 'CONSULTATION_TYPE' | 'DURATION',
  fallback: readonly AdminCommonCodeOption[],
  queryKey: readonly unknown[],
  options?: Partial<UseQueryOptions<AdminCommonCodeOption[]>>,
) {
  const { ready, tenantId } = useAdminApiQueryReady();
  const role = useAuthStore((s) => s.role);
  const allowed = isAdminMobileShellRole(role);
  useAdminApiTenantSync();

  return useQuery({
    queryKey,
    queryFn: async () => {
      const raw = await apiGet<unknown>(COMMON_CODE_API.group(group));
      return normalizeCommonCodeGroup(raw, fallback);
    },
    enabled: ready && allowed && options?.enabled !== false,
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

export function useAdminConsultationTypeCodes(
  options?: Partial<UseQueryOptions<AdminCommonCodeOption[]>>,
) {
  const { tenantId } = useAdminApiQueryReady();
  return useAdminCommonCodeGroup(
    'CONSULTATION_TYPE',
    FALLBACK_CONSULTATION_TYPE_OPTIONS,
    ADMIN_SCHEDULE_PICKER_QUERY_KEYS.consultationTypes(tenantId),
    options,
  );
}

export function useAdminDurationCodes(
  options?: Partial<UseQueryOptions<AdminCommonCodeOption[]>>,
) {
  const { tenantId } = useAdminApiQueryReady();
  return useAdminCommonCodeGroup(
    'DURATION',
    FALLBACK_DURATION_OPTIONS,
    ADMIN_SCHEDULE_PICKER_QUERY_KEYS.durations(tenantId),
    options,
  );
}
