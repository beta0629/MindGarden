/**
 * iPad·넓은 화면에서 폰 레이아웃이 가로로 과도하게 늘어나지 않도록 본문 폭을 제한한다.
 * Apple G4 follow-up: letterbox 토큰(440 / 744)과 정렬.
 *
 * @author MindGarden
 * @since 2026-09-11
 * @updated 2026-09-12 — letterbox 임계·폭 정합
 */
import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import {
  isLetterboxEnabled,
  LETTERBOX_CONTENT_MAX_WIDTH,
} from '@/theme/letterbox';

/** @deprecated Prefer LETTERBOX_CONTENT_MAX_WIDTH — 하위 호환 alias */
export const TABLET_CONTENT_MAX_WIDTH = LETTERBOX_CONTENT_MAX_WIDTH;

export interface TabletContentShellProps {
  readonly children: ReactNode;
  readonly style?: ViewStyle;
  readonly maxWidth?: number;
}

export function TabletContentShell({
  children,
  style,
  maxWidth = LETTERBOX_CONTENT_MAX_WIDTH,
}: TabletContentShellProps) {
  const { width } = useWindowDimensions();
  const constrain = maxWidth === LETTERBOX_CONTENT_MAX_WIDTH
    ? isLetterboxEnabled(width)
    : width > maxWidth;

  return (
    <View
      style={[
        styles.outer,
        constrain ? { alignItems: 'center' } : null,
        style,
      ]}
    >
      <View style={[styles.inner, constrain ? { width: maxWidth, maxWidth: '100%' } : styles.innerFill]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    width: '100%',
  },
  inner: {
    flex: 1,
  },
  innerFill: {
    width: '100%',
  },
});
