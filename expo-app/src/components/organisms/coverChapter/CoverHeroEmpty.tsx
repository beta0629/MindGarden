/**
 * 다음 상담이 없거나 불러오지 못했을 때의 히어로 자리 — 사실 그대로의 문구 + 비예약 보조 행동.
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { fontFamily, fontSize, spacing } from '@/theme';
import { PrimaryEntryCta } from './PrimaryEntryCta';
import { CLINIC_OS } from './coverChapterTokens';

export interface CoverHeroEmptyProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly description?: string;
  readonly actionLabel?: string;
  readonly actionIcon?: LucideIcon;
  readonly onAction?: () => void;
}

export function CoverHeroEmpty({
  eyebrow,
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
}: CoverHeroEmptyProps) {
  return (
    <View style={styles.root}>
      <View
        accessible
        accessibilityLabel={[eyebrow, title, description].filter(Boolean).join(', ')}
      >
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <PrimaryEntryCta label={actionLabel} onPress={onAction} variant="quiet" icon={actionIcon} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.xl,
  },
  eyebrow: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: CLINIC_OS.teal,
    marginBottom: spacing.xs,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize['2xl'],
    color: CLINIC_OS.ink,
  },
  description: {
    marginTop: spacing.xs,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: CLINIC_OS.muted,
  },
});
