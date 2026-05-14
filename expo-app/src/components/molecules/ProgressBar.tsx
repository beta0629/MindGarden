/**
 * ProgressBar — 예약 프로세스 진행 바 (3스텝)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme';

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  labels?: string[];
}

export function ProgressBar({ currentStep, totalSteps = 3, labels }: ProgressBarProps) {
  const theme = useTheme();
  const progress = currentStep / totalSteps;

  return (
    <View style={styles.container} accessibilityLabel={`${totalSteps}단계 중 ${currentStep}단계`}>
      <View style={[styles.barTrack, { backgroundColor: theme.colors.gray[200] }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: theme.colors.primary,
              borderRadius: 2,
            },
          ]}
        />
      </View>
      {labels && labels.length > 0 && (
        <View style={styles.labels}>
          {labels.map((label, i) => (
            <Text
              key={label}
              style={{
                fontFamily: i < currentStep ? theme.fontFamily.semibold : theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
                color: i < currentStep ? theme.colors.primary : theme.colors.textTertiary,
              }}
            >
              {label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
