/**
 * 테넌트 상태 스토어
 * MMKV 영속화 — 앱 시작 시 캐시된 tenantCode 자동 로드
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';

const mmkvStorage = createMMKV({ id: 'tenant-store' });

const zustandMMKVStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    const value = mmkvStorage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    mmkvStorage.set(name, value);
  },
  removeItem: (name: string) => {
    mmkvStorage.remove(name);
  },
}));

interface RecentTenant {
  code: string;
  id: string;
  name: string;
  lastUsed: number;
}

interface TenantState {
  tenantCode: string | null;
  tenantId: string | null;
  tenantName: string | null;
  recentTenants: RecentTenant[];
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
    },
  ),
);
