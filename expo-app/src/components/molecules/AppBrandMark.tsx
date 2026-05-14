/**
 * 인앱 브랜드 마크 — 세로 풀 로고(이미지 내 타이포 포함)
 *
 * @author MindGarden
 * @since 2026-05-14
 */
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

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
        contentFit="contain"
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
  },
});
