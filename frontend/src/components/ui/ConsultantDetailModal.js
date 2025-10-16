import React from 'react';
import ReactDOM from 'react-dom';
import { X, User, Star, Award, Mail, Phone, Calendar, Clock, MessageCircle, TrendingUp } from 'lucide-react';
import SpecialtyDisplay from './SpecialtyDisplay';
import { getConsultantRatingInfo } from '../../utils/ratingHelper';

/**
 * 상담사 상세 정보 모달
 * - 상담사의 모든 정보를 상세히 표시
 * - 디자인 시스템 v2.0 적용
 * - 반응형 지원
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-01-15
 */
const ConsultantDetailModal = ({ 
    isOpen, 
    onClose, 
    consultant 
}) => {
    /**
     * 이니셜 반환
     */
    const getInitial = () => {
        if (consultant?.name) {
            return consultant.name.charAt(0);
        }
        return '?';
    };

    /**
     * 가용성 상태에 따른 텍스트 반환
     */
    const getAvailabilityText = () => {
        if (consultant?.isOnVacation && 
            (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY')) {
            return '휴무';
        }
        if (!consultant?.available) return '상담 불가';
        if (consultant?.busy) return '상담 중';
        return '상담 가능';
    };

    /**
     * 가용성 상태에 따른 색상 반환
     */
    const getAvailabilityColor = () => {
        if (consultant?.isOnVacation && 
            (consultant.vacationType === 'FULL_DAY' || consultant.vacationType === 'ALL_DAY')) {
            return '#ef4444';
        }
        if (!consultant?.available) return '#6b7280';
        if (consultant?.busy) return '#f59e0b';
        return '#10b981';
    };

    /**
     * 경력 텍스트 반환
     */
    const getExperienceText = () => {
        if (consultant?.yearsOfExperience) {
            return `${consultant.yearsOfExperience}년`;
        }
        if (consultant?.experience) {
            return consultant.experience;
        }
        if (consultant?.careerYears) {
            return `${consultant.careerYears}년`;
        }
        if (consultant?.workExperience) {
            return `${consultant.workExperience}년`;
        }
        return '경력 정보 없음';
    };

    // 평점 정보 계산
    const ratingInfo = getConsultantRatingInfo(consultant);

    if (!isOpen || !consultant) return null;

    const portalTarget = document.body || document.createElement('div');

    return ReactDOM.createPortal(
        <div className="mg-modal-overlay" onClick={onClose}>
            <div className="mg-modal mg-modal-large" onClick={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <div className="mg-modal-header">
                    <div className="mg-modal-title-section">
                        <h2 className="mg-modal-title">
                            <User size={24} />
                            상담사 상세 정보
                        </h2>
                        <p className="mg-modal-description">
                            {consultant.name} 상담사의 상세 정보입니다.
                        </p>
                    </div>
                    <button 
                        className="mg-modal-close"
                        onClick={onClose}
                        aria-label="닫기"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* 본문 */}
                <div className="mg-modal-body">
                    <div className="mg-consultant-detail-container">
                        {/* 상담사 기본 정보 */}
                        <div className="mg-consultant-detail-header">
                            <div className="mg-consultant-detail-avatar">
                                <div className="mg-consultant-detail-avatar-circle">
                                    {getInitial()}
                                </div>
                                <div 
                                    className="mg-consultant-detail-status-badge"
                                    style={{ backgroundColor: getAvailabilityColor() }}
                                >
                                    {getAvailabilityText()}
                                </div>
                            </div>
                            
                            <div className="mg-consultant-detail-info">
                                <h3 className="mg-consultant-detail-name">{consultant.name}</h3>
                                <p className="mg-consultant-detail-role">상담사</p>
                                
                                <div className="mg-consultant-detail-stats">
                                    <div className="mg-consultant-detail-stat">
                                        <Star size={20} />
                                        <div className="mg-consultant-detail-stat-content">
                                            <span className="mg-consultant-detail-stat-value">{ratingInfo.formattedRating}</span>
                                            <span className="mg-consultant-detail-stat-label">평점 ({ratingInfo.formattedReviewCount})</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mg-consultant-detail-stat">
                                        <Award size={20} />
                                        <div className="mg-consultant-detail-stat-content">
                                            <span className="mg-consultant-detail-stat-value">{getExperienceText()}</span>
                                            <span className="mg-consultant-detail-stat-label">경력</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mg-consultant-detail-stat">
                                        <TrendingUp size={20} />
                                        <div className="mg-consultant-detail-stat-content">
                                            <span className="mg-consultant-detail-stat-value">{consultant.currentClients || 0}명</span>
                                            <span className="mg-consultant-detail-stat-label">현재 상담 중</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 연락처 정보 */}
                        <div className="mg-consultant-detail-section">
                            <h4 className="mg-consultant-detail-section-title">
                                <MessageCircle size={20} />
                                연락처 정보
                            </h4>
                            <div className="mg-consultant-detail-contact">
                                <div className="mg-consultant-detail-contact-item">
                                    <Mail size={18} />
                                    <div className="mg-consultant-detail-contact-info">
                                        <span className="mg-consultant-detail-contact-label">이메일</span>
                                        <span className="mg-consultant-detail-contact-value">
                                            {consultant.email || consultant.emailAddress || '이메일 정보 없음'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="mg-consultant-detail-contact-item">
                                    <Phone size={18} />
                                    <div className="mg-consultant-detail-contact-info">
                                        <span className="mg-consultant-detail-contact-label">전화번호</span>
                                        <span className="mg-consultant-detail-contact-value">
                                            {consultant.phone || consultant.phoneNumber || consultant.mobile || '전화번호 정보 없음'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 전문분야 */}
                        <div className="mg-consultant-detail-section">
                            <h4 className="mg-consultant-detail-section-title">
                                <Award size={20} />
                                전문분야
                            </h4>
                            <div className="mg-consultant-detail-specialties">
                                <SpecialtyDisplay 
                                    consultant={consultant} 
                                    variant="tag" 
                                    showTitle={false}
                                    maxItems={10}
                                    debug={false}
                                />
                            </div>
                        </div>

                        {/* 상담 가능 시간 */}
                        {consultant.availableSlots && consultant.availableSlots.length > 0 && (
                            <div className="mg-consultant-detail-section">
                                <h4 className="mg-consultant-detail-section-title">
                                    <Clock size={20} />
                                    상담 가능 시간
                                </h4>
                                <div className="mg-consultant-detail-availability">
                                    <div className="mg-consultant-detail-availability-grid">
                                        {consultant.availableSlots.map((slot, index) => (
                                            <div key={index} className="mg-consultant-detail-availability-item">
                                                <Calendar size={16} />
                                                <span>{slot}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 추가 정보 */}
                        <div className="mg-consultant-detail-section">
                            <h4 className="mg-consultant-detail-section-title">
                                <User size={20} />
                                추가 정보
                            </h4>
                            <div className="mg-consultant-detail-additional">
                                <div className="mg-consultant-detail-additional-item">
                                    <span className="mg-consultant-detail-additional-label">총 상담 횟수</span>
                                    <span className="mg-consultant-detail-additional-value">
                                        {consultant.totalConsultations || consultant.consultationCount || consultant.totalSessions || consultant.sessionCount || 0}회
                                    </span>
                                </div>
                                
                                <div className="mg-consultant-detail-additional-item">
                                    <span className="mg-consultant-detail-additional-label">등록일</span>
                                    <span className="mg-consultant-detail-additional-value">
                                        {consultant.createdAt ? new Date(consultant.createdAt).toLocaleDateString('ko-KR') : 
                                         consultant.registrationDate ? new Date(consultant.registrationDate).toLocaleDateString('ko-KR') :
                                         consultant.joinDate ? new Date(consultant.joinDate).toLocaleDateString('ko-KR') :
                                         '정보 없음'}
                                    </span>
                                </div>
                                
                                {consultant.lastLoginAt && (
                                    <div className="mg-consultant-detail-additional-item">
                                        <span className="mg-consultant-detail-additional-label">마지막 로그인</span>
                                        <span className="mg-consultant-detail-additional-value">
                                            {new Date(consultant.lastLoginAt).toLocaleDateString('ko-KR')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 푸터 */}
                <div className="mg-modal-footer">
                    <button 
                        className="mg-button mg-button-secondary"
                        onClick={onClose}
                    >
                        닫기
                    </button>
                    <button 
                        className="mg-button mg-button-primary"
                        onClick={() => {
                            // 상담사 선택 기능 (부모 컴포넌트에서 처리)
                            onClose();
                        }}
                    >
                        이 상담사 선택
                    </button>
                </div>
            </div>
        </div>,
        portalTarget
    );
};

export default ConsultantDetailModal;
