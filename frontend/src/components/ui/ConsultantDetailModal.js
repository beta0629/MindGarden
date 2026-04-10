import React from 'react';
import { User, Star, Award, Mail, Phone, Calendar, Clock, MessageCircle, TrendingUp } from 'lucide-react';
import UnifiedModal from '../common/modals/UnifiedModal';
import SpecialtyDisplay from './SpecialtyDisplay';
import MGButton from '../common/MGButton';
import { getConsultantRatingInfo } from '../../utils/ratingHelper';
import { 
    getFormattedExperience, 
    getFormattedContact, 
    getFormattedConsultationCount, 
    getFormattedRegistrationDate, 
    getFormattedCurrentClients, 
    getFormattedAvailability 
} from '../../utils/codeHelper';
import Avatar from '../common/Avatar';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';

/**
 * 상담사 상세 정보 모달
/**
 * - 상담사의 모든 정보를 상세히 표시
/**
 * - 디자인 시스템 v2.0 적용
/**
 * - 반응형 지원
/**
 * 
/**
 * @author Core Solution
/**
 * @version 2.0.0
/**
 * @since 2025-01-15
 */
const ConsultantDetailModal = ({ 
    isOpen, 
    onClose, 
    consultant 
}) => {
    // 공통 함수로 데이터 포맷팅
    const availability = getFormattedAvailability(consultant);
    const contact = getFormattedContact(consultant);

    // 평점 정보 계산
    const ratingInfo = consultant ? getConsultantRatingInfo(consultant) : null;

    return (
        <UnifiedModal
            isOpen={Boolean(isOpen && consultant)}
            onClose={onClose}
            title="상담사 상세 정보"
            subtitle={consultant ? `${toDisplayString(consultant.name, '상담사')} 상담사의 상세 정보입니다.` : ''}
            size="large"
            variant="detail"
            backdropClick
            showCloseButton
            actions={(
                <>
                    <MGButton variant="outline" size="medium" onClick={onClose} preventDoubleClick={false}>
                        닫기
                    </MGButton>
                    <MGButton
                        variant="primary"
                        size="medium"
                        onClick={() => {
                            onClose();
                        }}
                        preventDoubleClick={false}
                    >
                        이 상담사 선택
                    </MGButton>
                </>
            )}
        >
                    {consultant && (
                    <div className="mg-consultant-detail-container">
                        {/* 상담사 기본 정보 */}
                        <div className="mg-consultant-detail-header">
                            <div className="mg-consultant-detail-avatar mg-v2-consultant-detail-avatar">
                                <Avatar
                                    profileImageUrl={consultant.profileImageUrl}
                                    displayName={toDisplayString(consultant.name, '상담사')}
                                    className="mg-consultant-detail-avatar-circle"
                                />
                                <div 
                                    className="mg-consultant-detail-status-badge"
                                    style={{ '--availability-color': availability.color }}
                                >
                                    <SafeText>{availability.text}</SafeText>
                                </div>
                            </div>
                            
                            <div className="mg-consultant-detail-info">
                                <SafeText tag="h3" className="mg-consultant-detail-name">{consultant.name}</SafeText>
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
                                            <span className="mg-consultant-detail-stat-value">{getFormattedExperience(consultant)}</span>
                                            <span className="mg-consultant-detail-stat-label">경력</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mg-consultant-detail-stat">
                                        <TrendingUp size={20} />
                                        <div className="mg-consultant-detail-stat-content">
                                            <span className="mg-consultant-detail-stat-value">{getFormattedCurrentClients(consultant)}</span>
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
                                            <SafeText>{contact.email}</SafeText>
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="mg-consultant-detail-contact-item">
                                    <Phone size={18} />
                                    <div className="mg-consultant-detail-contact-info">
                                        <span className="mg-consultant-detail-contact-label">전화번호</span>
                                        <span className="mg-consultant-detail-contact-value">
                                            <SafeText>{contact.phone}</SafeText>
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
                                                <SafeText>{slot}</SafeText>
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
                                        {getFormattedConsultationCount(consultant)}
                                    </span>
                                </div>
                                
                                <div className="mg-consultant-detail-additional-item">
                                    <span className="mg-consultant-detail-additional-label">등록일</span>
                                    <span className="mg-consultant-detail-additional-value">
                                        {getFormattedRegistrationDate(consultant)}
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
                    )}
        </UnifiedModal>
    );
};

export default ConsultantDetailModal;
