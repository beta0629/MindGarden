/**
 * 상담사 급여 정산 — 관리자 확정·승인·지급 결과 조회 전용 (매출·수입 리포트와 무관)
 *
 * @author MindGarden
 * @since 2026-05-15
 */
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Wallet } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { useConsultantSalarySettlements } from '@/api/hooks/useConsultantSalarySettlements';
import { toDisplayString, toSafeNumber } from '@/utils/safeDisplay';

const COPY = {
  title: '급여 정산',
  intro: '관리자가 확정한 급여 정산만 표시됩니다. 일반 매출·수입 리포트와는 별도입니다.',
  empty: '관리자 급여 산정이 반영되면 이 화면에서 확인할 수 있습니다.',
  loadError: '급여 정산 정보를 불러오지 못했습니다.',
  period: '정산 기간',
  status: '상태',
  net: '실수령액',
  gross: '총 지급액',
} as const;

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
  const { data, isLoading, isError, error, refetch, isFetching } = useConsultantSalarySettlements();

  const rows = Array.isArray(data) ? data : [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: true, title: COPY.title }} />
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
          {COPY.intro}
        </Text>

        {isLoading ? (
          <View style={styles.center} accessibilityRole="progressbar">
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
        ) : isError ? (
          <View style={styles.center}>
            <Text style={{ color: theme.colors.error, fontFamily: theme.fontFamily.medium }}>
              {toDisplayString((error as Error)?.message, COPY.loadError)}
            </Text>
            <Text
              onPress={() => refetch()}
              style={[
                styles.retry,
                { color: theme.colors.accent, fontFamily: theme.fontFamily.medium },
              ]}
            >
              다시 시도
            </Text>
          </View>
        ) : rows.length === 0 ? (
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
                { color: theme.colors.textMain, fontFamily: theme.fontFamily.medium },
              ]}
            >
              {COPY.empty}
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
                  {COPY.status}
                </Text>
                <Text style={[styles.value, { color: theme.colors.textMain }]}>
                  {toDisplayString(row.status, '—')}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  {COPY.net}
                </Text>
                <Text style={[styles.valueEmph, { color: theme.colors.accent }]}>
                  {formatWon(row.netSalary)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
                  {COPY.gross}
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
  retry: { marginTop: 12, fontSize: 16 },
  emptyBox: { padding: 24, alignItems: 'center' },
  emptyIcon: { marginBottom: 12 },
  emptyText: { textAlign: 'center', lineHeight: 22 },
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
