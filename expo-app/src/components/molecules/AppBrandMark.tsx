/**
 * 인앱 브랜드 마크 — 세로 풀 로고(이미지 내 타이포 포함).
 *
 * 로컬 PNG는 `react-native` `Image`로 표시(일부 실기기에서 `expo-image`+번들 조합 이슈 완화).
 *
 * @deprecated 2026-06-10 — 로그인 화면 리디자인 시 그라데이션 나비 자산
 *   (`assets/brand/mindgarden-butterfly-logo.png`) + 폰트 렌더링 타이포 조합으로 일원화.
 *   본 컴포넌트는 잠정 보존이며 사용처는 다음 두 곳뿐.
 *     - `expo-app/app/index.tsx` (splash variant) — 정리 대상 (다음 PR)
 *     - `expo-app/app/(auth)/tenant-select.tsx` (hero variant) — 정리 대상 (다음 PR)
 *   사용처 0 도달 후 본 파일 + `assets/images/mindgarden-brand-inapp.png` 모두 삭제 예정.
 *   SSOT: docs/design-system/EXPO_APP_LOGIN_SCREEN_REDESIGN_SPEC_20260609.md §10.1 / §14 #5.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
import { View, Image, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

const BRAND_SOURCE = require('../../../assets/images/mindgarden-brand-inapp.png');

const VARIANT_MAX_LAYOUT = {
  hero: { maxWidth: 260, maxHeight: 440 },
  splash: { maxWidth: 220, maxHeight: 380 },
  compact: { maxWidth: 160, maxHeight: 280 },
} as const;

export interface AppBrandMarkProps {
  readonly variant?: 'hero' | 'splash' | 'compact';
  readonly style?: StyleProp<ViewStyle>;
  readonly accessibilityLabel?: string;
}

export function AppBrandMark({
  variant = 'hero',
  style,
  accessibilityLabel = '마인드가든 심리상담센터',
}: AppBrandMarkProps) {
  const layout = VARIANT_MAX_LAYOUT[variant];

  return (
    <View
      style={[styles.root, style]}
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel}
    >
      <Image
        source={BRAND_SOURCE}
        resizeMode="contain"
        style={{
          width: layout.maxWidth,
          maxWidth: '100%',
          maxHeight: layout.maxHeight,
        }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    alignSelf: 'stretch',
    maxWidth: '100%',
    minHeight: 80,
  },
});
