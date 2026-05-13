/**
 * 알림 설정 로컬 스토어 (MMKV 영속화)
 * 포그라운드 핸들러가 카테고리별 on/off 판단 시 즉시 참조
 * 서버 동기화는 useUpdateNotificationSettings 훅에서 별도 수행
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createZustandMmkvPersistStorage } from '@/lib/getMmkv';
import type { NotificationSettingsCategory } from '../constants/pushScenarios';

const zustandMMKVStorage = createZustandMmkvPersistStorage('notification-settings-store');

export interface NotificationSettingsMap {
  schedule: boolean;
  payment: boolean;
  message: boolean;
  wellness: boolean;
  system: boolean;
}

interface NotificationSettingsState {
  settings: NotificationSettingsMap;
  setCategory: (category: NotificationSettingsCategory, enabled: boolean) => void;
  setCategoryAll: (all: Partial<NotificationSettingsMap>) => void;
  isEnabled: (category: NotificationSettingsCategory) => boolean;
  reset: () => void;
}

const DEFAULT_SETTINGS: NotificationSettingsMap = {
  schedule: true,
  payment: true,
  message: true,
  wellness: true,
  system: true,
};

export const useNotificationSettingsStore = create<NotificationSettingsState>()(
  persist(
    (set, get) => ({
      settings: { ...DEFAULT_SETTINGS },

      setCategory: (category, enabled) => {
        set((state) => ({
          settings: { ...state.settings, [category]: enabled },
        }));
      },

      setCategoryAll: (all) => {
        set((state) => ({
          settings: { ...state.settings, ...all },
        }));
      },

      isEnabled: (category) => {
        return get().settings[category] ?? true;
      },

      reset: () => {
        set({ settings: { ...DEFAULT_SETTINGS } });
      },
    }),
    {
      name: 'notification-settings-storage',
      storage: zustandMMKVStorage,
    },
  ),
);
