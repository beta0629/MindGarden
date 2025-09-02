import React from 'react';
import './ConsultantCard.css';

/**
 * 상담사 프로필 카드 컴포넌트
 * - 프로필 사진, 이름, 전문분야 표시
 * - 드래그 앤 드롭 기능 지원
 * - 가용성 상태 표시
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const ConsultantCard = ({ 
    consultant, 
    onClick, 
    selected = false, 
    draggable = false,
    className = '' 
}) => {
    /**
     * 프로필 이미지 URL 생성
     */
    const getProfileImageUrl = () => {
        // 실제 프로필 이미지가 있다면 사용, 없다면 기본 아바타
        if (consultant.profileImage) {
            return consultant.profileImage;
        }
        
        // 기본 아바타 생성 (이름의 첫 글자 사용)
        const firstChar = consultant.name ? consultant.name.charAt(0) : '?';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstChar)}&background=007bff&color=fff&size=80&font-size=0.5`;
    };

    /**
     * 전문분야 배지 렌더링
     */
    const renderSpecialtyBadges = () => {
        const specialties = consultant.specialties || consultant.specialty || [];
        const specialtyArray = Array.isArray(specialties) ? specialties : [specialties];
        
        return specialtyArray.slice(0, 2).map((specialty, index) => (
            <span key={index} className="specialty-badge">
                {specialty}
            </span>
        ));
    };

    /**
     * 가용성 상태 아이콘
     */
    const getAvailabilityIcon = () => {
        if (consultant.available === false) {
            return <span className="availability-icon unavailable">🔴</span>;
        } else if (consultant.busy) {
            return <span className="availability-icon busy">🟡</span>;
        } else {
            return <span className="availability-icon available">🟢</span>;
        }
    };

    /**
     * 가용성 상태 텍스트
     */
    const getAvailabilityText = () => {
        if (consultant.available === false) {
            return '휴무';
        } else if (consultant.busy) {
            return '바쁨';
        } else {
            return '여유';
        }
    };

    /**
     * 카드 클릭 핸들러
     */
    const handleClick = (e) => {
        e.preventDefault();
        if (onClick) {
            onClick(consultant);
        }
    };

    /**
     * 드래그 시작 핸들러
     */
    const handleDragStart = (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
            id: consultant.id,
            type: 'consultant',
            data: consultant
        }));
        e.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div 
            className={`consultant-card ${selected ? 'selected' : ''} ${className}`}
            onClick={handleClick}
            draggable={draggable}
            onDragStart={handleDragStart}
            role="button"
            tabIndex="0"
            onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleClick(e);
                }
            }}
        >
            <div className="card-header">
                <div className="profile-section">
                    <div className="profile-image-container">
                        <img 
                            src={getProfileImageUrl()} 
                            alt={`${consultant.name} 프로필`}
                            className="profile-image"
                            onError={(e) => {
                                // 이미지 로드 실패 시 기본 이미지로 대체
                                e.target.src = getProfileImageUrl();
                            }}
                        />
                        <div className="availability-indicator">
                            {getAvailabilityIcon()}
                        </div>
                    </div>
                    
                    <div className="consultant-info">
                        <h4 className="consultant-name">{consultant.name}</h4>
                        <p className="consultant-title">
                            {consultant.title || consultant.position || '상담사'}
                        </p>
                        <div className="availability-status">
                            {getAvailabilityText()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="card-body">
                {/* 전문분야 */}
                <div className="specialties">
                    {renderSpecialtyBadges()}
                </div>

                {/* 경력 정보 */}
                {consultant.experience && (
                    <div className="experience">
                        <span className="experience-label">경력:</span>
                        <span className="experience-value">{consultant.experience}년</span>
                    </div>
                )}

                {/* 평점 */}
                {consultant.rating && (
                    <div className="rating">
                        <span className="rating-stars">
                            {'★'.repeat(Math.floor(consultant.rating))}
                            {'☆'.repeat(5 - Math.floor(consultant.rating))}
                        </span>
                        <span className="rating-value">({consultant.rating})</span>
                    </div>
                )}

                {/* 오늘 스케줄 수 */}
                {consultant.todayScheduleCount !== undefined && (
                    <div className="today-schedule">
                        <span className="schedule-label">오늘:</span>
                        <span className="schedule-count">{consultant.todayScheduleCount}건</span>
                    </div>
                )}
            </div>

            {/* 드래그 가능 표시 */}
            {draggable && (
                <div className="drag-handle">
                    <span className="drag-icon">⋮⋮</span>
                </div>
            )}

            {/* 선택 표시 */}
            {selected && (
                <div className="selected-indicator">
                    <span className="check-icon">✓</span>
                </div>
            )}
        </div>
    );
};

export default ConsultantCard;
