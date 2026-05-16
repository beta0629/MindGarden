/**
 * 테넌트 상태 스토어
 * MMKV 영속화 — 앱 시작 시 캐시된 tenantCode 자동 로드
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createZustandMmkvPersistStorage } from '@/lib/getMmkv';

const zustandMMKVStorage = createZustandMmkvPersistStorage('tenant-store');

interface RecentTenant {
  code: string;
  id: string;
  name: string;
  lastUsed: number;
}

function pickTenantIdFromRecent(
  tenantCode: string | null,
  recentTenants: RecentTenant[],
): string | null {
  const c = tenantCode?.trim();
  if (!c || recentTenants.length === 0) {
    return null;
  }
  const hit = recentTenants.find((t) => t.code === c);
  const id = hit?.id?.trim();
  return id && id.length > 0 ? id : null;
}

interface TenantState {
  tenantCode: string | null;
  tenantId: string | null;
  tenantName: string | null;
  recentTenants: RecentTenant[];
  /** MMKV persist rehydrate 완료 여부 — Query `enabled` 레이스 방지 */
  _hasHydrated: boolean;
  setTenant: (code: string, id: string, name: string) => void;
  clearTenant: () => void;
  addRecentTenant: (code: string, id: string, name: string) => void;
}

const MAX_RECENT_TENANTS = 5;

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      tenantCode: null,
      tenantId: null,
      tenantName: null,
      recentTenants: [],
      _hasHydrated: false,

      setTenant: (code, id, name) => {
        set({ tenantCode: code, tenantId: id, tenantName: name });
        get().addRecentTenant(code, id, name);
      },

      clearTenant: () => {
        set({ tenantCode: null, tenantId: null, tenantName: null });
      },

      addRecentTenant: (code, id, name) => {
        const { recentTenants } = get();
        const filtered = recentTenants.filter((t) => t.code !== code);
        const updated: RecentTenant[] = [
          { code, id, name, lastUsed: Date.now() },
          ...filtered,
        ].slice(0, MAX_RECENT_TENANTS);
        set({ recentTenants: updated });
      },
    }),
    {
      name: 'tenant-storage',
      storage: zustandMMKVStorage,
      onRehydrateStorage: () => (state, error) => {
        if (error == null && state != null) {
          const recovered = pickTenantIdFromRecent(state.tenantCode, state.recentTenants ?? []);
          if (recovered != null && !(state.tenantId ?? '').trim()) {
            const hit = state.recentTenants?.find((t) => t.code === state.tenantCode);
            useTenantStore.setState({
              tenantId: recovered,
              tenantName: state.tenantName ?? hit?.name ?? null,
            });
          }
        }
        useTenantStore.setState({ _hasHydrated: true });
      },
    },
  ),
);
