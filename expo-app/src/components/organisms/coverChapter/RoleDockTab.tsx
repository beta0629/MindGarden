/**
 * 역할 도크 탭 아이콘·라벨 — 기하 스트로크 아이콘, 활성 탭은 teal + 라벨 아래 작은 점.
 *
 * @author MindGarden
 * @since 2026-11-06
 */
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, fontFamily, fontSize, spacing } from '@/theme';
import { CLINIC_OS, COVER_METRICS } from './coverChapterTokens';

const DOCK_ICON_SIZE = 22;
const DOCK_BADGE_SIZE = 8;
const DOCK_BADGE_OFFSET = -2;

export const ROLE_DOCK_TINT = {
  active: CLINIC_OS.teal,
  inactive: CLINIC_OS.muted,
} as const;

export interface RoleDockTabIconProps {
  readonly icon: LucideIcon;
  readonly color: string;
  readonly showBadge?: boolean;
}

export function RoleDockTabIcon({ icon: Icon, color, showBadge = false }: RoleDockTabIconProps) {
  return (
    <View>
      <Icon size={DOCK_ICON_SIZE} color={color} strokeWidth={1.75} />
      {showBadge ? <View style={styles.badge} /> : null}
    </View>
  );
}

export interface RoleDockTabLabelProps {
  readonly label: string;
  readonly focused: boolean;
  readonly color: string;
}

export function RoleDockTabLabel({ label, focused, color }: RoleDockTabLabelProps) {
  return (
    <View style={styles.labelWrap}>
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={[styles.dot, focused ? styles.dotActive : null]} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: DOCK_BADGE_OFFSET,
    right: DOCK_BADGE_OFFSET * 2,
    width: DOCK_BADGE_SIZE,
    height: DOCK_BADGE_SIZE,
    borderRadius: DOCK_BADGE_SIZE / 2,
    backgroundColor: colors.common.error,
  },
  labelWrap: {
    alignItems: 'center',
    gap: spacing['2xs'],
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  dot: {
    width: COVER_METRICS.dockDotSize,
    height: COVER_METRICS.dockDotSize,
    borderRadius: COVER_METRICS.dockDotSize / 2,
  },
  dotActive: {
    backgroundColor: CLINIC_OS.teal,
  },
});
