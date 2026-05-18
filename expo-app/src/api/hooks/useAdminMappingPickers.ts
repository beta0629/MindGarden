/**
 * 신규 매칭 폼 피커 — 패키지·결제·내담자 목록
 *
 * @author MindGarden
 * @since 2026-05-18
 */
import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { apiGet } from '../client';
import { ADMIN_MOBILE_API, COMMON_CODE_API } from '../endpoints';
import { useAdminApiTenantSync } from '@/hooks/useAdminApiTenantSync';
import { useAdminApiQueryReady } from '@/hooks/useAdminApiQueryReady';
import { canManageMappingsOnMobile } from '@/utils/adminRole';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  normalizeClientsWithMappingInfo,
  normalizeConsultationPackageCodes,
  normalizeMappingSimpleCodeGroup,
  type AdminMappingClientWithInfo,
  type AdminMappingPackageOption,
  type AdminMappingSimpleCodeOption,
} from '@/utils/adminMappingPackageNormalize';

const PICKER_BASE = ['admin-mobile', 'mapping-pickers'] as const;

export const ADMIN_MAPPING_PICKER_QUERY_KEYS = {
  all: PICKER_BASE,
  packages: (tenantId: string) => [...PICKER_BASE, 'packages', tenantId] as const,
  paymentMethods: (tenantId: string) => [...PICKER_BASE, 'payment-method', tenantId] as const,
  responsibilities: (tenantId: string) => [...PICKER_BASE, 'responsibility', tenantId] as const,
  clients: (tenantId: string) => [...PICKER_BASE, 'clients', tenantId] as const,
};

export type { AdminMappingClientWithInfo, AdminMappingPackageOption, AdminMappingSimpleCodeOption };

function useMappingPickerQuery<T>(
  queryKey: readonly unknown[],
  group: 'CONSULTATION_PACKAGE' | 'PAYMENT_METHOD' | 'RESPONSIBILITY',
  normalize: (raw: unknown) => T[],
  options?: Partial<UseQueryOptions<T[]>>,
) {
  const { ready, tenantId } = useAdminApiQueryReady();
  const role = useAuthStore((s) => s.role);
  const accessToken = useAuthStore((s) => s.accessToken);
  const allowed = canManageMappingsOnMobile(role, accessToken);
  useAdminApiTenantSync();

  return useQuery({
    queryKey,
    queryFn: async () => {
      const raw = await apiGet<unknown>(COMMON_CODE_API.group(group));
      return normalize(raw);
    },
    enabled: ready && allowed && options?.enabled !== false,
    staleTime: 1000 * 60 * 10,
    ...options,
  });
}

export function useAdminMappingPackageCodes(
  options?: Partial<UseQueryOptions<AdminMappingPackageOption[]>>,
) {
  const { tenantId } = useAdminApiQueryReady();
  return useMappingPickerQuery(
    ADMIN_MAPPING_PICKER_QUERY_KEYS.packages(tenantId),
    'CONSULTATION_PACKAGE',
    normalizeConsultationPackageCodes,
    options,
  );
}

export function useAdminMappingPaymentMethodCodes(
  options?: Partial<UseQueryOptions<AdminMappingSimpleCodeOption[]>>,
) {
  const { tenantId } = useAdminApiQueryReady();
  return useMappingPickerQuery(
    ADMIN_MAPPING_PICKER_QUERY_KEYS.paymentMethods(tenantId),
    'PAYMENT_METHOD',
    normalizeMappingSimpleCodeGroup,
    options,
  );
}

export function useAdminMappingResponsibilityCodes(
  options?: Partial<UseQueryOptions<AdminMappingSimpleCodeOption[]>>,
) {
  const { tenantId } = useAdminApiQueryReady();
  return useMappingPickerQuery(
    ADMIN_MAPPING_PICKER_QUERY_KEYS.responsibilities(tenantId),
    'RESPONSIBILITY',
    normalizeMappingSimpleCodeGroup,
    options,
  );
}

export function useAdminClientsWithMappingInfo(
  options?: Partial<UseQueryOptions<AdminMappingClientWithInfo[]>>,
) {
  const { ready, tenantId } = useAdminApiQueryReady();
  const role = useAuthStore((s) => s.role);
  const accessToken = useAuthStore((s) => s.accessToken);
  const allowed = canManageMappingsOnMobile(role, accessToken);
  useAdminApiTenantSync();

  return useQuery({
    queryKey: ADMIN_MAPPING_PICKER_QUERY_KEYS.clients(tenantId),
    queryFn: async () => {
      const raw = await apiGet<unknown>(ADMIN_MOBILE_API.CLIENTS_WITH_MAPPING_INFO);
      return normalizeClientsWithMappingInfo(raw);
    },
    enabled: ready && allowed && options?.enabled !== false,
    staleTime: 1000 * 60,
    ...options,
  });
}
