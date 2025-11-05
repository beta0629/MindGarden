/**
 * 스케줄 상세 모달 컴포넌트 (Presentational)
 * 
 * 스케줄 상세 정보 표시 및 상태 변경
 * React Native 기본 Animated API 사용
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import { X, Clock, User, Calendar, CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import SIZES from '../../../constants/sizes';
import { STRINGS } from '../../../constants/strings';
import MGButton from '../../MGButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ScheduleDetailModal = ({
  isVisible,
  schedule,
  onClose,
  onStatusChange,
  isUpdating = false,
}) => {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible && schedule) {
      // 초기값 설정
      overlayOpacity.setValue(0);
      modalTranslateY.setValue(SCREEN_HEIGHT);
      modalOpacity.setValue(0);
      
      // 애니메이션 시작
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(modalTranslateY, {
          toValue: 0,
          damping: 20,
          stiffness: 90,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalTranslateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, schedule, overlayOpacity, modalTranslateY, modalOpacity]);

  const overlayStyle = {
    opacity: overlayOpacity,
  };

  const modalStyle = {
    transform: [
      { translateY: modalTranslateY },
    ],
    opacity: modalOpacity,
  };

  // 디버깅: 스케줄 데이터 확인
  console.log('🔍 ScheduleDetailModal 렌더링:', { 
    isVisible, 
    schedule,
    scheduleId: schedule?.id,
    scheduleDate: schedule?.date,
    scheduleTitle: schedule?.title,
    consultantName: schedule?.consultantName,
    clientName: schedule?.clientName,
  });

  if (!isVisible) return null;
  
  if (!schedule) {
    console.warn('⚠️ ScheduleDetailModal: schedule prop이 없습니다.');
    return null;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    return `${date.getFullYear()}년 ${month}월 ${day}일 (${weekday})`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED':
      case 'BOOKED':
        return COLORS.primary;
      case 'COMPLETED':
        return COLORS.success;
      case 'CANCELLED':
        return COLORS.error;
      case 'PENDING':
        return COLORS.warning;
      default:
        return COLORS.gray400;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'SCHEDULED':
      case 'BOOKED':
        return STRINGS.SCHEDULE.STATUS.SCHEDULED || '예약됨';
      case 'COMPLETED':
        return STRINGS.SCHEDULE.STATUS.COMPLETED || '완료';
      case 'CANCELLED':
        return STRINGS.SCHEDULE.STATUS.CANCELLED || '취소';
      case 'PENDING':
        return STRINGS.SESSION.PENDING || '대기';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SCHEDULED':
      case 'BOOKED':
        return Calendar;
      case 'COMPLETED':
        return CheckCircle;
      case 'CANCELLED':
        return XCircle;
      case 'PENDING':
        return AlertTriangle;
      default:
        return Calendar;
    }
  };

  const canChangeStatus = schedule.status === 'SCHEDULED' || schedule.status === 'PENDING';
  const StatusIcon = getStatusIcon(schedule.status);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[styles.overlay, overlayStyle]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[styles.modal, modalStyle]}
          onStartShouldSetResponder={() => true}
          collapsable={false}
        >
          <View style={styles.modalInner}>
            {/* 헤더 */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>스케줄 상세</Text>
                <View style={[
                  styles.statusBadge,
                  schedule.status === 'SCHEDULED' && styles.statusBadgeScheduled,
                  schedule.status === 'BOOKED' && styles.statusBadgeBooked,
                  schedule.status === 'COMPLETED' && styles.statusBadgeCompleted,
                  schedule.status === 'CANCELLED' && styles.statusBadgeCancelled,
                  schedule.status === 'PENDING' && styles.statusBadgePending,
                  (!schedule.status || !['SCHEDULED', 'BOOKED', 'COMPLETED', 'CANCELLED', 'PENDING'].includes(schedule.status)) && styles.statusBadgeDefault,
                ]}>
                  <StatusIcon 
                    size={SIZES.ICON.SM} 
                    color={
                      (schedule.status === 'SCHEDULED' || schedule.status === 'BOOKED') ? COLORS.primary :
                      schedule.status === 'COMPLETED' ? COLORS.success :
                      schedule.status === 'CANCELLED' ? COLORS.error :
                      schedule.status === 'PENDING' ? COLORS.warning :
                      COLORS.gray400
                    }
                    strokeWidth={2}
                  />
                  <Text style={[
                    styles.statusText,
                    schedule.status === 'SCHEDULED' && styles.statusTextScheduled,
                    schedule.status === 'BOOKED' && styles.statusTextBooked,
                    schedule.status === 'COMPLETED' && styles.statusTextCompleted,
                    schedule.status === 'CANCELLED' && styles.statusTextCancelled,
                    schedule.status === 'PENDING' && styles.statusTextPending,
                    (!schedule.status || !['SCHEDULED', 'BOOKED', 'COMPLETED', 'CANCELLED', 'PENDING'].includes(schedule.status)) && styles.statusTextDefault,
                  ]}>
                    {getStatusText(schedule.status)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
              >
                <X size={SIZES.ICON.MD} color={COLORS.mediumGray} />
              </TouchableOpacity>
            </View>

            {/* 내용 */}
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
            >
              {/* 제목 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>제목</Text>
                <Text style={styles.sectionValue}>
                  {schedule?.title || 
                   (schedule?.consultantName && schedule?.clientName 
                    ? `${schedule.consultantName} - ${schedule.clientName} 상담`
                    : schedule?.consultantName || schedule?.clientName
                    ? `${schedule.consultantName || ''}${schedule.clientName ? ' - ' + schedule.clientName : ''} 상담`
                    : '제목 없음')}
                </Text>
              </View>

              {/* 날짜/시간 - 항상 표시 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>날짜 및 시간</Text>
                <View style={styles.timeRow}>
                  <View style={styles.timeItem}>
                    <Calendar size={SIZES.ICON.SM} color={COLORS.primary} />
                    <Text style={styles.timeLabel}>날짜</Text>
                    <Text style={styles.timeValue}>
                      {schedule?.date ? formatDate(schedule.date) : '날짜 정보 없음'}
                    </Text>
                  </View>
                  {(schedule?.startTime || schedule?.endTime) && (
                    <View style={styles.timeItem}>
                      <Clock size={SIZES.ICON.SM} color={COLORS.primary} />
                      <Text style={styles.timeLabel}>시간</Text>
                      <Text style={styles.timeValue}>
                        {schedule?.startTime ? formatTime(schedule.startTime) : '--'} - {schedule?.endTime ? formatTime(schedule.endTime) : '--'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 참여자 - 항상 표시 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>참여자</Text>
                <View style={styles.participantsRow}>
                  {(schedule?.consultantName || schedule?.consultantId) ? (
                    <View style={styles.participantItem}>
                      <User size={SIZES.ICON.SM} color={COLORS.success} />
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantLabel}>상담사</Text>
                        <Text style={styles.participantValue}>
                          {schedule.consultantName || `ID: ${schedule.consultantId}`}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.participantItem}>
                      <User size={SIZES.ICON.SM} color={COLORS.gray400} />
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantLabel}>상담사</Text>
                        <Text style={styles.participantValue}>정보 없음</Text>
                      </View>
                    </View>
                  )}
                  {(schedule?.clientName || schedule?.clientId) ? (
                    <View style={styles.participantItem}>
                      <User size={SIZES.ICON.SM} color={COLORS.info} />
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantLabel}>내담자</Text>
                        <Text style={styles.participantValue}>
                          {schedule.clientName || `ID: ${schedule.clientId}`}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.participantItem}>
                      <User size={SIZES.ICON.SM} color={COLORS.gray400} />
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantLabel}>내담자</Text>
                        <Text style={styles.participantValue}>정보 없음</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* 상담 유형 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>상담 유형</Text>
                <Text style={styles.sectionValue}>
                  {schedule?.consultationType 
                    ? (schedule.consultationType === 'INDIVIDUAL' ? '개인 상담' : 
                       schedule.consultationType === 'GROUP' ? '그룹 상담' :
                       schedule.consultationType)
                    : '정보 없음'}
                </Text>
              </View>

              {/* 설명 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>설명</Text>
                <Text style={styles.sectionValue}>
                  {schedule?.description || '설명 없음'}
                </Text>
              </View>

              {/* 디버깅 정보 (개발용) */}
              {__DEV__ && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>디버깅 정보</Text>
                  <Text style={[styles.sectionValue, styles.debugText]}>
                    {JSON.stringify(schedule, null, 2)}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* 푸터 - 상태 변경 버튼 */}
            {canChangeStatus && onStatusChange && (
              <View style={styles.footer}>
                <MGButton
                  variant="success"
                  size="medium"
                  onPress={() => onStatusChange(schedule.id, 'COMPLETED')}
                  loading={isUpdating}
                  style={styles.footerButton}
                >
                  <View style={styles.buttonContent}>
                    <CheckCircle size={SIZES.ICON.SM} color={COLORS.white} strokeWidth={2} />
                    <Text style={styles.buttonText}>완료 처리</Text>
                  </View>
                </MGButton>
                <MGButton
                  variant="error"
                  size="medium"
                  onPress={() => onStatusChange(schedule.id, 'CANCELLED')}
                  loading={isUpdating}
                  style={styles.footerButton}
                >
                  <View style={styles.buttonContent}>
                    <XCircle size={SIZES.ICON.SM} color={COLORS.white} strokeWidth={2} />
                    <Text style={styles.buttonText}>취소</Text>
                  </View>
                </MGButton>
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...SHADOWS.lg,
  },
  modalInner: {
    flex: 1,
    flexDirection: 'column',
    width: '100%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  headerContent: {
    flex: 1,
    gap: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.dark,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xs,
  },
  // 상태별 배지 배경색
  statusBadgeScheduled: {
    backgroundColor: COLORS.primaryLight,
  },
  statusBadgeBooked: {
    backgroundColor: COLORS.primaryLight,
  },
  statusBadgeCompleted: {
    backgroundColor: COLORS.successLight,
  },
  statusBadgeCancelled: {
    backgroundColor: COLORS.errorLight,
  },
  statusBadgePending: {
    backgroundColor: COLORS.warningLight,
  },
  statusBadgeDefault: {
    backgroundColor: COLORS.gray100,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.white,
  },
  // 상태별 텍스트 색상 (모두 흰색으로 통일)
  statusTextScheduled: {
    color: COLORS.white,
  },
  statusTextBooked: {
    color: COLORS.white,
  },
  statusTextCompleted: {
    color: COLORS.white,
  },
  statusTextCancelled: {
    color: COLORS.white,
  },
  statusTextPending: {
    color: COLORS.white,
  },
  statusTextDefault: {
    color: COLORS.white,
  },
  // 디버그 텍스트 스타일
  debugText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  closeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.md,
  },
  content: {
    flex: 1,
    minHeight: 400,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    flexGrow: 1,
    gap: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.mediumGray,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  sectionValue: {
    ...TYPOGRAPHY.body1,
    color: COLORS.dark,
  },
  timeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  timeItem: {
    flex: 1,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  timeLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.mediumGray,
  },
  timeValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.dark,
    fontWeight: '600',
  },
  participantsRow: {
    gap: SPACING.md,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  participantInfo: {
    flex: 1,
  },
  participantLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.mediumGray,
    marginBottom: SPACING.xs / 2,
  },
  participantValue: {
    ...TYPOGRAPHY.body2,
    color: COLORS.dark,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
  },
  footerButton: {
    flex: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
});

export default ScheduleDetailModal;

