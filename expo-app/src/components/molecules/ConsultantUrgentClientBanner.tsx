/**
 * 상담사 홈 — 긴급 내담자 1줄 배너 (P1)
 *
 * @author MindGarden
 * @since 2026-07-07
 * @see docs/design-system/SCREEN_SPEC_CONSULTANT_MOBILE_HOME.md §3.2
 */
import { Pressable, StyleSheet, Text, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/theme';
import type { HighPriorityClientItem } from '@/api/hooks/useConsultantHome';
import { buildConsultantUrgentClientBannerModel } from '@/utils/consultantHomeComponentUi';

interface ConsultantUrgentClientBannerProps {
  client: HighPriorityClientItem;
  onPress: () => void;
}

export function ConsultantUrgentClientBanner({
  client,
  onPress,
}: ConsultantUrgentClientBannerProps) {
  const theme = useTheme();
  const model = buildConsultantUrgentClientBannerModel(client);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.warning + '18',
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.lg,
          marginTop: theme.spacing.sm,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={model.accessibilityLabel}
    >
      <AlertCircle size={20} color={theme.colors.warning} />
      <Text
        style={[
          styles.text,
          {
            color: theme.colors.warning,
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.sm,
            marginLeft: theme.spacing.sm,
          },
        ]}
        numberOfLines={2}
      >
        {model.bannerText}
      </Text>
      <Text
        style={{
          color: theme.colors.warning,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.sm,
        }}
      >
        {model.ctaLabel}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    flex: 1,
  },
});
