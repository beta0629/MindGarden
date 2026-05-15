/**
 * 내담자 카드 (Molecule)
 * 아바타, 이름, 최근 상담일, 위험도 Badge
 *
 * @author MindGarden
 * @since 2026-05-12
 * @see docs/design-system/v2/CONSULTANT_CLIENT_COMPONENTS_SPEC.md §3
 */
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import type { RiskLevel, ClientStatus } from '@/api/hooks/useClients';

interface ClientCardProps {
  readonly name: string;
  readonly profileImageUrl?: string | null;
  readonly lastSessionDate?: string;
  readonly status: ClientStatus;
  readonly riskLevel?: RiskLevel;
  readonly totalSessions: number;
  readonly onPress?: () => void;
  readonly index?: number;
}

const RISK_LABEL: Record<RiskLevel, string> = {
  LOW: '안정',
  MEDIUM: '관찰',
  HIGH: '주의',
  CRITICAL: '위험',
};

const RISK_VARIANT: Record<RiskLevel, 'success' | 'info' | 'warning' | 'error'> = {
  LOW: 'success',
  MEDIUM: 'info',
  HIGH: 'warning',
  CRITICAL: 'error',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ClientCard({
  name,
  profileImageUrl,
  lastSessionDate,
  status,
  riskLevel,
  totalSessions,
  onPress,
  index = 0,
}: ClientCardProps) {
  const theme = useTheme();
  const safeTotalSessions = Number.isFinite(totalSessions) ? totalSessions : 0;

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  return (
    <AnimatedPressable
      entering={FadeInDown.delay(index * 80).duration(300)}
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
          paddingVertical: theme.spacing.lg,
          paddingHorizontal: theme.spacing.xl,
          ...theme.shadows.sm,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${name}, 총 ${safeTotalSessions}회 상담`}
    >
      <Avatar uri={profileImageUrl} name={name} size="lg" />

      <View style={[styles.info, { marginLeft: theme.spacing.md }]}>
        <View style={styles.nameRow}>
          <Text
            style={{
              color: theme.colors.textMain,
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
            }}
            numberOfLines={1}
          >
            {name}
          </Text>
          {riskLevel && riskLevel !== 'LOW' ? (
            <Badge variant={RISK_VARIANT[riskLevel]} label={RISK_LABEL[riskLevel]} size="sm" />
          ) : null}
        </View>

        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            marginTop: theme.spacing['2xs'],
          }}
          numberOfLines={1}
        >
          {lastSessionDate ? `최근 상담: ${lastSessionDate}` : '상담 이력 없음'}
          {` · ${safeTotalSessions}회`}
        </Text>

        {status === 'INACTIVE' ? <Badge variant="gray" label="비활성" size="sm" /> : null}
      </View>

      <ChevronRight size={20} color={theme.colors.gray[300]} style={styles.chevron} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevron: {
    marginLeft: 8,
  },
});
