/**
 * 날짜 줌인 모달 컴포넌트 (Presentational)
 * 
 * 날짜 클릭 시 애니메이션으로 확대되어 해당 날짜의 스케줄을 표시
 * React Native 기본 Animated API 사용
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import { X, Plus, Clock, User, Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '../../../constants/theme';
import SIZES from '../../../constants/sizes';
import { STRINGS } from '../../../constants/strings';
import MGButton from '../../MGButton';

const DateZoomModal = ({
  isVisible,
  date,
  schedules = [],
  onClose,
  onSchedulePress,
  onAddSchedule,
}) => {
  const screenHeight = Dimensions.get('window').height;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(screenHeight)).current; // 화면 높이만큼 아래에서 시작
  const modalOpacity = useRef(new Animated.Value(0)).current; // 모달 투명도 (0에서 시작)
  const modalScale = useRef(new Animated.Value(0.8)).current; // 줌인 효과를 위한 스케일

  useEffect(() => {
    if (isVisible) {
      // 초기값을 즉시 설정 (애니메이션 시작 전 상태)
      overlayOpacity.setValue(0);
      modalTranslateY.setValue(screenHeight);
      modalOpacity.setValue(0);
      modalScale.setValue(0.8);
      
      // 다음 프레임에서 애니메이션 시작 (렌더링 후 애니메이션 보이도록)
      requestAnimationFrame(() => {
        // 모달을 표시할 때 - 줌인 애니메이션
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(modalTranslateY, {
            toValue: 0,
            damping: 18,
            stiffness: 100,
            useNativeDriver: true,
          }),
          Animated.spring(modalScale, {
            toValue: 1,
            damping: 12,
            stiffness: 120,
            useNativeDriver: true,
          }),
          Animated.timing(modalOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // 모달을 숨길 때
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalTranslateY, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(modalScale, {
          toValue: 0.8,
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
  }, [isVisible, overlayOpacity, modalTranslateY, modalOpacity, modalScale, screenHeight]);

  const overlayStyle = {
    opacity: overlayOpacity,
  };

  const modalStyle = {
    transform: [
      { translateY: modalTranslateY },
      { scale: modalScale }, // 줌인 효과
    ],
    opacity: modalOpacity,
    zIndex: 1000,
  };

  // 디버깅: 컴포넌트가 렌더링되는지 확인
  console.log('🔍 DateZoomModal 렌더링:', { 
    isVisible, 
    date, 
    schedulesCount: schedules?.length || 0,
    screenHeight,
  });

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
        return Clock;
    }
  };

  // isVisible이 false이면 모달을 완전히 숨김
  // 하지만 애니메이션 중에는 보이도록 하기 위해 isVisible이 true일 때만 렌더링
  if (!isVisible) return null;

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
          pointerEvents="box-none"
          collapsable={false}
        >
          <View style={styles.modalContent}>
            {/* 헤더 */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>{formatDate(date)}</Text>
                <Text style={styles.scheduleCount}>
                  {schedules.length}개의 일정
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
              >
                <X size={SIZES.ICON.MD} color={COLORS.mediumGray} />
              </TouchableOpacity>
            </View>

            {/* 스케줄 목록 */}
            {(() => {
              console.log('📋 DateZoomModal 렌더링 - schedules:', schedules);
              console.log('📋 DateZoomModal 렌더링 - schedules.length:', schedules?.length || 0);
              console.log('📋 DateZoomModal 렌더링 - Array.isArray:', Array.isArray(schedules));
              
              if (!Array.isArray(schedules)) {
                return (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>스케줄 데이터 형식 오류</Text>
                  </View>
                );
              }
              
              if (schedules.length === 0) {
                return (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>이 날짜에는 일정이 없습니다.</Text>
                  </View>
                );
              }
              
              return (
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.contentContainer}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                  pointerEvents="auto"
                >
                  {schedules.map((schedule, index) => {
                    console.log(`📋 스케줄 ${index} 렌더링:`, schedule);
                    return (
                      <TouchableOpacity
                        key={schedule?.id || `schedule-${index}`}
                        style={styles.scheduleItem}
                        onPress={() => onSchedulePress && onSchedulePress(schedule)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.scheduleItemContent}>
                          {schedule?.startTime && schedule?.endTime && (
                            <View style={styles.scheduleTime}>
                              <Clock size={SIZES.ICON.SM} color={COLORS.primary} />
                              <Text style={styles.scheduleTimeText}>
                                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                              </Text>
                            </View>
                          )}
                          
                          <Text 
                            style={styles.scheduleTitle}
                          >
                            {schedule?.title || `${schedule?.consultantName || '상담사'} - ${schedule?.clientName || '내담자'} 상담`}
                          </Text>
                          
                          {(schedule?.consultantName || schedule?.clientName) && (
                            <View style={styles.scheduleParticipants}>
                              {schedule?.consultantName && (
                                <View style={styles.participant}>
                                  <User size={SIZES.ICON.XS} color={COLORS.mediumGray} />
                                  <Text style={styles.participantText}>
                                    {schedule.consultantName}
                                  </Text>
                                </View>
                              )}
                              {schedule?.clientName && (
                                <View style={styles.participant}>
                                  <User size={SIZES.ICON.XS} color={COLORS.mediumGray} />
                                  <Text style={styles.participantText}>
                                    {schedule.clientName}
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}
                          
                          {schedule?.status && (() => {
                            const StatusIcon = getStatusIcon(schedule.status);
                            const statusColor = getStatusColor(schedule.status);
                            
                            return (
                              <View style={[
                                styles.statusBadge,
                                schedule.status === 'SCHEDULED' && styles.statusBadgeScheduled,
                                schedule.status === 'BOOKED' && styles.statusBadgeBooked,
                                schedule.status === 'COMPLETED' && styles.statusBadgeCompleted,
                                schedule.status === 'CANCELLED' && styles.statusBadgeCancelled,
                                schedule.status === 'PENDING' && styles.statusBadgePending,
                                (!schedule.status || !['SCHEDULED', 'BOOKED', 'COMPLETED', 'CANCELLED', 'PENDING'].includes(schedule.status)) && styles.statusBadgeDefault,
                              ]}>
                                <StatusIcon size={SIZES.ICON.SM} color={statusColor} strokeWidth={2} />
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
                            );
                          })()}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              );
            })()}

            {/* 푸터 */}
            <View style={styles.footer} pointerEvents="auto">
              <MGButton
                variant="primary"
                size="medium"
                fullWidth
                onPress={onAddSchedule}
              >
                <View style={styles.addButtonContent}>
                  <Plus size={SIZES.ICON.SM} color={COLORS.white} />
                  <Text style={styles.addButtonText}>일정 추가</Text>
                </View>
              </MGButton>
            </View>
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
    alignItems: 'stretch',
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
    minHeight: 300,
    ...SHADOWS.lg,
  },
  modalContent: {
    flex: 1,
    flexDirection: 'column',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.dark,
    marginBottom: SPACING.xs,
  },
  scheduleCount: {
    ...TYPOGRAPHY.body2,
    color: COLORS.mediumGray,
  },
  closeButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.md,
  },
  scrollView: {
    flex: 1,
    flexShrink: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    flexGrow: 1,
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
  scheduleItem: {
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    width: '100%',
  },
  scheduleItemContent: {
    gap: SPACING.xs,
    flexShrink: 1,
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  scheduleTimeText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary,
    fontWeight: '600',
  },
  scheduleTitle: {
    ...TYPOGRAPHY.body1,
    color: COLORS.dark,
    fontWeight: '600',
    marginBottom: SPACING.xs,
    flexShrink: 1,
  },
  scheduleParticipants: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
    flexShrink: 1,
  },
  participant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  participantText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.mediumGray,
    flexShrink: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
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
  footer: {
    padding: SPACING.lg,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  addButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.white,
  },
});

export default DateZoomModal;

