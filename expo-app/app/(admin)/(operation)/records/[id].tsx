/**
 * 어드민 — 상담일지 상세(읽기 전용: 제목·일자·내담자)
 *
 * @author MindGarden
 * @since 2026-05-16
 */
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { FileText } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { AppTopBar } from '@/components/templates/AppTopBar';
import { Badge } from '@/components/atoms/Badge';
import { EmptyState } from '@/components/atoms/EmptyState';
import { useAdminConsultationRecordDetail } from '@/api/hooks/useAdminConsultationRecords';
import { useAdminApiQueryReady } from '@/hooks/useAdminApiQueryReady';
import { ADMIN_CONSULTATION_RECORDS_COPY } from '@/constants/adminConsultationRecordsCopy';
import { useAuthStore } from '@/stores/useAuthStore';
import { isAdminRole, isStaffRole } from '@/utils/adminRole';
import { toDisplayString, toSafeNumber } from '@/utils/safeDisplay';

function formatSessionDate(ymd: string): string {
  const trimmed = ymd.trim();
  if (trimmed === '') {
    return '—';
  }
  try {
    const d = parseISO(trimmed.length >= 10 ? trimmed.slice(0, 10) : trimmed);
    if (Number.isNaN(d.getTime())) {
      return trimmed;
    }
    return format(d, 'yyyy.MM.dd (EEE)', { locale: ko });
  } catch {
    return trimmed;
  }
}

function DetailField({ label, value }: { readonly label: string; readonly value: string }) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.spacing.lg }}>
      <Text
        style={{
          color: theme.colors.textTertiary,
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.fontSize.xs,
          marginBottom: theme.spacing.xs,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: theme.colors.textMain,
          fontFamily: theme.fontFamily.regular,
          fontSize: theme.fontSize.base,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function AdminConsultationRecordDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string; consultantId?: string }>();
  const role = useAuthStore((s) => s.role);
  const allowed = isAdminRole(role);
  const staffDenied = isStaffRole(role);

  const recordId = toSafeNumber(params.id, 0);
  const consultantId = toSafeNumber(params.consultantId, 0);
  const validIds = recordId > 0 && consultantId > 0;

  const { ready } = useAdminApiQueryReady();
  const detailQuery = useAdminConsultationRecordDetail(
    validIds ? consultantId : null,
    validIds ? recordId : null,
  );
  const showDetailLoading = validIds && (!ready || detailQuery.isLoading);

  const accessDeniedMessage = useMemo(() => {
    if (staffDenied) {
      return ADMIN_CONSULTATION_RECORDS_COPY.ACCESS_DENIED_STAFF;
    }
    return ADMIN_CONSULTATION_RECORDS_COPY.ACCESS_DENIED_GENERIC;
  }, [staffDenied]);

  const record = detailQuery.data;
  const completed =
    record != null &&
    (record.isSessionCompleted || record.status.trim().toUpperCase() === 'COMPLETED');
  const statusLabel = completed
    ? ADMIN_CONSULTATION_RECORDS_COPY.STATUS_COMPLETED
    : ADMIN_CONSULTATION_RECORDS_COPY.STATUS_PENDING;

  if (!allowed) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
        <AppTopBar title={ADMIN_CONSULTATION_RECORDS_COPY.DETAIL_TITLE} canGoBack />
        <View style={[styles.centered, { paddingHorizontal: theme.spacing.lg }]}>
          <EmptyState
            icon={<FileText size={32} color={theme.colors.textTertiary} />}
            title={ADMIN_CONSULTATION_RECORDS_COPY.ACCESS_DENIED_TITLE}
            description={accessDeniedMessage}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.bgMain }]} edges={['top']}>
      <AppTopBar title={ADMIN_CONSULTATION_RECORDS_COPY.DETAIL_TITLE} canGoBack />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl },
        ]}
      >
        {!validIds ? (
          <EmptyState
            icon={<FileText size={32} color={theme.colors.textTertiary} />}
            title={ADMIN_CONSULTATION_RECORDS_COPY.DETAIL_NOT_FOUND}
          />
        ) : showDetailLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 32 }} />
        ) : detailQuery.isError || !record ? (
          <EmptyState
            icon={<FileText size={32} color={theme.colors.textTertiary} />}
            title={ADMIN_CONSULTATION_RECORDS_COPY.DETAIL_NOT_FOUND}
          />
        ) : (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing.lg,
                marginTop: theme.spacing.lg,
              },
            ]}
          >
            <View style={styles.statusRow}>
              <Badge label={statusLabel} variant={completed ? 'success' : 'warning'} />
            </View>
            <DetailField
              label={ADMIN_CONSULTATION_RECORDS_COPY.LABEL_TITLE}
              value={toDisplayString(record.title, '상담 기록')}
            />
            <DetailField
              label={ADMIN_CONSULTATION_RECORDS_COPY.LABEL_CLIENT}
              value={toDisplayString(record.clientName, '내담자')}
            />
            <DetailField
              label={ADMIN_CONSULTATION_RECORDS_COPY.LABEL_DATE}
              value={formatSessionDate(record.sessionDate)}
            />
            <Text
              style={{
                color: theme.colors.textTertiary,
                fontFamily: theme.fontFamily.regular,
                fontSize: theme.fontSize.xs,
                marginTop: theme.spacing.sm,
              }}
            >
              {ADMIN_CONSULTATION_RECORDS_COPY.READ_ONLY_HINT}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {},
  statusRow: {
    marginBottom: 16,
  },
});
