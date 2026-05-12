/**
 * 인증 상태 스토어
 * expo-secure-store로 토큰 암호화 저장, MMKV로 사용자 정보 캐시
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { createMMKV } from 'react-native-mmkv';

const SECURE_KEY_ACCESS_TOKEN = 'mg_access_token';
const SECURE_KEY_REFRESH_TOKEN = 'mg_refresh_token';

const mmkvAuthStorage = createMMKV({ id: 'auth-store' });

const zustandMMKVStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    const value = mmkvAuthStorage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    mmkvAuthStorage.set(name, value);
  },
  removeItem: (name: string) => {
    mmkvAuthStorage.remove(name);
  },
}));

export interface User {
  id: number;
  email: string;
  name: string;
  nickname?: string;
  role: 'client' | 'consultant';
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
  role: 'client' | 'consultant' | null;
  isLoading: boolean;
  login: (user: User, tokens: Tokens) => Promise<void>;
  logout: () => Promise<void>;
  updateTokens: (tokens: Tokens) => Promise<void>;
  restoreTokens: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      role: null,
      isLoading: true,

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
        });
      },

      logout: async () => {
        await SecureStore.deleteItemAsync(SECURE_KEY_ACCESS_TOKEN);
        await SecureStore.deleteItemAsync(SECURE_KEY_REFRESH_TOKEN);
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          role: null,
          isLoading: false,
        });
      },

      updateTokens: async (tokens) => {
        await SecureStore.setItemAsync(SECURE_KEY_ACCESS_TOKEN, tokens.accessToken);
        await SecureStore.setItemAsync(SECURE_KEY_REFRESH_TOKEN, tokens.refreshToken);
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
      },

      restoreTokens: async () => {
        const accessToken = await SecureStore.getItemAsync(SECURE_KEY_ACCESS_TOKEN);
        const refreshToken = await SecureStore.getItemAsync(SECURE_KEY_REFRESH_TOKEN);
        if (accessToken && refreshToken) {
          set({ accessToken, refreshToken, isAuthenticated: true });
        }
        set({ isLoading: false });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      storage: zustandMMKVStorage,
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
