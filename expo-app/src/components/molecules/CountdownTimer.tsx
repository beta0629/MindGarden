/**
 * CountdownTimer — 카운트다운 타이머 (D-day 또는 시:분:초)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { differenceInSeconds, differenceInDays, parseISO } from 'date-fns';
import { useTheme } from '@/theme';
import { fontSize as fontSizeTokens } from '@/theme/typography';

interface CountdownTimerProps {
  targetDate: string;
  targetTime?: string;
}

export function CountdownTimer({ targetDate, targetTime }: CountdownTimerProps) {
  const theme = useTheme();
  const [now, setNow] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const target = parseISO(
    targetTime ? `${targetDate}T${targetTime}` : `${targetDate}T00:00:00`,
  );

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const totalSeconds = differenceInSeconds(target, now);
  const daysRemaining = differenceInDays(target, now);

  if (totalSeconds <= 0) {
    return (
      <View style={styles.container} accessibilityLabel="상담 시간 도래">
        <Text
          style={{
            fontFamily: theme.fontFamily.semibold,
            fontSize: theme.fontSize.sm,
            color: theme.colors.success,
          }}
        >
          곧 시작됩니다
        </Text>
      </View>
    );
  }

  if (daysRemaining > 0) {
    return (
      <View style={styles.container} accessibilityLabel={`${daysRemaining}일 남음`}>
        <Text
          style={{
            fontFamily: theme.fontFamily.bold,
            fontSize: theme.fontSize.lg,
            color: theme.colors.primary,
          }}
        >
          D-{daysRemaining}
        </Text>
      </View>
    );
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <View
      style={styles.container}
      accessibilityLabel={`${hours}시간 ${minutes}분 ${seconds}초 남음`}
    >
      <View style={styles.timeRow}>
        <TimeBlock value={pad(hours)} label="시간" theme={theme} />
        <Text style={[styles.colon, { color: theme.colors.primary }]}>:</Text>
        <TimeBlock value={pad(minutes)} label="분" theme={theme} />
        <Text style={[styles.colon, { color: theme.colors.primary }]}>:</Text>
        <TimeBlock value={pad(seconds)} label="초" theme={theme} />
      </View>
    </View>
  );
}

interface TimeBlockProps {
  value: string;
  label: string;
  theme: ReturnType<typeof useTheme>;
}

function TimeBlock({ value, label, theme }: TimeBlockProps) {
  return (
    <View style={styles.timeBlock}>
      <Text
        style={{
          fontFamily: theme.fontFamily.bold,
          fontSize: theme.fontSize.xl,
          color: theme.colors.primary,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize['2xs'],
          color: theme.colors.textTertiary,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBlock: {
    alignItems: 'center',
    minWidth: 36,
  },
  colon: {
    fontSize: fontSizeTokens.xl,
    fontWeight: '700',
    marginHorizontal: 2,
  },
});
