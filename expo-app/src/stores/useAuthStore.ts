/**
 * 인증 상태 스토어
 * expo-secure-store로 토큰 암호화 저장, MMKV로 사용자 정보 캐시
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { createZustandMmkvPersistStorage } from '@/lib/getMmkv';
import { resolveStoreRoleFromAccessToken } from '@/utils/adminRole';
import { decodeJwtPayload, parseJwtSubAsUserId } from '@/utils/jwtPayload';
import { syncTenantStoreFromAccessToken } from '@/utils/tenantJwtSync';
import { clearJsessionId, hydrateJsessionCacheFromSecureStore } from '@/utils/sessionCookie';

const SECURE_KEY_ACCESS_TOKEN = 'mg_access_token';
const SECURE_KEY_REFRESH_TOKEN = 'mg_refresh_token';

const zustandMMKVStorage = createZustandMmkvPersistStorage('auth-store');

export type AppAuthRole = 'client' | 'consultant' | 'admin' | 'staff';

export interface User {
  id: number;
  email: string;
  name: string;
  nickname?: string;
  role: AppAuthRole;
  profileImageUrl?: string;
  tenantId?: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  role: AppAuthRole | null;
  isLoading: boolean;
  /** MMKV persist + SecureStore `restoreTokens` 완료 — Query `enabled` 레이스 방지 */
  _hasHydrated: boolean;
  login: (user: User, tokens: Tokens) => Promise<void>;
  logout: () => Promise<void>;
  updateTokens: (tokens: Tokens) => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  restoreTokens: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

type AuthSetState = (
  partial:
    | Partial<AuthState>
    | ((state: AuthState) => Partial<AuthState>),
) => void;
type AuthGetState = () => AuthState;

/** persist rehydrate 시점에는 `useAuthStore` export가 아직 없을 수 있음 — get/set 클로저만 사용 */
let authGetState: AuthGetState | null = null;
let authSetState: AuthSetState | null = null;
let authRestoreTokens: (() => Promise<void>) | null = null;

async function runRestoreTokensFromSecureStore(
  set: AuthSetState,
): Promise<void> {
  const accessToken = await SecureStore.getItemAsync(SECURE_KEY_ACCESS_TOKEN);
  const refreshToken = await SecureStore.getItemAsync(SECURE_KEY_REFRESH_TOKEN);
  if (accessToken && refreshToken) {
    const jwtTenantId = syncTenantStoreFromAccessToken(accessToken);
    const jwtPayload = decodeJwtPayload(accessToken);
    const roleFromJwt = resolveStoreRoleFromAccessToken(accessToken);
    await hydrateJsessionCacheFromSecureStore();
    set((state) => {
      const role = roleFromJwt ?? state.role;
      let user = state.user;
      if (user != null && role != null) {
        user = {
          ...user,
          role,
          ...(jwtTenantId ? { tenantId: jwtTenantId } : {}),
        };
      } else if (user == null && role != null) {
        const userId = parseJwtSubAsUserId(jwtPayload);
        if (userId != null) {
          user = {
            id: userId,
            email: '',
            name: '',
            role,
            ...(jwtTenantId ? { tenantId: jwtTenantId } : {}),
          };
        }
      } else if (user != null && jwtTenantId) {
        user = { ...user, tenantId: jwtTenantId };
      }
      return {
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
        _hasHydrated: true,
        role,
        user,
      };
    });
    return;
  }
  set({
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    _hasHydrated: true,
  });
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      authGetState = get;
      authSetState = set;
      authRestoreTokens = () => runRestoreTokensFromSecureStore(set);

      return {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      role: null,
      isLoading: true,
      _hasHydrated: false,

      login: async (user, tokens) => {
        await SecureStore.setItemAsync(SECURE_KEY_ACCESS_TOKEN, tokens.accessToken);
        await SecureStore.setItemAsync(SECURE_KEY_REFRESH_TOKEN, tokens.refreshToken);
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
          role: user.role,
          isLoading: false,
          _hasHydrated: true,
        });
      },

      logout: async () => {
        await SecureStore.deleteItemAsync(SECURE_KEY_ACCESS_TOKEN);
        await SecureStore.deleteItemAsync(SECURE_KEY_REFRESH_TOKEN);
        await clearJsessionId();
        const { queryClient } = await import('../api/queryClient');
        queryClient.clear();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          role: null,
          isLoading: false,
          _hasHydrated: true,
        });
      },

      updateTokens: async (tokens) => {
        await SecureStore.setItemAsync(SECURE_KEY_ACCESS_TOKEN, tokens.accessToken);
        await SecureStore.setItemAsync(SECURE_KEY_REFRESH_TOKEN, tokens.refreshToken);
        const jwtTenantId = syncTenantStoreFromAccessToken(tokens.accessToken);
        await hydrateJsessionCacheFromSecureStore();
        set((state) => ({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user:
            state.user != null && jwtTenantId
              ? { ...state.user, tenantId: jwtTenantId }
              : state.user,
        }));
      },

      updateUser: (partial) => {
        set((state) => {
          if (state.user == null) {
            return state;
          }
          return { user: { ...state.user, ...partial } };
        });
      },

      restoreTokens: async () => {
        await runRestoreTokensFromSecureStore(set);
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    };
    },
    {
      name: 'auth-storage',
      storage: zustandMMKVStorage,
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (_state, error) => {
        queueMicrotask(() => {
          void (async () => {
            if (error != null) {
              authSetState?.({ _hasHydrated: true, isLoading: false });
              return;
            }
            if (authRestoreTokens == null) {
              authSetState?.({ _hasHydrated: true, isLoading: false });
              return;
            }
            await authRestoreTokens();
            if (authGetState != null && !authGetState()._hasHydrated) {
              authSetState?.({ _hasHydrated: true });
            }
          })();
        });
      },
    },
  ),
);
