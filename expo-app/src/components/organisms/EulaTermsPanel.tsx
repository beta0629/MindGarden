/**
 * Apple G1.2 UGC (P2-C) — EULA 약관 본문 패널 (스크롤 진척 추적).
 *
 * <p>디자이너 시안 §A.4.4 EulaTermsPanel organism. `bgSub` 카드 + 좌측 4px primary 악센트 +
 * 내부 ScrollView 로 약관 본문을 노출하고, 끝까지 스크롤 도달 시 콜백을 발화한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
import { useCallback } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '@/theme';

const ACCENT_BAR_WIDTH = 4;
const SCROLL_END_TOLERANCE_PX = 16;

export type EulaTermsPanelProps = {
  readonly body: string;
  readonly onReachEnd: () => void;
  readonly maxHeight: number;
  readonly testID?: string;
};

/**
 * 스크롤 끝(±16px) 도달을 판정한다.
 *
 * @param event RN ScrollView `onScroll` 이벤트
 * @returns 끝 도달 시 {@code true}
 */
function isScrolledToEnd(event: NativeSyntheticEvent<NativeScrollEvent>): boolean {
  const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
  return (
    contentOffset.y + layoutMeasurement.height >=
    contentSize.height - SCROLL_END_TOLERANCE_PX
  );
}

/**
 * EULA 약관 본문 패널.
 *
 * @param props {@link EulaTermsPanelProps}
 * @returns 패널
 */
export function EulaTermsPanel({ body, onReachEnd, maxHeight, testID }: EulaTermsPanelProps) {
  const theme = useTheme();

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isScrolledToEnd(event)) {
        onReachEnd();
      }
    },
    [onReachEnd],
  );

  // 짧은 약관(스크롤 불필요)도 즉시 끝 도달로 인정.
  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      // 컨테이너 maxHeight 보다 콘텐츠가 작으면 스크롤이 발생하지 않으므로 즉시 통과.
      if (height <= maxHeight) {
        onReachEnd();
      }
    },
    [maxHeight, onReachEnd],
  );

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel="이용약관 본문"
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.bgSub,
          borderRadius: theme.borderRadius.xl,
          borderLeftColor: theme.colors.primary,
          maxHeight,
        },
      ]}
      testID={testID}
    >
      <ScrollView
        nestedScrollEnabled
        scrollEventThrottle={32}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        showsVerticalScrollIndicator
        contentContainerStyle={styles.scrollContent}
      >
        <Text
          style={[
            {
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.regular,
            },
            theme.textStyles.body,
            styles.body,
          ]}
        >
          {body}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderLeftWidth: ACCENT_BAR_WIDTH,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingRight: 8,
  },
  body: {
    lineHeight: 22,
  },
});

export default EulaTermsPanel;
