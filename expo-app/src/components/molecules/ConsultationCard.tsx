/**
 * ConsultationCard — 상담 이력/예정 카드 (내담자용 molecule)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Calendar, Clock } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import type { Schedule } from '@/api/hooks/useSchedules';

interface ConsultationCardProps {
  schedule: Schedule;
  index?: number;
  onPress?: () => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'primary' | 'success' | 'warning' | 'error' | 'gray' }
> = {
  BOOKED: { label: '예정', variant: 'primary' },
  SCHEDULED: { label: '예정', variant: 'primary' },
  IN_PROGRESS: { label: '진행중', variant: 'warning' },
  COMPLETED: { label: '완료', variant: 'success' },
  CANCELLED: { label: '취소', variant: 'error' },
  NO_SHOW: { label: '미출석', variant: 'gray' },
};

function formatTime(time: string | undefined): string {
  if (!time) return '';
  const parts = time.split(':');
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : time;
}

export function ConsultationCard({
  schedule,
  index = 0,
  onPress,
}: ConsultationCardProps) {
  const theme = useTheme();

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const statusCfg = STATUS_CONFIG[schedule.status] ?? STATUS_CONFIG['SCHEDULED']!;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).springify()}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.xl,
            ...theme.shadows.sm,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
        accessibilityLabel={`${schedule.consultantName ?? '상담사'} 상담, ${schedule.date ?? ''} ${schedule.startTime ?? ''}`}
        accessibilityRole="button"
      >
        <View style={styles.header}>
          <Badge label={statusCfg.label} variant={statusCfg.variant} />
        </View>

        <View style={styles.body}>
          <Avatar
            uri={schedule.clientProfileImageUrl}
            name={schedule.consultantName}
            size="md"
          />
          <View style={styles.info}>
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                color: theme.colors.textMain,
              }}
              numberOfLines={1}
            >
              {schedule.consultantName ?? '-'}
            </Text>
            <View style={styles.metaRow}>
              <Calendar size={14} color={theme.colors.textSecondary} />
              <Text
                style={{
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textSecondary,
                  marginLeft: 4,
                }}
              >
                {schedule.date ? schedule.date : '날짜 미정'}
              </Text>
            </View>
            {(schedule.startTime || schedule.endTime) && (
            <View style={styles.metaRow}>
              <Clock size={14} color={theme.colors.textSecondary} />
              <Text
                style={{
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.textSecondary,
                  marginLeft: 4,
                }}
              >
                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
              </Text>
            </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
