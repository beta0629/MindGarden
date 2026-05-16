/**
 * 상담사 급여 정산 — 관리자 확정·승인·지급 결과 조회 전용 (매출·수입 리포트와 무관)
 *
 * @author MindGarden
 * @since 2026-05-15
 */
import { useCallback, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { AlertCircle, Wallet } from 'lucide-react-native';
import { useTheme } from '@/theme';
import {
  useConsultantSalarySettlements,
  type ConsultantSalarySettlementRow,
} from '@/api/hooks/useConsultantSalarySettlements';
import { CONSULTANT_SALARY_SETTLEMENT_COPY } from '@/constants/consultantSalarySettlementCopy';
import { useAuthStore } from '@/stores/useAuthStore';
import { EmptyState } from '@/components/atoms/EmptyState';
import { toDisplayString, toSafeNumber } from '@/utils/safeDisplay';
import {
  buildSalaryCalculationComponentRows,
  getSalaryStatusLabelKorean,
  mapConsultantComponentRowLabel,
} from '@/utils/salaryCalculationDisplay';

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

function toSalaryNumber(value: unknown): number {
  if (value == null || value === '') {
    return 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
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

function resolveMemo(item: ConsultantSalarySettlementRow): string | null {
  const raw =
    item.memo ??
    (item as { note?: string | null }).note ??
    (item as { description?: string | null }).description ??
    (item as { remarks?: string | null }).remarks;
  if (raw == null) {
    return null;
  }
  const s = String(raw).trim();
  return s === '' ? null : s;
}

function resolveSettlementMethodDisplay(item: ConsultantSalarySettlementRow): string {
  const v =
    item.paymentMethod ??
    item.settlementMethod ??
    (item as { payMethod?: string | null }).payMethod ??
    (item as { payoutMethod?: string | null }).payoutMethod;
  return toDisplayString(v, '—');
}

type Theme = ReturnType<typeof useTheme>;

function SalarySettlementCard({
  row,
  theme,
}: {
  row: ConsultantSalarySettlementRow;
  theme: Theme;
}) {
  const pretaxRows = buildSalaryCalculationComponentRows(
    row as Record<string, unknown>,
    toSalaryNumber,
  );
  const bonus = toSalaryNumber(row.bonusEarnings);
  const taxAmt = toSalaryNumber(row.taxAmount ?? row.deductions);
  const grossPretax =
    row.grossSalary != null && row.grossSalary !== ''
      ? toSalaryNumber(row.grossSalary)
      : toSalaryNumber(row.totalSalary);
  const netAfter =
    row.netSalary != null && row.netSalary !== ''
      ? toSalaryNumber(row.netSalary)
      : grossPretax - taxAmt;
  const memo = resolveMemo(row);
  const statusText = getSalaryStatusLabelKorean(
    row.status,
    CONSULTANT_SALARY_SETTLEMENT_COPY.FALLBACK_STATUS,
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
        },
      ]}
    >
      <View style={styles.cardHeader}>
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
        <View
          style={[styles.statusPill, { backgroundColor: theme.colors.textTertiary }]}
          accessibilityRole="text"
          accessibilityLabel={`${CONSULTANT_SALARY_SETTLEMENT_COPY.STATUS}: ${statusText}`}
        >
          <Text style={[styles.statusPillText, { color: theme.colors.surface }]}>{statusText}</Text>
        </View>
      </View>

      {pretaxRows.map((r, i) => (
        <View key={`${r.label}-${i}`} style={styles.detailRow}>
          <Text
            style={[
              styles.detailLabel,
              { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
            ]}
          >
            {mapConsultantComponentRowLabel(
              r.label,
              CONSULTANT_SALARY_SETTLEMENT_COPY.LABEL_CONSULTATION_PSYCH,
            )}
          </Text>
          <Text
            style={[
              styles.detailValue,
              { color: theme.colors.textMain, fontFamily: theme.fontFamily.medium },
            ]}
          >
            {formatWon(r.amount)}
          </Text>
        </View>
      ))}

      {bonus > 0 ? (
        <View style={styles.detailRow}>
          <Text
            style={[
              styles.detailLabel,
              { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
            ]}
          >
            {CONSULTANT_SALARY_SETTLEMENT_COPY.LABEL_MEAL_TRANSPORT}
          </Text>
          <Text
            style={[
              styles.detailValue,
              { color: theme.colors.textMain, fontFamily: theme.fontFamily.medium },
            ]}
          >
            +{formatWon(row.bonusEarnings)}
          </Text>
        </View>
      ) : null}

      <View style={styles.detailRow}>
        <Text
          style={[
            styles.detailLabel,
            { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
          ]}
        >
          {CONSULTANT_SALARY_SETTLEMENT_COPY.LABEL_GROSS_PRETAX}
        </Text>
        <Text
          style={[
            styles.detailValue,
            { color: theme.colors.textMain, fontFamily: theme.fontFamily.medium },
          ]}
        >
          {formatWon(grossPretax)}
        </Text>
      </View>

      {taxAmt > 0 ? (
        <View style={styles.detailRow}>
          <Text
            style={[
              styles.detailLabel,
              { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.semibold },
            ]}
          >
            {CONSULTANT_SALARY_SETTLEMENT_COPY.LABEL_TAX_DEDUCTION}
          </Text>
          <Text
            style={[
              styles.detailValue,
              { color: theme.colors.textMain, fontFamily: theme.fontFamily.semibold },
            ]}
          >
            -{formatWon(taxAmt)}
          </Text>
        </View>
      ) : null}

      <View style={styles.detailRow}>
        <Text
          style={[
            styles.detailLabel,
            { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.semibold },
          ]}
        >
          {CONSULTANT_SALARY_SETTLEMENT_COPY.LABEL_NET_AFTER_TAX}
        </Text>
        <Text
          style={[
            styles.detailValueEmph,
            { color: theme.colors.accent, fontFamily: theme.fontFamily.semibold },
          ]}
        >
          {formatWon(netAfter)}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text
          style={[
            styles.detailLabel,
            { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
          ]}
        >
          {CONSULTANT_SALARY_SETTLEMENT_COPY.LABEL_SETTLEMENT_METHOD}
        </Text>
        <Text
          style={[
            styles.detailValue,
            { color: theme.colors.textMain, fontFamily: theme.fontFamily.medium },
          ]}
        >
          {resolveSettlementMethodDisplay(row)}
        </Text>
      </View>

      {memo ? (
        <View style={styles.memoBlock}>
          <Text
            style={[
              styles.detailLabel,
              { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
            ]}
          >
            {CONSULTANT_SALARY_SETTLEMENT_COPY.LABEL_MEMO}
          </Text>
          <Text
            style={[
              styles.memoText,
              { color: theme.colors.textMain, fontFamily: theme.fontFamily.regular },
            ]}
          >
            {memo}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function ConsultantSalarySettlementScreen() {
  const theme = useTheme();
  const user = useAuthStore((s) => s.user);
  const hasUser = Boolean(user?.id);
  const { data, isLoading, isError, error, refetch, isFetching, isSuccess } =
    useConsultantSalarySettlements({ enabled: hasUser });

  const didFocusOnceRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasUser) {
        return;
      }
      if (!didFocusOnceRef.current) {
        didFocusOnceRef.current = true;
        return;
      }
      void refetch();
    }, [hasUser, refetch]),
  );

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
            <SalarySettlementCard key={String(row.id ?? idx)} row={row} theme={theme} />
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  cardTitle: { flex: 1, minWidth: 0 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 0,
  },
  statusPillText: { fontSize: 12, fontWeight: '600' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  detailLabel: { fontSize: 13, flex: 1, minWidth: 0 },
  detailValue: { fontSize: 14, textAlign: 'right', fontVariant: ['tabular-nums'] },
  detailValueEmph: { fontSize: 16, textAlign: 'right', fontVariant: ['tabular-nums'] },
  memoBlock: { marginTop: 8 },
  memoText: { fontSize: 13, marginTop: 4, lineHeight: 20 },
  inlineFetch: { alignItems: 'center', marginTop: 8 },
});
