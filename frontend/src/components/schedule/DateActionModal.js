import React from 'react';
import '../../styles/main.css';

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
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    };

    return (
        <div 
            className="confirm-modal"
            onClick={onClose}
        >
            <div 
                className="confirm-content"
                onClick={(e) => e.stopPropagation()}
            >
                <h3>📅 {formatDate(selectedDate)}</h3>
                <p>원하는 작업을 선택하세요</p>
                
                <div className="confirm-buttons" style={{ flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <button 
                        onClick={onScheduleClick}
                        className="btn-confirm"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            textAlign: 'left',
                            padding: 'var(--spacing-lg)',
                            gap: 'var(--spacing-md)',
                            width: '100%',
                            justifyContent: 'flex-start',
                            backgroundColor: 'var(--color-primary)',
                            color: 'var(--color-text-light)',
                            border: 'none',
                            borderRadius: 'var(--border-radius-medium)',
                            fontSize: 'var(--font-size-base)',
                            fontWeight: 'var(--font-weight-semibold)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span style={{ fontSize: 'var(--font-size-xl)', flexShrink: 0 }}>📋</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ 
                                fontSize: 'var(--font-size-lg)', 
                                fontWeight: 'var(--font-weight-semibold)',
                                marginBottom: 'var(--spacing-xs)'
                            }}>일정 등록</div>
                            <div style={{ 
                                fontSize: 'var(--font-size-sm)',
                                opacity: 0.9
                            }}>상담 일정을 등록합니다</div>
                        </div>
                    </button>
                    
                    {(userRole === 'ADMIN' || userRole === 'BRANCH_SUPER_ADMIN') && (
                        <button 
                            onClick={onVacationClick}
                            className="btn-confirm"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                textAlign: 'left',
                                padding: 'var(--spacing-lg)',
                                gap: 'var(--spacing-md)',
                                width: '100%',
                                justifyContent: 'flex-start',
                                backgroundColor: 'var(--color-accent)',
                                color: 'var(--color-text-primary)',
                                border: 'none',
                                borderRadius: 'var(--border-radius-medium)',
                                fontSize: 'var(--font-size-base)',
                                fontWeight: 'var(--font-weight-semibold)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <span style={{ fontSize: 'var(--font-size-xl)', flexShrink: 0 }}>🏖️</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ 
                                    fontSize: 'var(--font-size-lg)', 
                                    fontWeight: 'var(--font-weight-semibold)',
                                    marginBottom: 'var(--spacing-xs)'
                                }}>휴가 등록</div>
                                <div style={{ 
                                    fontSize: 'var(--font-size-sm)',
                                    opacity: 0.8
                                }}>상담사의 휴가를 등록합니다</div>
                            </div>
                        </button>
                    )}
                    
                    <button 
                        onClick={onClose}
                        className="btn-cancel"
                        style={{ marginTop: 'var(--spacing-md)' }}
                    >
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateActionModal;
