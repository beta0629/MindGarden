/**
 * 명상 expo-audio 플레이어 — 슬라이더 시크 등 자식 화면에서 제어
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { createContext, useContext, type ReactNode } from 'react';

export interface MeditationPlaybackControls {
  seekPlaybackTo: (seconds: number) => Promise<void>;
}

const MeditationPlaybackContext = createContext<MeditationPlaybackControls | null>(
  null,
);

export function MeditationPlaybackProvider({
  value,
  children,
}: {
  value: MeditationPlaybackControls;
  children: ReactNode;
}) {
  return (
    <MeditationPlaybackContext.Provider value={value}>
      {children}
    </MeditationPlaybackContext.Provider>
  );
}

export function useMeditationPlaybackControls(): MeditationPlaybackControls | null {
  return useContext(MeditationPlaybackContext);
}
