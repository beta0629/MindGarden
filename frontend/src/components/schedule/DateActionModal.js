import React from 'react';
import './DateActionModal.css';

/**
 * 날짜 액션 선택 모달 컴포넌트
 * - 스케줄 등록
 * - 휴가 등록
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-02
 */
const DateActionModal = ({ 
    isOpen, 
    onClose, 
    selectedDate, 
    userRole, 
    onScheduleClick, 
    onVacationClick 
}) => {
    console.log('🔍 DateActionModal 렌더링:', { isOpen, selectedDate, userRole });
    
    if (!isOpen) {
        console.log('❌ DateActionModal: isOpen이 false이므로 렌더링하지 않음');
        return null;
    }

    const formatDate = (date) => {
        if (!date) return '';
        const dateObj = date instanceof Date ? date : new Date(date);
        return dateObj.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    };

    return (
        <div 
            className="date-action-modal"
            onClick={onClose}
        >
            <div 
                className="date-action-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="date-action-modal-header">
                    <h3 className="date-action-modal-title">📅 {formatDate(selectedDate)}</h3>
                    <p className="date-action-modal-subtitle">원하는 작업을 선택하세요</p>
                </div>
                
                <div className="date-action-modal-buttons">
                    <button 
                        onClick={onScheduleClick}
                        className="date-action-button date-action-button--primary"
                    >
                        <span className="date-action-button-icon">📋</span>
                        <div className="date-action-button-content">
                            <div className="date-action-button-title">일정 등록</div>
                            <div className="date-action-button-description">상담 일정을 등록합니다</div>
                        </div>
                    </button>
                    
                    {(userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN') && (
                        <button 
                            onClick={onVacationClick}
                            className="date-action-button date-action-button--secondary"
                        >
                            <span className="date-action-button-icon">🏖️</span>
                            <div className="date-action-button-content">
                                <div className="date-action-button-title">휴가 등록</div>
                                <div className="date-action-button-description">상담사의 휴가를 등록합니다</div>
                            </div>
                        </button>
                    )}
                    
                    <button 
                        onClick={onClose}
                        className="date-action-cancel-button"
                    >
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateActionModal;
