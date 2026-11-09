/**
 * 커버+챕터 레이아웃 모드 — 창 크기 변화(회전·Split View)에 반응한다.
 * 태블릿 임계는 iPad letterbox 활성 임계와 동일 값을 쓴다.
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import { useWindowDimensions } from 'react-native';
import { LETTERBOX_ACTIVATION_WIDTH } from '@/theme/letterbox';
import { resolveCoverLayoutMode, type CoverLayoutMode } from '@/utils/coverChapterViewModel';

export function useCoverLayoutMode(): CoverLayoutMode {
  const { width, height } = useWindowDimensions();
  return resolveCoverLayoutMode(width, height, LETTERBOX_ACTIVATION_WIDTH);
}
