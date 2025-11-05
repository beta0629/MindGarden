/**
 * 상담일지 상세 화면
 * 
 * 웹의 frontend/src/components/consultant/ConsultationRecordView.js를 참고
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Clock, FileText, CheckCircle, AlertCircle } from 'lucide-react-native';
import SimpleLayout from '../../components/layout/SimpleLayout';
import UnifiedLoading from '../../components/UnifiedLoading';
import DashboardSection from '../../components/DashboardSection';
import MGButton from '../../components/MGButton';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../api/client';
import { CONSULTATION_RECORD_API } from '../../api/endpoints';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from '../../constants/theme';
import SIZES from '../../constants/sizes';
import { STRINGS } from '../../constants/strings';

const RecordDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useSession();
  const { recordId } = route.params || {};

  const [record, setRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 상담일지 상세 조회
  const loadRecord = async () => {
    if (!recordId || !user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // 상담일지 상세 정보 조회
      const response = await apiGet(`${CONSULTATION_RECORD_API.GET_RECORDS(user.id)}/${recordId}`);
      
      if (response?.success && response?.data) {
        setRecord(response.data);
      } else if (response?.data) {
        // 배열로 반환되는 경우 첫 번째 항목 사용
        setRecord(Array.isArray(response.data) ? response.data[0] : response.data);
      } else {
        throw new Error(STRINGS.ERROR.LOAD_FAILED || '상담일지를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('상담일지 로드 실패:', error);
      setError(STRINGS.ERROR.LOAD_FAILED || '상담일지를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecord();
  }, [recordId, user?.id]);

  // 시간 포맷
  const formatTime = (timeString) => {
    if (!timeString) return STRINGS.CONSULTANT.NO_TIME || '시간 정보 없음';
    
    try {
      if (timeString.includes('T')) {
        return timeString.split('T')[1]?.slice(0, 5) || timeString;
      }
      return timeString;
    } catch (error) {
      return STRINGS.CONSULTANT.NO_TIME || '시간 정보 없음';
    }
  };

  // 날짜 포맷
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <SimpleLayout title={STRINGS.CONSULTANT.CONSULTATION_RECORDS}>
        <UnifiedLoading text={STRINGS.COMMON.LOADING_DATA} size="large" type="fullscreen" />
      </SimpleLayout>
    );
  }

  if (error || !record) {
    return (
      <SimpleLayout title={STRINGS.CONSULTANT.CONSULTATION_RECORDS}>
        <View style={styles.emptyState}>
          <AlertCircle size={SIZES.ICON['2XL']} color={COLORS.error} />
          <Text style={styles.emptyText}>{error || STRINGS.ERROR.NOT_FOUND || '상담일지를 찾을 수 없습니다.'}</Text>
          <MGButton
            variant="secondary"
            size="medium"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <View style={styles.backButtonContent}>
              <ArrowLeft size={SIZES.ICON.MD} color={COLORS.primary} />
              <Text style={styles.backButtonText}>{STRINGS.COMMON.BACK_TO_LIST || '목록으로 돌아가기'}</Text>
            </View>
          </MGButton>
        </View>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title={STRINGS.CONSULTANT.CONSULTATION_RECORDS}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* 기본 정보 */}
        <DashboardSection title={STRINGS.CONSULTANT.BASIC_INFO || '기본 정보'} icon={<FileText size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{STRINGS.CONSULTANT.SESSION_NUMBER || '세션 번호'}</Text>
              <Text style={styles.infoValue}>{record.sessionNumber || STRINGS.CONSULTANT.NO_INFO || '정보 없음'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{STRINGS.CONSULTANT.CONSULTATION_TIME || '상담 시간'}</Text>
              <View style={styles.timeRow}>
                <Clock size={SIZES.ICON.SM} color={COLORS.gray500} />
                <Text style={styles.infoValue}>
                  {record.startTime && record.endTime
                    ? `${formatTime(record.startTime)} - ${formatTime(record.endTime)}`
                    : STRINGS.CONSULTANT.NO_TIME || '시간 정보 없음'}
                </Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{STRINGS.CONSULTANT.CONSULTATION_TYPE || '상담 유형'}</Text>
              <Text style={styles.infoValue}>{record.consultationType || STRINGS.CONSULTANT.INDIVIDUAL_CONSULTATION || '개별 상담'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{STRINGS.COMMON.STATUS || '상태'}</Text>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusBadge,
                  record.isSessionCompleted ? styles.statusBadgeSuccess : styles.statusBadgeWarning
                ]}>
                  {record.isSessionCompleted ? (
                    <CheckCircle size={SIZES.ICON.SM} color={COLORS.success} />
                  ) : (
                    <AlertCircle size={SIZES.ICON.SM} color={COLORS.warning} />
                  )}
                  <Text style={styles.statusText}>
                    {record.isSessionCompleted 
                      ? STRINGS.CONSULTANT.COMPLETED 
                      : STRINGS.CONSULTANT.PENDING_RECORDS}
                  </Text>
                </View>
              </View>
            </View>
            {record.sessionDate && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{STRINGS.CONSULTANT.SESSION_DATE || '상담 날짜'}</Text>
                <Text style={styles.infoValue}>{formatDate(record.sessionDate)}</Text>
              </View>
            )}
          </View>
        </DashboardSection>

        {/* 상담 내용 */}
        <DashboardSection title={STRINGS.CONSULTANT.CONSULTATION_CONTENT || '상담 내용'} icon={<FileText size={SIZES.ICON.MD} color={COLORS.primary} />}>
          <View style={styles.contentBox}>
            {record.notes ? (
              <Text style={styles.contentText}>{record.notes}</Text>
            ) : (
              <View style={styles.emptyContent}>
                <FileText size={SIZES.ICON['2XL']} color={COLORS.gray400} />
                <Text style={styles.emptyContentText}>
                  {STRINGS.CONSULTANT.NO_CONSULTATION_CONTENT || '작성된 상담 내용이 없습니다.'}
                </Text>
              </View>
            )}
          </View>
        </DashboardSection>

        {/* 액션 버튼 */}
        <View style={styles.actionContainer}>
          <MGButton
            variant="secondary"
            size="medium"
            fullWidth
            onPress={() => navigation.goBack()}
          >
            <View style={styles.backButtonContent}>
              <ArrowLeft size={SIZES.ICON.MD} color={COLORS.primary} />
              <Text style={styles.backButtonText}>{STRINGS.COMMON.BACK_TO_LIST || '목록으로 돌아가기'}</Text>
            </View>
          </MGButton>
        </View>
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
  infoGrid: {
    gap: SPACING.md,
  },
  infoItem: {
    gap: SPACING.xs,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.gray600,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  statusBadgeSuccess: {
    backgroundColor: COLORS.successLight,
  },
  statusBadgeWarning: {
    backgroundColor: COLORS.warningLight,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    color: COLORS.dark,
  },
  contentBox: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    minHeight: 100,
  },
  contentText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.dark,
    lineHeight: TYPOGRAPHY.lineHeight.relaxed,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['2xl'],
  },
  emptyContentText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray500,
    marginTop: SPACING.md,
  },
  actionContainer: {
    marginTop: SPACING.lg,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING['2xl'],
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.error,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
});

export default RecordDetail;

