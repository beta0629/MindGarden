/**
 * ContentLetterbox — iPad 콘텐츠 컬럼 가운데 정렬 + 좌·우 letterbox 래퍼.
 *
 * <p>Apple G4 (iPad 화면 미최적화) 재제출 대응 (Build 1.0.9, 2026-06-10).
 * iPad portrait 임계(744pt) 이상에서만 children 을 max 440pt 컬럼에 가두고, 좌·우에 letterbox 배경
 * + 1px 보더를 그린다. iPhone 등 임계 미만에서는 zero-cost 로 children 을 그대로 반환한다.</p>
 *
 * <p>SSOT: P3-D 디자인 스펙(agent-transcripts/.../386990fa-9897-408e-b9c2-9dbfd3bc1260) §7.2.
 * 본 컴포넌트는 group _layout 의 Stack 을 래핑하는 형태로 적용해 18개 화면에 일괄 letterbox 를 부여한다.
 * 탭바·MiniPlayer·OfflineBanner·InAppNotificationToast·ApiEnvironmentBanner 등 글로벌 오버레이는
 * 본 래퍼 외부에 위치하여 풀폭 유지된다 (디자이너 §4 의 의도적 예외).</p>
 *
 * @author MindGarden
 * @since 2026-06-10
 */
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTheme } from '@/theme';
import {
  isLetterboxEnabled,
  LETTERBOX_BORDER_WIDTH,
  LETTERBOX_CONTENT_MAX_WIDTH,
} from '@/theme/letterbox';

export interface ContentLetterboxProps {
  /** 콘텐츠 컬럼에 렌더링할 자식 노드 */
  readonly children: React.ReactNode;
  /**
   * letterbox 좌·우 1px 보더 비노출 옵션 (default: false).
   * 스플래시·전체 미디어 플레이어 등 시각 분리감이 불필요한 경우에만 true.
   */
  readonly disableBorder?: boolean;
  /**
   * letterbox 활성화 자체를 강제 비활성 (default: false). 일부 진단/특수 화면 대응.
   * iPad 에서도 풀폭을 유지하고 싶을 때 사용.
   */
  readonly forceFullWidth?: boolean;
}

export function ContentLetterbox({
  children,
  disableBorder = false,
  forceFullWidth = false,
}: ContentLetterboxProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  if (forceFullWidth || !isLetterboxEnabled(width)) {
    /** iPhone 등 임계 미만 — children 을 그대로 통과 (zero-cost). */
    return <>{children}</>;
  }

  return (
    <View style={[styles.letterboxRoot, { backgroundColor: theme.colors.letterboxBg }]}>
      <View
        style={[
          styles.contentColumn,
          {
            maxWidth: LETTERBOX_CONTENT_MAX_WIDTH,
            backgroundColor: theme.colors.bgMain,
            borderLeftWidth: disableBorder ? 0 : LETTERBOX_BORDER_WIDTH,
            borderRightWidth: disableBorder ? 0 : LETTERBOX_BORDER_WIDTH,
            borderColor: theme.colors.letterboxBorder,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  letterboxRoot: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  contentColumn: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
});
