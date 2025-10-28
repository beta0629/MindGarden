import React from 'react';
import ReactDOM from 'react-dom';
import { Calendar, XCircle, FileText, Umbrella, CheckCircle } from 'lucide-react';

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

    if (!isOpen) {
        return null;
    }

    const portalTarget = document.body || document.createElement('div');

    return ReactDOM.createPortal(
        <div className="mg-v2-modal-overlay" onClick={onClose}>
            <div className="mg-v2-modal" onClick={(e) => e.stopPropagation()}>
                <div className="mg-v2-modal-header">
                    <div className="mg-v2-modal-title-wrapper">
                        <Calendar size={28} className="mg-v2-modal-title-icon" />
                        <h2 className="mg-v2-modal-title">{formatDate(selectedDate)}</h2>
                    </div>
                    <button className="mg-v2-modal-close" onClick={onClose} aria-label="닫기">
                        <XCircle size={24} />
                    </button>
                </div>

                <div className="mg-v2-modal-body">
                    <p className="mg-v2-text-secondary mg-v2-mb-lg">원하는 작업을 선택하세요</p>
                    
                    {(userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN' || userRole === 'HQ_MASTER' || userRole === 'SUPER_HQ_ADMIN') && (
                        <div className="mg-v2-form-section">
                            <button 
                                onClick={onScheduleClick}
                                className="mg-v2-btn mg-v2-btn--primary mg-v2-btn--large mg-v2-w-full"
                            >
                                <FileText size={24} className="mg-v2-icon-inline--lg" />
                                <div className="mg-v2-text-left mg-v2-flex-1">
                                    <div className="mg-v2-text-lg mg-v2-font-semibold">상담 일정 등록</div>
                                    <div className="mg-v2-text-sm mg-v2-text-secondary">상담사와 내담자의 상담 일정을 등록합니다</div>
                                </div>
                            </button>
                            
                            <button 
                                onClick={onVacationClick}
                                className="mg-v2-btn mg-v2-btn--secondary mg-v2-btn--large mg-v2-w-full mg-v2-mt-md"
                            >
                                <Umbrella size={24} className="mg-v2-icon-inline--lg" />
                                <div className="mg-v2-text-left mg-v2-flex-1">
                                    <div className="mg-v2-text-lg mg-v2-font-semibold">휴가 등록</div>
                                    <div className="mg-v2-text-sm mg-v2-text-secondary">상담사의 휴가를 등록합니다</div>
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                <div className="mg-v2-modal-footer">
                    <button 
                        onClick={onClose}
                        className="mg-v2-btn mg-v2-btn--ghost mg-v2-w-full"
                    >
                        <XCircle size={20} className="mg-v2-icon-inline" />
                        취소
                    </button>
                </div>
            </div>
        </div>,
        portalTarget
    );
};

export default DateActionModal;
