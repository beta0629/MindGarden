/**
 * iPad·넓은 화면에서 폰 레이아웃이 가로로 과도하게 늘어나지 않도록 본문 폭을 제한한다.
 *
 * @author MindGarden
 * @since 2026-09-11
 */
import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';

/** iPad 호환·가로 깨짐 완화용 콘텐츠 최대 폭 */
export const TABLET_CONTENT_MAX_WIDTH = 720;

export interface TabletContentShellProps {
  readonly children: ReactNode;
  readonly style?: ViewStyle;
  readonly maxWidth?: number;
}

export function TabletContentShell({
  children,
  style,
  maxWidth = TABLET_CONTENT_MAX_WIDTH,
}: TabletContentShellProps) {
  const { width } = useWindowDimensions();
  const constrain = width > maxWidth;

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
