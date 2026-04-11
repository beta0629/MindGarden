import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Heart, 
  Calendar, 
  Clock, 
  User,
  CheckCircle,
  Wrench
} from 'lucide-react';
import { RoleUtils } from '../../../constants/roles';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import MGButton from '../../common/MGButton';
import './RatableConsultationsWidget.css';

const RatableConsultationsWidget = ({ widget, user }) => {
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // 데이터 소스 설정 (내담자 전용)
  const getDataSourceConfig = () => {
    // RATING_API import 필요
    const RATING_API = {
      CLIENT_RATABLE: (clientId) => `/api/v1/ratings/client/${clientId}/ratable-schedules`
    };
    
    return {
      type: 'api',
      cache: true,
      refreshInterval: 600000, // 10분마다 새로고침 (평가 상태 변경)
      url: RATING_API.CLIENT_RATABLE(user.id),
      params: {
        includeConsultantInfo: true
      }
    };
  };

  // 위젯 설정에 데이터 소스 동적 설정
  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig()
    }
  };

  // 표준화된 위젯 훅 사용 (평가 가능한 상담 데이터)
  const {
    data: ratableSchedules,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: RoleUtils.isClient(user),
    cache: true,
    retryCount: 3
  });

  // 내담자 전용 위젯 (다른 역할은 표시하지 않음)
  if (!RoleUtils.isClient(user)) {
    return null;
  }

  // 평가하기 버튼 핸들러
  const handleRateConsultant = (schedule) => {
    console.log('💖 평가하기 버튼 클릭:', schedule);
    setSelectedSchedule(schedule);
    setShowRatingModal(true);
  };

  // 평가 완료 핸들러
  const handleRatingComplete = () => {
    refresh(); // 위젯 데이터 새로고침
    setShowRatingModal(false);
    setSelectedSchedule(null);
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR');
    } catch {
      return dateString;
    }
  };

  // 시간 포맷팅
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString;
  };

  // 위젯 헤더 설정
  const headerConfig = {
    title: (
      <div className="ratable-consultations-header-title">
        <Heart size={24} />
        상담사님께 감사 인사를
        {hasData && Array.isArray(ratableSchedules) && ratableSchedules.length > 0 && (
          <span className="ratable-consultations-badge">
            {ratableSchedules.length}개
          </span>
        )}
      </div>
    ),
    subtitle: "완료된 상담에 대해 하트 점수로 평가해주세요"
  };

  // 위젯 콘텐츠
  const renderContent = () => {
    // 에러 상태 (테스트 데이터 표시)
    if (error) {
      return (
        <div className="ratable-consultations-empty">
          <div className="ratable-consultations-empty-icon warning">
            <Wrench size={48} />
          </div>
          <p className="ratable-consultations-empty-text">평가 시스템 준비 중입니다</p>
          <p className="ratable-consultations-empty-hint">
            데이터베이스 테이블 생성 중... 잠시 후 다시 시도해주세요
          </p>
        </div>
      );
    }

    // 빈 상태
    if (isEmpty || !Array.isArray(ratableSchedules) || ratableSchedules.length === 0) {
      return (
        <div className="ratable-consultations-empty">
          <div className="ratable-consultations-empty-icon">
            <Heart size={48} />
          </div>
          <p className="ratable-consultations-empty-text">평가 가능한 상담이 없습니다</p>
          <p className="ratable-consultations-empty-hint">
            상담을 완료하시면 평가할 수 있어요
          </p>
        </div>
      );
    }

    // 평가 가능한 상담 목록
    return (
      <div className="ratable-consultations-list">
        {ratableSchedules.map(schedule => (
          <div key={schedule.scheduleId} className="ratable-consultation-item">
            <div className="ratable-consultation-icon">
              <User size={20} />
            </div>
            <div className="ratable-consultation-content">
              <div className="ratable-consultation-header">
                <h4 className="ratable-consultation-title">
                  {schedule.consultantName}님과의 상담
                </h4>
                <span className="ratable-consultation-status-badge">
                  <CheckCircle size={12} />
                  상담 완료
                </span>
              </div>
              <div className="ratable-consultation-details">
                <span className="ratable-consultation-date">
                  <Calendar size={14} />
                  {formatDate(schedule.consultationDate)}
                </span>
                <span className="ratable-consultation-time">
                  <Clock size={14} />
                  {formatTime(schedule.consultationTime)}
                </span>
              </div>
            </div>
            <MGButton
              className="ratable-consultation-rate-btn"
              variant="primary"
              type="button"
              onClick={() => handleRateConsultant(schedule)}
            >
              <Heart size={16} />
              평가하기
            </MGButton>
          </div>
        ))}
      </div>
    );
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={null}
      hasData={hasData}
      onRefresh={refresh}
      headerConfig={headerConfig}
      className="ratable-consultations-widget"
    >
      {renderContent()}
    </BaseWidget>
  );
};

RatableConsultationsWidget.propTypes = {
  widget: PropTypes.shape({
    config: PropTypes.object
  }).isRequired,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired
};

export default RatableConsultationsWidget;
