/**
 * 단일 입장 CTA — 전폭 teal 버튼, 우측 문(입장) 아이콘. 화면당 Primary 1개.
 * `quiet` 은 빈 상태 보조 행동(알림 확인 등)용 hairline 버튼이다. 예약 생성 용도로 쓰지 않는다.
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DoorOpen, type LucideIcon } from 'lucide-react-native';
import { borderRadius, fontFamily, fontSize, spacing } from '@/theme';
import { CLINIC_OS, COVER_METRICS } from './coverChapterTokens';

const ICON_SIZE = 20;

export interface PrimaryEntryCtaProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly accessibilityLabel?: string;
  readonly variant?: 'primary' | 'quiet';
  readonly icon?: LucideIcon;
}

export function PrimaryEntryCta({
  label,
  onPress,
  accessibilityLabel,
  variant = 'primary',
  icon: Icon = DoorOpen,
}: PrimaryEntryCtaProps) {
  const isPrimary = variant === 'primary';
  const fg = isPrimary ? CLINIC_OS.sheet : CLINIC_OS.teal;

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.root,
        isPrimary ? styles.primary : styles.quiet,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
      <Icon size={ICON_SIZE} color={fg} style={styles.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: COVER_METRICS.ctaHeight,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['4xl'],
  },
  primary: {
    backgroundColor: CLINIC_OS.teal,
  },
  quiet: {
    backgroundColor: CLINIC_OS.sheet,
    borderWidth: COVER_METRICS.hairline,
    borderColor: CLINIC_OS.hairline,
  },
  pressed: {
    opacity: COVER_METRICS.pressedOpacity,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
  },
  icon: {
    position: 'absolute',
    right: spacing.xl,
  },
});
