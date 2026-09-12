/**
 * GET /api/v1/menus/lnb — RoleMenuPermission 반영 메뉴 트리
 *
 * @author MindGarden
 * @since 2026-09-11
 */
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import { MENU_API } from '@/constants/menuPermissionCodes';
import { useApiQueryReady } from '@/hooks/useApiQueryReady';
import type { LnbMenuNode } from '@/utils/menuAccessUtils';

export const LNB_MENU_QUERY_KEYS = {
  all: ['menus', 'lnb'] as const,
  byTenant: (tenantId: string) => [...LNB_MENU_QUERY_KEYS.all, tenantId] as const,
};

function unwrapLnbMenus(raw: unknown): LnbMenuNode[] {
  if (raw == null) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw as LnbMenuNode[];
  }
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const data = obj.data;
    if (Array.isArray(data)) {
      return data as LnbMenuNode[];
    }
  }
  return [];
}

async function fetchLnbMenus(): Promise<LnbMenuNode[]> {
  try {
    const raw = await apiGet<unknown>(MENU_API.LNB);
    return unwrapLnbMenus(raw);
  } catch {
    return [];
  }
}

/**
 * LNB 메뉴 훅. 실패·미로드 시 빈 배열(호출부 fail-closed).
 */
export function useLnbMenus(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const { ready, tenantId } = useApiQueryReady();

  const query = useQuery({
    queryKey: LNB_MENU_QUERY_KEYS.byTenant(tenantId),
    queryFn: fetchLnbMenus,
    enabled: ready && enabled,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  const menus = query.data ?? null;
  const menusReady = ready && !query.isLoading && query.isFetched;

  return {
    menus,
    menusReady,
    loading: query.isLoading,
    refetch: query.refetch,
    isError: query.isError,
  };
}
