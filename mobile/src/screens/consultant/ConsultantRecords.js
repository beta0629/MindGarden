/**
 * 상담사 상담일지 화면
 * 
 * 웹의 frontend/src/components/consultant/ConsultantRecords.js를 참고
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import StatCard from '../../components/StatCard';
import DashboardSection from '../../components/DashboardSection';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../api/client';
import { CONSULTATION_RECORD_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';
import { CONSULTANT_SCREENS } from '../../constants/navigation';
import { useNavigation } from '@react-navigation/native';

const ConsultantRecords = () => {
  const { user } = useSession();
  const navigation = useNavigation();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // 상담일지 데이터 로드
  const loadRecords = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const response = await apiGet(CONSULTATION_RECORD_API.GET_RECORDS(user.id));

      if (response?.success && response?.data) {
        setRecords(response.data);
        setTotalCount(response.data.length);
        setCompletedCount(response.data.filter((r) => r.isSessionCompleted).length);
        setPendingCount(response.data.filter((r) => !r.isSessionCompleted).length);
      }
    } catch (error) {
      console.error('상담일지 로드 실패:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRecords();
  }, [loadRecords]);

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 상태 텍스트 반환
  const getStatusText = (record) => {
    if (record.isSessionCompleted) {
      return STRINGS.CONSULTANT.COMPLETED;
    }
    return STRINGS.CONSULTANT.PENDING_RECORDS;
  };

  // 상태 색상 반환
  const getStatusColor = (record) => {
    if (record.isSessionCompleted) {
      return COLORS.success;
    }
    return COLORS.warning;
  };

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.CONSULTANT.CONSULTATION_RECORDS}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.CONSULTANT.CONSULTATION_RECORDS}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 통계 */}
        <View style={styles.statsContainer}>
          <StatCard
            icon={<FileText size={SIZES.ICON.MD} color={COLORS.primary} />}
            value={totalCount}
            label={STRINGS.CONSULTANT.CONSULTATION_RECORDS}
            style={styles.statCard}
          />
          <StatCard
            icon={<CheckCircle size={SIZES.ICON.MD} color={COLORS.success} />}
            value={completedCount}
            label={STRINGS.CONSULTANT.COMPLETED}
            style={styles.statCard}
          />
          <StatCard
            icon={<AlertCircle size={SIZES.ICON.MD} color={COLORS.warning} />}
            value={pendingCount}
            label={STRINGS.CONSULTANT.PENDING_RECORDS}
            style={styles.statCard}
          />
        </View>

        {/* 상담일지 목록 */}
        <DashboardSection title={STRINGS.CONSULTANT.CONSULTATION_RECORDS} icon={<FileText size={SIZES.ICON.MD} color={COLORS.primary} />}>
          {records.length > 0 ? (
            <View style={styles.recordList}>
              {records.map((record, index) => (
                <TouchableOpacity
                  key={record.id || index}
                  style={[
                    styles.recordItem,
                    !record.isSessionCompleted && styles.recordItemPending,
                  ]}
                  onPress={() => {
                    navigation.navigate(CONSULTANT_SCREENS.RECORD_DETAIL, { recordId: record.id });
                  }}
                >
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordTitle} numberOfLines={1}>
                      {record.title || STRINGS.CONSULTANT.CONSULTATION_RECORDS}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record) }]}>
                      <Text style={styles.statusText}>{getStatusText(record)}</Text>
                    </View>
                  </View>
                  {record.clientName && (
                    <Text style={styles.recordClient} numberOfLines={1}>
                      {STRINGS.SCHEDULE.CLIENT}: {record.clientName}
                    </Text>
                  )}
                  <View style={styles.recordFooter}>
                    <View style={styles.recordTimeRow}>
                      <Clock size={SIZES.ICON.SM} color={COLORS.gray500} />
                      <Text style={styles.recordDate}>
                        {formatDate(record.consultationDate || record.sessionDate)}
                      </Text>
                    </View>
                    {!record.isSessionCompleted && (
                      <View style={styles.pendingDot} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <FileText size={SIZES.ICON['2XL']} color={COLORS.gray400} />
              <Text style={styles.emptyText}>{STRINGS.COMMON.NO_DATA || '상담일지가 없습니다.'}</Text>
            </View>
          )}
        </DashboardSection>
      </ScrollView>
    </SimpleLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  statsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '100%',
    marginBottom: 0,
  },
  recordList: {
    gap: SPACING.sm,
  },
  recordItem: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  recordItemPending: {
    borderLeftWidth: SIZES.BORDER_WIDTH.THICK,
    borderLeftColor: COLORS.warning,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  recordTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.dark,
    flex: 1,
    marginRight: SPACING.xs,
  },
  statusBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  recordClient: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  recordDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
  },
  pendingDot: {
    width: SIZES.ICON.XS,
    height: SIZES.ICON.XS,
    borderRadius: SIZES.ICON.XS / 2,
    backgroundColor: COLORS.warning,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
});

export default ConsultantRecords;

