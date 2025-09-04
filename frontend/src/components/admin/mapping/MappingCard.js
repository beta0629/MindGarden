import React from 'react';
import { 
    MAPPING_STATUS_LABELS, 
    MAPPING_STATUS_COLORS 
} from '../../../constants/mapping';
import './MappingCard.css';

/**
 * 매핑 카드 컴포넌트
 * - 개별 매핑 정보를 카드 형태로 표시
 * - 매핑 상태, 참여자 정보, 세션 정보 등 표시
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
const MappingCard = ({ 
    mapping, 
    onApprove, 
    onReject, 
    onEdit, 
    onView 
}) => {
    // 상태별 색상
    const getStatusColor = (status) => {
        return MAPPING_STATUS_COLORS[status] || '#6c757d';
    };

    // 상태별 한글명
    const getStatusLabel = (status) => {
        return MAPPING_STATUS_LABELS[status] || status;
    };

    return (
        <div className="mapping-card">
            <div className="mapping-card-header">
                <div className="mapping-status">
                    <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(mapping.status) }}
                    >
                        {getStatusLabel(mapping.status)}
                    </span>
                </div>
                <div className="mapping-date">
                    {mapping.startDate ? 
                        (() => {
                            try {
                                return new Date(mapping.startDate).toLocaleDateString('ko-KR');
                            } catch (error) {
                                return '날짜 정보 없음';
                            }
                        })() : 
                        '날짜 정보 없음'
                    }
                </div>
            </div>

            <div className="mapping-card-content">
                <div className="mapping-participants">
                    <div className="participant">
                        <div className="participant-role">상담사</div>
                        <div className="participant-name">
                            {mapping.consultant?.name || mapping.consultantName || '상담사 정보 없음'}
                        </div>
                        <div className="participant-email">
                            {mapping.consultant?.email || ''}
                        </div>
                    </div>
                    <div className="participant-arrow">→</div>
                    <div className="participant">
                        <div className="participant-role">내담자</div>
                        <div className="participant-name">
                            {mapping.client?.name || mapping.clientName || '내담자 정보 없음'}
                        </div>
                        <div className="participant-email">
                            {mapping.client?.email || ''}
                        </div>
                    </div>
                </div>

                <div className="mapping-details">
                    <div className="detail-item">
                        <span className="detail-label">패키지:</span>
                        <span className="detail-value">{mapping.packageName || '기본 패키지'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">총 세션:</span>
                        <span className="detail-value">{mapping.totalSessions}회</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">남은 세션:</span>
                        <span className="detail-value">{mapping.remainingSessions}회</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">가격:</span>
                        <span className="detail-value">
                            {mapping.packagePrice?.toLocaleString() || 0}원
                        </span>
                    </div>
                </div>

                {mapping.notes && (
                    <div className="mapping-notes">
                        <span className="notes-label">메모:</span>
                        <span className="notes-content">{mapping.notes}</span>
                    </div>
                )}
            </div>

            <div className="mapping-card-actions">
                {(mapping.status === 'PENDING_PAYMENT' || mapping.paymentStatus === 'PENDING') && (
                    <>
                        <button 
                            className="btn btn-success btn-sm"
                            onClick={() => onApprove?.(mapping.id)}
                        >
                            <i className="bi bi-check-circle"></i> 승인
                        </button>
                        <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => onReject?.(mapping.id)}
                        >
                            <i className="bi bi-x-circle"></i> 거부
                        </button>
                    </>
                )}
                {mapping.status === 'ACTIVE' && mapping.paymentStatus === 'APPROVED' && (
                    <button 
                        className="btn btn-warning btn-sm"
                        onClick={() => onEdit?.(mapping)}
                    >
                        <i className="bi bi-pencil"></i> 수정
                    </button>
                )}
                <button 
                    className="btn btn-info btn-sm"
                    onClick={() => onView?.(mapping)}
                >
                    <i className="bi bi-eye"></i> 상세보기
                </button>
            </div>
        </div>
    );
};

export default MappingCard;
