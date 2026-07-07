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
import { CONSULTANT_HOME_COPY } from '@/constants/consultantHomeCopy';

interface ConsultantUrgentClientBannerProps {
  client: HighPriorityClientItem;
  onPress: () => void;
}

export function ConsultantUrgentClientBanner({
  client,
  onPress,
}: ConsultantUrgentClientBannerProps) {
  const theme = useTheme();

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const riskLabel = CONSULTANT_HOME_COPY.riskLevelLabel(client.riskLevel);

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
      accessibilityLabel={CONSULTANT_HOME_COPY.URGENT_CLIENT_BANNER_A11Y(client.clientName, riskLabel)}
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
        {CONSULTANT_HOME_COPY.URGENT_CLIENT_BANNER(client.clientName, riskLabel)}
      </Text>
      <Text
        style={{
          color: theme.colors.warning,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.sm,
        }}
      >
        {CONSULTANT_HOME_COPY.PENDING_BANNER_CTA}
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
