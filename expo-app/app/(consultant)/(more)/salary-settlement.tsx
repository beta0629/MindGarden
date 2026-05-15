/**
 * 상담사 급여 정산 — 관리자 확정·승인·지급 결과 조회 전용 (매출·수입 리포트와 무관)
 *
 * @author MindGarden
 * @since 2026-05-15
 */
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { AlertCircle, Wallet } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useConsultantSalarySettlements } from '@/api/hooks/useConsultantSalarySettlements';
import { CONSULTANT_SALARY_SETTLEMENT_COPY } from '@/constants/consultantSalarySettlementCopy';
import { useAuthStore } from '@/stores/useAuthStore';
import { EmptyState } from '@/components/atoms/EmptyState';
import { toDisplayString, toSafeNumber } from '@/utils/safeDisplay';

function getQueryErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return toDisplayString(error.message, fallback);
  }
  if (error != null && typeof error === 'object' && 'message' in error) {
    return toDisplayString((error as { message: unknown }).message, fallback);
  }
  return fallback;
}

function formatWon(value: unknown): string {
  const n = toSafeNumber(value, Number.NaN);
  if (!Number.isFinite(n)) {
    return '—';
  }
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(n);
}

function periodLabel(row: {
  calculationPeriod?: string | null;
  calculationPeriodStart?: string | null;
  calculationPeriodEnd?: string | null;
}): string {
  const p = row.calculationPeriod?.trim();
  if (p) {
    return toDisplayString(p, '—');
  }
  const s = row.calculationPeriodStart;
  const e = row.calculationPeriodEnd;
  if (s && e) {
    const a = String(s).split('T')[0];
    const b = String(e).split('T')[0];
    return toDisplayString(`${a} ~ ${b}`, '—');
  }
  return '—';
}

export default function ConsultantSalarySettlementScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const hasUser = Boolean(user?.id);
  const { data, isLoading, isError, error, refetch, isFetching, isSuccess } =
    useConsultantSalarySettlements({ enabled: hasUser });

  const rows = Array.isArray(data) ? data : [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <Stack.Screen
        options={{ headerShown: true, title: CONSULTANT_SALARY_SETTLEMENT_COPY.SCREEN_TITLE }}
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text
          style={[
            styles.intro,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              fontSize: theme.fontSize.sm,
            },
          ]}
        >
          {CONSULTANT_SALARY_SETTLEMENT_COPY.INTRO}
        </Text>

        {!hasUser ? (
          <EmptyState
            icon={<AlertCircle size={32} color={theme.colors.textTertiary} />}
            title={CONSULTANT_SALARY_SETTLEMENT_COPY.NO_USER_TITLE}
            description={CONSULTANT_SALARY_SETTLEMENT_COPY.NO_USER_HINT}
          />
        ) : isLoading ? (
          <View style={styles.center} accessibilityRole="progressbar">
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
        ) : isError ? (
          <View style={styles.center}>
            <Text style={{ color: theme.colors.error, fontFamily: theme.fontFamily.medium }}>
              {getQueryErrorMessage(error, CONSULTANT_SALARY_SETTLEMENT_COPY.LOAD_ERROR)}
            </Text>
            <Pressable
              onPress={() => refetch()}
              style={({ pressed }) => [
                styles.retry,
                {
                  color: theme.colors.accent,
                  fontFamily: theme.fontFamily.medium,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={CONSULTANT_SALARY_SETTLEMENT_COPY.RETRY}
            >
              <Text
                style={{
                  color: theme.colors.accent,
                  fontFamily: theme.fontFamily.medium,
                  fontSize: 16,
                }}
              >
                {CONSULTANT_SALARY_SETTLEMENT_COPY.RETRY}
              </Text>
            </Pressable>
          </View>
        ) : isSuccess && rows.length === 0 ? (
          <View
            style={[
              styles.emptyBox,
              { backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg },
            ]}
          >
            <Wallet size={28} color={theme.colors.textSecondary} style={styles.emptyIcon} />
            <Text
              style={[
                styles.emptyText,
                { color: theme.colors.textMain, fontFamily: theme.fontFamily.semibold },
              ]}
            >
              {CONSULTANT_SALARY_SETTLEMENT_COPY.EMPTY_PRIMARY}
            </Text>
            <Text
              style={[
                styles.emptyHint,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fontFamily.regular,
                  fontSize: theme.fontSize.sm,
                },
              ]}
            >
              {CONSULTANT_SALARY_SETTLEMENT_COPY.EMPTY_HINT}
            </Text>
          </View>
        ) : (
          rows.map((row, idx) => (
            <View
              key={String(row.id ?? idx)}
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.lg,
                },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: theme.colors.textMain,
                    fontFamily: theme.fontFamily.semibold,
                    fontSize: theme.fontSize.base,
                  },
                ]}
              >
                {periodLabel(row)}
              </Text>
              <View style={styles.row}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  {CONSULTANT_SALARY_SETTLEMENT_COPY.STATUS}
                </Text>
                <Text style={[styles.value, { color: theme.colors.textMain }]}>
                  {toDisplayString(row.status, '—')}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  {CONSULTANT_SALARY_SETTLEMENT_COPY.NET}
                </Text>
                <Text style={[styles.valueEmph, { color: theme.colors.accent }]}>
                  {formatWon(row.netSalary)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  {CONSULTANT_SALARY_SETTLEMENT_COPY.GROSS}
                </Text>
                <Text style={[styles.value, { color: theme.colors.textMain }]}>
                  {formatWon(row.grossSalary)}
                </Text>
              </View>
            </View>
          ))
        )}
        {isFetching && !isLoading ? (
          <View style={styles.inlineFetch}>
            <ActivityIndicator size="small" color={theme.colors.accent} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  intro: { marginBottom: 16, lineHeight: 22 },
  center: { paddingVertical: 48, alignItems: 'center', justifyContent: 'center' },
  retry: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 12 },
  emptyBox: { padding: 24, alignItems: 'center' },
  emptyIcon: { marginBottom: 12 },
  emptyText: { textAlign: 'center', lineHeight: 24, marginBottom: 8 },
  emptyHint: { textAlign: 'center', lineHeight: 22 },
  card: { padding: 16, marginBottom: 12 },
  cardTitle: { marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: { fontSize: 13, flex: 1 },
  value: { fontSize: 14, flex: 1, textAlign: 'right' },
  valueEmph: { fontSize: 16, flex: 1, textAlign: 'right', fontWeight: '600' },
  inlineFetch: { alignItems: 'center', marginTop: 8 },
});
