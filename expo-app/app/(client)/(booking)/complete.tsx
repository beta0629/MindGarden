/**
 * 예약 완료 화면
 * 성공 애니메이션 + 예약 정보 카드
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  BounceIn,
  FadeInDown,
} from 'react-native-reanimated';
import { Check, Calendar, Clock, CalendarCheck } from 'lucide-react-native';
import { useTheme } from '@/theme';

export default function BookingComplete() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    consultantName: string;
    date: string;
    startTime: string;
    endTime: string;
  }>();

  const handleGoHome = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace('/(client)/(home)');
  };

  const handleAddToCalendar = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // TODO: Phase 3 — expo-calendar 연동
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.container}>
        {/* 성공 아이콘 */}
        <Animated.View
          entering={BounceIn.delay(200)}
          style={[
            styles.iconCircle,
            { backgroundColor: theme.colors.success + '20' },
          ]}
        >
          <View
            style={[
              styles.iconInner,
              { backgroundColor: theme.colors.success },
            ]}
          >
            <Check size={32} color={theme.colors.textOnPrimary} strokeWidth={3} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text
            style={{
              fontFamily: theme.fontFamily.bold,
              fontSize: theme.fontSize['2xl'],
              color: theme.colors.textMain,
              textAlign: 'center',
              marginTop: 24,
            }}
          >
            예약이 완료되었습니다
          </Text>
          <Text
            style={{
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textSecondary,
              textAlign: 'center',
              marginTop: 8,
            }}
          >
            상담사에게 예약 확인 알림이 전송됩니다
          </Text>
        </Animated.View>

        {/* 예약 정보 카드 */}
        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.xl,
              ...theme.shadows.sm,
            },
          ]}
        >
          <Text
            style={{
              fontFamily: theme.fontFamily.semibold,
              fontSize: theme.fontSize.base,
              color: theme.colors.textMain,
              marginBottom: 16,
            }}
          >
            {params.consultantName} 전문가
          </Text>
          <View style={styles.detailRow}>
            <Calendar size={16} color={theme.colors.textSecondary} />
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                marginLeft: 8,
              }}
            >
              {params.date}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Clock size={16} color={theme.colors.textSecondary} />
            <Text
              style={{
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.sm,
                color: theme.colors.textSecondary,
                marginLeft: 8,
              }}
            >
              {params.startTime} - {params.endTime}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(800).springify()}
          style={styles.buttonGroup}
        >
          <Pressable
            onPress={handleGoHome}
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
            accessibilityLabel="확인"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.base,
                color: theme.colors.textOnPrimary,
              }}
            >
              확인
            </Text>
          </Pressable>

          <Pressable
            onPress={handleAddToCalendar}
            style={[
              styles.secondaryButton,
              {
                borderColor: theme.colors.primary,
                borderRadius: theme.borderRadius.lg,
              },
            ]}
            accessibilityLabel="캘린더에 추가"
            accessibilityRole="button"
          >
            <CalendarCheck size={18} color={theme.colors.primary} />
            <Text
              style={{
                fontFamily: theme.fontFamily.semibold,
                fontSize: theme.fontSize.sm,
                color: theme.colors.primary,
                marginLeft: 6,
              }}
            >
              캘린더에 추가
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    width: '100%',
    padding: 20,
    marginTop: 32,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonGroup: {
    width: '100%',
    marginTop: 32,
    gap: 12,
  },
  primaryButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  secondaryButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderWidth: 1.5,
  },
});
