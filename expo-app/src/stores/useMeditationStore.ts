/**
 * 명상 재생 상태 스토어 (MiniPlayer + Player 공유)
 * MMKV 기반 즐겨찾기 + 수련 통계 영속화
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { MeditationTrack } from '@/constants/meditationData';

const mmkv = createMMKV({ id: 'meditation-store' });

const zustandMMKVStorage = createJSONStorage(() => ({
  getItem: (name: string) => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string) => mmkv.set(name, value),
  removeItem: (name: string) => mmkv.remove(name),
}));

interface MeditationState {
  currentTrack: MeditationTrack | null;
  isPlaying: boolean;
  currentTime: number;
  favorites: number[];
  totalPracticeMinutes: number;
  streakDays: number;

  play: (track: MeditationTrack) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;
  tick: () => void;
  toggleFavorite: (trackId: number) => void;
  isFavorite: (trackId: number) => boolean;
  addPracticeMinutes: (minutes: number) => void;
}

export const useMeditationStore = create<MeditationState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      favorites: [],
      totalPracticeMinutes: 42,
      streakDays: 3,

      play: (track) => set({ currentTrack: track, isPlaying: true, currentTime: 0 }),
      pause: () => set({ isPlaying: false }),
      resume: () => set({ isPlaying: true }),
      stop: () => set({ currentTrack: null, isPlaying: false, currentTime: 0 }),
      seek: (time) => set({ currentTime: Math.max(0, time) }),
      tick: () => {
        const { currentTrack, currentTime, isPlaying } = get();
        if (!isPlaying || !currentTrack) return;
        if (currentTime >= currentTrack.durationSeconds) {
          set({ isPlaying: false });
          return;
        }
        set({ currentTime: currentTime + 1 });
      },
      toggleFavorite: (trackId) => {
        const { favorites } = get();
        const next = favorites.includes(trackId)
          ? favorites.filter((id) => id !== trackId)
          : [...favorites, trackId];
        set({ favorites: next });
      },
      isFavorite: (trackId) => get().favorites.includes(trackId),
      addPracticeMinutes: (minutes) => {
        set((s) => ({ totalPracticeMinutes: s.totalPracticeMinutes + minutes }));
      },
    }),
    {
      name: 'meditation-storage',
      storage: zustandMMKVStorage,
      partialize: (state) => ({
        favorites: state.favorites,
        totalPracticeMinutes: state.totalPracticeMinutes,
        streakDays: state.streakDays,
      }),
    },
  ),
);
