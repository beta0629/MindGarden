/**
 * 상담일지 카드 (Molecule)
 * 날짜, 내담자, 요약 미리보기, 작성/미작성 상태
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FileText, AlertCircle } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { Badge } from '../atoms/Badge';

interface RecordCardProps {
  readonly clientName: string;
  readonly date: string;
  readonly time: string;
  readonly summary?: string;
  readonly isPending?: boolean;
  readonly tags?: string[];
  readonly onPress?: () => void;
  readonly index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function RecordCard({
  clientName,
  date,
  time,
  summary,
  isPending = false,
  tags = [],
  onPress,
  index = 0,
}: RecordCardProps) {
  const theme = useTheme();

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
          padding: theme.spacing.lg,
          ...theme.shadows.sm,
          borderLeftWidth: isPending ? 3 : 0,
          borderLeftColor: isPending ? theme.colors.error : 'transparent',
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${clientName} ${date} 상담일지${isPending ? ' 미작성' : ''}`}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {isPending ? (
            <AlertCircle size={18} color={theme.colors.error} />
          ) : (
            <FileText size={18} color={theme.colors.primary} />
          )}
          <Text
            style={[
              styles.clientName,
              {
                color: theme.colors.textMain,
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                marginLeft: theme.spacing.sm,
              },
            ]}
            numberOfLines={1}
          >
            {clientName}
          </Text>
        </View>
        <Badge
          variant={isPending ? 'warning' : 'success'}
          label={isPending ? '미작성' : '완료'}
          size="sm"
        />
      </View>

      <Text
        style={{
          color: theme.colors.textSecondary,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.sm,
          marginTop: theme.spacing.xs,
        }}
      >
        {date} · {time}
      </Text>

      {summary ? (
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontFamily: theme.fontFamily.regular,
            fontSize: theme.fontSize.sm,
            marginTop: theme.spacing.sm,
          }}
          numberOfLines={2}
        >
          {summary}
        </Text>
      ) : null}

      {tags.length > 0 ? (
        <View style={[styles.tags, { marginTop: theme.spacing.sm }]}>
          {tags.slice(0, 3).map((tag) => (
            <View
              key={tag}
              style={[
                styles.tag,
                {
                  backgroundColor: theme.colors.accentSoft,
                  borderRadius: theme.borderRadius.sm,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: theme.spacing['2xs'],
                },
              ]}
            >
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize['2xs'],
                }}
              >
                {tag}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clientName: {
    flex: 1,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    alignSelf: 'flex-start',
  },
});
