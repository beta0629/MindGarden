/**
 * 명상 오디오 — expo-audio 세션 + 스토어 재생 위치 동기화
 * setAudioModeAsync: 무음 재생·백그라운드·인터럽트 정책 (expo-audio 문서)
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import {
  MEDITATION_DEFAULT_STREAM_URI,
  MEDITATION_LOCAL_DEMO_SILENCE,
  type MeditationTrack,
} from '@/constants/meditationData';
import { useMeditationStore } from '@/stores/useMeditationStore';
import {
  MeditationPlaybackProvider,
  type MeditationPlaybackControls,
} from '@/contexts/MeditationPlaybackContext';

const AUDIO_MODE_CONFIGURED = { current: false };

async function ensureMeditationAudioMode(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  if (AUDIO_MODE_CONFIGURED.current) {
    return;
  }
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'duckOthers',
    allowsRecording: false,
    shouldRouteThroughEarpiece: false,
  });
  AUDIO_MODE_CONFIGURED.current = true;
}

/**
 * 빈 문자열 `audioUri`는 로드 실패로 이어지므로 제외하고, 트랙 없음일 때는 null(유휴)을 반환한다.
 *
 * @param track 현재 트랙 또는 없음
 * @return expo-audio 소스(원격 URL·로컬 require 번들) 또는 유휴 시 null
 */
function resolvePlaybackSource(track: MeditationTrack | null | undefined): string | number | null {
  if (track == null) {
    return null;
  }
  const raw = track.audioUri;
  if (typeof raw === 'number') {
    return raw;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  const defaultStream = MEDITATION_DEFAULT_STREAM_URI;
  if (typeof defaultStream === 'string' && defaultStream.trim().length > 0) {
    return defaultStream.trim();
  }
  return MEDITATION_LOCAL_DEMO_SILENCE;
}

function isRemoteHttpPlaybackSource(source: string): boolean {
  const head = source.trim().toLowerCase();
  return head.startsWith('http://') || head.startsWith('https://');
}

function MeditationAudioBridgeInner({ children }: { children: ReactNode }) {
  const currentTrack = useMeditationStore((s) => s.currentTrack);
  const isPlaying = useMeditationStore((s) => s.isPlaying);
  const seekStore = useMeditationStore((s) => s.seek);
  const pauseStore = useMeditationStore((s) => s.pause);
  const addPracticeMinutes = useMeditationStore((s) => s.addPracticeMinutes);

  const { playbackSource, downloadFirst } = useMemo(() => {
    const playbackSource = resolvePlaybackSource(currentTrack);
    const downloadFirst =
      typeof playbackSource === 'string' && isRemoteHttpPlaybackSource(playbackSource);
    return { playbackSource, downloadFirst };
  }, [currentTrack?.id, currentTrack?.audioUri]); // eslint-disable-line react-hooks/exhaustive-deps -- 재생 소스는 id·audioUri만 사용

  const playerOptions = useMemo(
    () => ({
      updateInterval: 300,
      downloadFirst,
    }),
    [downloadFirst],
  );

  const player = useAudioPlayer(playbackSource, playerOptions);
  const status = useAudioPlayerStatus(player);
  const finishReportedRef = useRef(false);

  useEffect(() => {
    void ensureMeditationAudioMode();
  }, []);

  useEffect(() => {
    finishReportedRef.current = false;
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!currentTrack) {
      player.pause();
      return;
    }
    if (isPlaying && status.isLoaded) {
      player.play();
    } else {
      player.pause();
    }
  }, [isPlaying, currentTrack, status.isLoaded, player]);

  useEffect(() => {
    if (!currentTrack) {
      return;
    }
    if (!status.isLoaded) {
      return;
    }
    const cap = currentTrack.durationSeconds;
    const nextTime = Math.min(cap, Math.max(0, status.currentTime));
    seekStore(nextTime);
  }, [status.currentTime, status.isLoaded, currentTrack, seekStore]);

  useEffect(() => {
    if (!currentTrack || !status.didJustFinish) {
      return;
    }
    if (finishReportedRef.current) {
      return;
    }
    finishReportedRef.current = true;
    const listenedSec =
      status.duration > 0
        ? Math.min(status.duration, currentTrack.durationSeconds)
        : Math.min(status.currentTime, currentTrack.durationSeconds);
    addPracticeMinutes(Math.max(1, Math.round(listenedSec / 60)));
    pauseStore();
    player.pause();
  }, [
    status.didJustFinish,
    status.duration,
    status.currentTime,
    currentTrack,
    addPracticeMinutes,
    pauseStore,
    player,
  ]);

  useEffect(() => {
    if (!currentTrack || !isPlaying) {
      player.setActiveForLockScreen(false);
      return;
    }
    player.setActiveForLockScreen(true, {
      title: currentTrack.title,
      artist: 'MindGarden',
    });
    return () => {
      player.setActiveForLockScreen(false);
    };
  }, [currentTrack, isPlaying, player]);

  const controls = useMemo<MeditationPlaybackControls>(
    () => ({
      seekPlaybackTo: async (seconds: number) => {
        await player.seekTo(Math.max(0, seconds));
        seekStore(seconds);
      },
    }),
    [player, seekStore],
  );

  return <MeditationPlaybackProvider value={controls}>{children}</MeditationPlaybackProvider>;
}

/**
 * Tabs·미니플레이어를 감싸 명상 상세에서 seek 컨텍스트를 사용할 수 있게 한다.
 */
export function MeditationAudioBridge({ children }: { children: ReactNode }) {
  return <MeditationAudioBridgeInner>{children}</MeditationAudioBridgeInner>;
}
