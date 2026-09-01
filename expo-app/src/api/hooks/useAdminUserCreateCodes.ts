/**
 * 어드민 사용자 등록 — CONSULTANT_GRADE·SPECIALTY 공통코드
 * useAdminSchedulePickers의 COMMON_CODE_API.group + normalizeCommonCodeGroup 패턴 재사용
 *
 * @author MindGarden
 * @since 2026-08-20
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiGet } from '../client';
import { COMMON_CODE_API } from '../endpoints';
import { useAdminApiTenantSync } from '@/hooks/useAdminApiTenantSync';
import { useAdminApiQueryReady } from '@/hooks/useAdminApiQueryReady';
import { isAdminMobileShellRole } from '@/utils/adminRole';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  normalizeCommonCodeGroup,
  type AdminCommonCodeOption,
} from '@/utils/adminCommonCodeNormalize';

const CODES_BASE = ['admin-mobile', 'user-create-codes'] as const;

export const ADMIN_USER_CREATE_CODE_QUERY_KEYS = {
  all: CODES_BASE,
  consultantGrades: (tenantId: string) => [...CODES_BASE, 'CONSULTANT_GRADE', tenantId] as const,
  specialties: (tenantId: string) => [...CODES_BASE, 'SPECIALTY', tenantId] as const,
};

/** 웹 ConsultantComprehensiveManagement 폴백과 동일 codeValue */
export const FALLBACK_CONSULTANT_GRADE_OPTIONS: readonly AdminCommonCodeOption[] = [
  { value: 'CONSULTANT_JUNIOR', label: '주니어', durationMinutes: 0 },
  { value: 'CONSULTANT_SENIOR', label: '시니어', durationMinutes: 0 },
  { value: 'CONSULTANT_EXPERT', label: '전문가', durationMinutes: 0 },
  { value: 'CONSULTANT_MASTER', label: '마스터', durationMinutes: 0 },
] as const;

const FALLBACK_SPECIALTY_OPTIONS: readonly AdminCommonCodeOption[] = [] as const;

function useAdminUserCreateCommonCodeGroup(
  group: 'CONSULTANT_GRADE' | 'SPECIALTY',
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

export function useAdminConsultantGradeCodes(
  options?: Partial<UseQueryOptions<AdminCommonCodeOption[]>>,
) {
  const { tenantId } = useAdminApiQueryReady();
  return useAdminUserCreateCommonCodeGroup(
    'CONSULTANT_GRADE',
    FALLBACK_CONSULTANT_GRADE_OPTIONS,
    ADMIN_USER_CREATE_CODE_QUERY_KEYS.consultantGrades(tenantId),
    options,
  );
}

export function useAdminSpecialtyCodes(
  options?: Partial<UseQueryOptions<AdminCommonCodeOption[]>>,
) {
  const { tenantId } = useAdminApiQueryReady();
  return useAdminUserCreateCommonCodeGroup(
    'SPECIALTY',
    FALLBACK_SPECIALTY_OPTIONS,
    ADMIN_USER_CREATE_CODE_QUERY_KEYS.specialties(tenantId),
    options,
  );
}
