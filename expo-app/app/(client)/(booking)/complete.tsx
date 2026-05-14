/**
 * 예약 완료 화면
 * 성공 애니메이션 + 예약 정보 카드 + 기기 캘린더 저장(expo-calendar는 버튼 탭 시에만 동적 import)
 *
 * @author MindGarden
 * @since 2026-05-12
 */
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { BounceIn, FadeInDown } from 'react-native-reanimated';
import { Check, Calendar as CalendarIcon, Clock, CalendarCheck } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { toDisplayString } from '@/utils/safeDisplay';

function normalizeTimePart(t: string | undefined): string {
  const v = (t ?? '').trim();
  if (!v) {
    return '09:00:00';
  }
  if (v.length === 5 && v.includes(':')) {
    return `${v}:00`;
  }
  return v;
}

function parseBookingRange(
  dateStr: string | undefined,
  start: string | undefined,
  end: string | undefined,
): { startDate: Date; endDate: Date } | null {
  const d = (dateStr ?? '').trim();
  if (!d) {
    return null;
  }
  const startDate = new Date(`${d}T${normalizeTimePart(start)}`);
  const endDate = new Date(`${d}T${normalizeTimePart(end)}`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }
  if (endDate.getTime() <= startDate.getTime()) {
    endDate.setTime(startDate.getTime() + 60 * 60 * 1000);
  }
  return { startDate, endDate };
}

/**
 * expo-calendar — 네이티브는 Dev Client 빌드에만 포함.
 * `typeof import('expo-calendar')` 는 Metro가 모듈 그래프에 정적으로 묶어 화면 진입 시
 * 네이티브를 즉시 로드해 크래시할 수 있어, 타입은 수동 정의 + 동적 import만 사용.
 */
type ExpoCalendarEntityTypes = { EVENT: string };

type ExpoCalendarModuleLike = {
  EntityTypes: ExpoCalendarEntityTypes;
  isAvailableAsync: () => Promise<boolean>;
  getDefaultCalendarAsync: () => Promise<{ id: string; allowsModifications: boolean } | undefined>;
  getCalendarsAsync: (
    entityType?: string,
  ) => Promise<{ id: string; allowsModifications: boolean }[]>;
  createEventAsync: (
    calendarId: string,
    event: { title: string; notes: string; startDate: Date; endDate: Date },
  ) => Promise<string>;
};

type CalendarModule = ExpoCalendarModuleLike & {
  createEventInCalendarAsync?: (
    eventData?: Record<string, unknown>,
    presentationOptions?: Record<string, unknown>,
  ) => Promise<unknown>;
};

async function loadExpoCalendar(): Promise<ExpoCalendarModuleLike> {
  try {
    const mod = await import('expo-calendar');
    return mod as ExpoCalendarModuleLike;
  } catch {
    throw new Error('NATIVE_MODULE_MISSING');
  }
}

async function persistBookingToCalendar(opts: {
  title: string;
  notes: string;
  startDate: Date;
  endDate: Date;
}): Promise<void> {
  const Calendar = await loadExpoCalendar();
  const Cal = Calendar as CalendarModule;
  if (typeof Cal.createEventInCalendarAsync === 'function') {
    try {
      await Cal.createEventInCalendarAsync({
        title: opts.title,
        notes: opts.notes,
        startDate: opts.startDate,
        endDate: opts.endDate,
      });
      return;
    } catch {
      /* OS UI 없거나 취소 시 프로그램 방식으로 재시도 */
    }
  }

  const available = await Calendar.isAvailableAsync();
  if (!available) {
    throw new Error('UNAVAILABLE');
  }

  let calendarId: string | null = null;
  if (Platform.OS === 'ios') {
    try {
      const def = await Calendar.getDefaultCalendarAsync();
      if (def?.allowsModifications) {
        calendarId = def.id;
      }
    } catch {
      calendarId = null;
    }
  }
  if (!calendarId) {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const picked = calendars.find((c) => c.allowsModifications) ?? calendars[0];
    calendarId = picked?.id ?? null;
  }
  if (!calendarId) {
    throw new Error('NO_CALENDAR');
  }

  await Calendar.createEventAsync(calendarId, {
    title: opts.title,
    notes: opts.notes,
    startDate: opts.startDate,
    endDate: opts.endDate,
  });
}

export default function BookingComplete() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    consultantName: string;
    date: string;
    startTime: string;
    endTime: string;
  }>();
  const [calendarBusy, setCalendarBusy] = useState(false);
  const consultantLabel = toDisplayString(params.consultantName, '상담');

  const handleGoHome = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.replace('/(client)/(home)');
  };

  const handleAddToCalendar = useCallback(async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        '캘린더',
        '웹에서는 기기 캘린더에 직접 추가할 수 없습니다. 모바일 앱에서 다시 시도해 주세요.',
      );
      return;
    }
    const range = parseBookingRange(params.date, params.startTime, params.endTime);
    if (!range) {
      Alert.alert(
        '일정을 만들 수 없습니다',
        '예약 날짜·시간 정보가 올바르지 않습니다. 예약 내역에서 다시 확인해 주세요.',
      );
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCalendarBusy(true);
    try {
      const name = toDisplayString(params.consultantName, '상담').trim() || '상담';
      await persistBookingToCalendar({
        title: `MindGarden 상담 · ${name}`,
        notes: '앱에서 예약한 상담 일정입니다.',
        startDate: range.startDate,
        endDate: range.endDate,
      });
      Alert.alert('캘린더', '일정이 캘린더에 추가되었습니다.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg === 'NATIVE_MODULE_MISSING') {
        Alert.alert(
          '캘린더 모듈',
          '이 빌드에는 기기 캘린더 연동(네이티브)이 포함되어 있지 않습니다. Dev Client로 다시 빌드해 주세요: npx expo run:ios 또는 npx expo run:android',
        );
        return;
      }
      Alert.alert(
        '캘린더에 추가하지 못했습니다',
        '캘린더 접근 권한을 허용했는지, 기본 캘린더가 있는지 확인한 뒤 다시 시도해 주세요.',
      );
    } finally {
      setCalendarBusy(false);
    }
  }, [params.consultantName, params.date, params.endTime, params.startTime]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.colors.bgMain }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.container}>
        {/* 성공 아이콘 */}
        <Animated.View
          entering={BounceIn.delay(200)}
          style={[styles.iconCircle, { backgroundColor: theme.colors.success + '20' }]}
        >
          <View style={[styles.iconInner, { backgroundColor: theme.colors.success }]}>
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
            {consultantLabel} 전문가
          </Text>
          <View style={styles.detailRow}>
            <CalendarIcon size={16} color={theme.colors.textSecondary} />
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

        <Animated.View entering={FadeInDown.delay(800).springify()} style={styles.buttonGroup}>
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
            disabled={calendarBusy}
            style={[
              styles.secondaryButton,
              {
                borderColor: theme.colors.primary,
                borderRadius: theme.borderRadius.lg,
                opacity: calendarBusy ? 0.6 : 1,
              },
            ]}
            accessibilityLabel="캘린더에 추가"
            accessibilityRole="button"
          >
            {calendarBusy ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <>
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
              </>
            )}
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
