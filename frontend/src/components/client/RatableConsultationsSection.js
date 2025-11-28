import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Calendar, 
  Clock, 
  User,
  CheckCircle,
  Wrench
} from 'lucide-react';
import { API_BASE_URL } from '../../constants/api';
import { useSession } from '../../contexts/SessionContext';
// import ConsultantRatingModal from './ConsultantRatingModal';
import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import '../../styles/unified-design-tokens.css';
import './RatableConsultationsSection.css';

/**
 * 평가 가능한 상담 목록 섹션
 * - 완료된 상담 중 아직 평가하지 않은 것들 표시
 * - 하트 평가 모달 연동
 * - 디자인 시스템 적용 버전
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-01-21
 */
const RatableConsultationsSection = () => {
  const { user } = useSession();
  const [ratableSchedules, setRatableSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showTestData, setShowTestData] = useState(false);

  useEffect(() => {
    console.log('💖 RatableConsultationsSection 마운트됨, 사용자:', user);
    if (user?.id) {
      console.log('💖 평가 가능한 상담 로드 시작, 사용자 ID:', user.id);
      loadRatableSchedules();
    } else {
      console.log('💖 사용자 정보 없음, 평가 섹션 대기 중');
    }
  }, [user]);

  const loadRatableSchedules = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('💖 API 호출 시작:', `${API_BASE_URL}/api/ratings/client/${user.id}/ratable-schedules`);
      
      const response = await fetch(`${API_BASE_URL}/api/ratings/client/${user.id}/ratable-schedules`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      console.log('💖 API 응답 상태:', response.status);
      const result = await response.json();
      console.log('💖 API 응답 데이터:', result);

      if (result.success) {
        console.log('💖 평가 가능한 상담 개수:', result.data?.length || 0);
        setRatableSchedules(result.data || []);
      } else {
        console.error('💖 평가 가능한 상담 조회 실패:', result.message);
        console.log('💖 테스트 데이터 표시');
        setShowTestData(true);
      }

    } catch (error) {
      console.error('💖 평가 가능한 상담 조회 오류:', error);
      console.log('💖 테스트 데이터 표시');
      setShowTestData(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRateConsultant = (schedule) => {
    console.log('💖 평가하기 버튼 클릭:', schedule);
    setSelectedSchedule(schedule);
    setShowRatingModal(true);
    console.log('💖 모달 열림:', showRatingModal);
  };

  const handleRatingComplete = () => {
    loadRatableSchedules();
    setShowRatingModal(false);
    setSelectedSchedule(null);
  };

  if (loading) {
    return (
      <div className="ratable-consultations-section">
        <div className="mg-loading">로딩중...</div>
      </div>
    );
  }

  return (
    <>
      <div className="ratable-consultations-section">
        {/* 섹션 헤더 */}
        <div className="ratable-consultations-header">
          <div className="ratable-consultations-header-left">
            <h2 className="ratable-consultations-title">
              <Heart size={24} />
              상담사님께 감사 인사를
            </h2>
            {ratableSchedules.length > 0 && (
              <span className="mg-badge mg-badge-primary ratable-consultations-badge">
                {ratableSchedules.length}개
              </span>
            )}
          </div>
          <p className="ratable-consultations-subtitle">
            완료된 상담에 대해 하트 점수로 평가해주세요
          </p>
        </div>

        {/* 평가 가능한 상담 목록 */}
        <div className="ratable-consultations-list">
          {showTestData ? (
            <div className="ratable-consultations-empty">
              <div className="ratable-consultations-empty__icon ratable-consultations-empty__icon--warning">
                <Wrench size={48} />
              </div>
              <p className="ratable-consultations-empty__text">평가 시스템 준비 중입니다</p>
              <p className="ratable-consultations-empty__hint">
                데이터베이스 테이블 생성 중... 잠시 후 다시 시도해주세요
              </p>
            </div>
          ) : ratableSchedules.length === 0 ? (
            <div className="ratable-consultations-empty">
              <div className="ratable-consultations-empty__icon">
                <Heart size={48} />
              </div>
              <p className="ratable-consultations-empty__text">평가 가능한 상담이 없습니다</p>
              <p className="ratable-consultations-empty__hint">
                상담을 완료하시면 평가할 수 있어요
              </p>
            </div>
          ) : (
            ratableSchedules.map(schedule => (
              <div key={schedule.scheduleId} className="ratable-consultation-item">
                <div className="ratable-consultation-item__icon">
                  <User size={20} />
                </div>
                <div className="ratable-consultation-item__content">
                  <div className="ratable-consultation-item__header">
                    <h4 className="ratable-consultation-item__title">
                      {schedule.consultantName}님과의 상담
                    </h4>
                    <span className="mg-badge mg-badge-success mg-badge-sm">
                      <CheckCircle size={12} />
                      상담 완료
                    </span>
                  </div>
                  <div className="ratable-consultation-item__details">
                    <span className="ratable-consultation-item__date">
                      <Calendar size={14} />
                      {schedule.consultationDate}
                    </span>
                    <span className="ratable-consultation-item__time">
                      <Clock size={14} />
                      {schedule.consultationTime}
                    </span>
                  </div>
                </div>
                <button
                  className="mg-v2-button mg-v2-button-primary ratable-consultation-item__button"
                  onClick={() => handleRateConsultant(schedule)}
                >
                  <Heart size={16} />
                  평가하기
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 평가 모달 */}
      <ConsultantRatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setSelectedSchedule(null);
        }}
        schedule={selectedSchedule}
        onRatingComplete={handleRatingComplete}
      />
    </>
  );
};

export default RatableConsultationsSection;
