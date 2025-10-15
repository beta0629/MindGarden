import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Info, X, User, CreditCard, Calendar, TrendingUp, Clock } from 'lucide-react';
import { apiGet } from '../../../utils/ajax';
import UnifiedLoading from '../../common/UnifiedLoading';
import './MappingDetailModal.css';

/**
 * 매핑 상세보기 모달 컴포넌트
 * - 매핑의 모든 정보를 상세히 표시
 * - ERP 연동 상태, 금액 일관성 등 확인
 * - 거래 내역, 변경 이력 등 표시
 */
const MappingDetailModal = ({ mapping, isOpen, onClose }) => {
    const [detailInfo, setDetailInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');

    useEffect(() => {
        if (isOpen && mapping) {
            loadDetailInfo();
        }
    }, [isOpen, mapping]);

    const loadDetailInfo = async () => {
        if (!mapping?.id) return;
        
        setLoading(true);
        try {
            const response = await apiGet(`/api/admin/amount-management/mappings/${mapping.id}/amount-info`);
            if (response.success) {
                setDetailInfo(response.data);
            }
        } catch (error) {
            console.error('매핑 상세 정보 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '0원';
        return new Intl.NumberFormat('ko-KR').format(amount) + '원';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleString('ko-KR');
        } catch (error) {
            return dateString;
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'ACTIVE': { label: '활성', className: 'status-active' },
            'PENDING_PAYMENT': { label: '입금대기', className: 'status-pending' },
            'PAYMENT_CONFIRMED': { label: '입금확인', className: 'status-confirmed' },
            'TERMINATED': { label: '종료', className: 'status-terminated' },
            'SESSIONS_EXHAUSTED': { label: '회기소진', className: 'status-exhausted' }
        };
        
        const config = statusConfig[status] || { label: status || '알 수 없음', className: 'status-default' };
        return (
            <span className={`mg-badge ${config.className}`}>
                {config.label}
            </span>
        );
    };

    const getPaymentStatusBadge = (paymentStatus) => {
        const statusConfig = {
            'PENDING': { label: '결제대기', className: 'payment-pending' },
            'APPROVED': { label: '결제완료', className: 'payment-approved' },
            'REJECTED': { label: '결제거부', className: 'payment-rejected' }
        };
        
        const config = statusConfig[paymentStatus] || { label: paymentStatus || '알 수 없음', className: 'payment-default' };
        return (
            <span className={`mg-badge ${config.className}`}>
                {config.label}
            </span>
        );
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="mg-modal-overlay" onClick={onClose}>
            <div className="mg-modal mg-modal-large" onClick={(e) => e.stopPropagation()}>
                <div className="mg-modal-header">
                    <h2 className="mg-modal-title">
                        <Info size={24} />
                        매핑 상세 정보
                    </h2>
                    <button 
                        className="mg-modal-close"
                        onClick={onClose}
                        aria-label="닫기"
                    >
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="mg-modal-body">
                        <div className="mg-loading-container">
                            <UnifiedLoading 
                                text="상세 정보를 불러오는 중..." 
                                size="medium" 
                                type="inline"
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 탭 네비게이션 */}
                        <div className="mg-tabs">
                            <button 
                                className={`mg-tab ${activeTab === 'basic' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('basic')}
                            >
                                <User size={18} />
                                기본 정보
                            </button>
                            <button 
                                className={`mg-tab ${activeTab === 'payment' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('payment')}
                            >
                                <CreditCard size={18} />
                                결제 정보
                            </button>
                            <button 
                                className={`mg-tab ${activeTab === 'sessions' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('sessions')}
                            >
                                <Calendar size={18} />
                                회기 정보
                            </button>
                            <button 
                                className={`mg-tab ${activeTab === 'erp' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('erp')}
                            >
                                <TrendingUp size={18} />
                                ERP 연동
                            </button>
                            <button 
                                className={`mg-tab ${activeTab === 'history' ? 'mg-tab-active' : ''}`}
                                onClick={() => setActiveTab('history')}
                            >
                                <Clock size={18} />
                                변경 이력
                            </button>
                        </div>
                        
                        <div className="mg-modal-body">

                        {/* 탭 컨텐츠 */}
                        <div className="mapping-detail-tab-content">
                            {activeTab === 'basic' && (
                                <div className="basic-info-tab">
                                    <div className="info-section">
                                        <h4><i className="bi bi-person"></i> 매핑 기본 정보</h4>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <label>매핑 ID</label>
                                                <span>#{mapping?.id}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>상태</label>
                                                <span>{getStatusBadge(mapping?.status)}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>결제 상태</label>
                                                <span>{getPaymentStatusBadge(mapping?.paymentStatus)}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>지점</label>
                                                <span>{mapping?.branchCode || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="info-section">
                                        <h4><i className="bi bi-people"></i> 참여자 정보</h4>
                                        <div className="participants-info">
                                            <div className="participant-card consultant">
                                                <div className="participant-header">
                                                    <i className="bi bi-person-badge"></i>
                                                    <span>상담사</span>
                                                </div>
                                                <div className="participant-details">
                                                    <p><strong>{mapping?.consultantName}</strong></p>
                                                    <p className="text-muted">ID: {mapping?.consultantId}</p>
                                                </div>
                                            </div>
                                            <div className="participant-card client">
                                                <div className="participant-header">
                                                    <i className="bi bi-person"></i>
                                                    <span>내담자</span>
                                                </div>
                                                <div className="participant-details">
                                                    <p><strong>{mapping?.clientName}</strong></p>
                                                    <p className="text-muted">ID: {mapping?.clientId}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="info-section">
                                        <h4><i className="bi bi-calendar-event"></i> 일정 정보</h4>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <label>시작일</label>
                                                <span>{formatDate(mapping?.startDate)}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>생성일</label>
                                                <span>{formatDate(mapping?.createdAt)}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>수정일</label>
                                                <span>{formatDate(mapping?.updatedAt)}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>종료일</label>
                                                <span>{formatDate(mapping?.endDate)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'payment' && (
                                <div className="payment-info-tab">
                                    <div className="info-section">
                                        <h4><i className="bi bi-credit-card"></i> 결제 정보</h4>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <label>패키지명</label>
                                                <span>{mapping?.packageName || '-'}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>패키지 가격</label>
                                                <span className="amount-highlight">
                                                    {formatCurrency(mapping?.packagePrice)}
                                                </span>
                                            </div>
                                            <div className="info-item">
                                                <label>실제 결제 금액</label>
                                                <span className="amount-highlight">
                                                    {formatCurrency(mapping?.paymentAmount)}
                                                </span>
                                            </div>
                                            <div className="info-item">
                                                <label>결제 방법</label>
                                                <span>{mapping?.paymentMethod || '-'}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>결제 참조번호</label>
                                                <span>{mapping?.paymentReference || '-'}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>결제일</label>
                                                <span>{formatDate(mapping?.paymentDate)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {detailInfo && (
                                        <div className="info-section">
                                            <h4><i className="bi bi-check-circle"></i> 금액 일관성 검사</h4>
                                            <div className="consistency-check">
                                                {detailInfo.isConsistent ? (
                                                    <div className="consistency-success">
                                                        <i className="bi bi-check-circle-fill"></i>
                                                        <span>모든 금액이 일관적입니다</span>
                                                    </div>
                                                ) : (
                                                    <div className="consistency-warning">
                                                        <i className="bi bi-exclamation-triangle-fill"></i>
                                                        <div>
                                                            <p><strong>문제:</strong> {detailInfo.consistencyMessage}</p>
                                                            <p><strong>권장사항:</strong> {detailInfo.consistencyRecommendation}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'sessions' && (
                                <div className="sessions-info-tab">
                                    <div className="info-section">
                                        <h4><i className="bi bi-calendar-check"></i> 회기 현황</h4>
                                        <div className="sessions-summary">
                                            <div className="session-card total">
                                                <div className="session-number">{mapping?.totalSessions || 0}</div>
                                                <div className="session-label">총 회기</div>
                                            </div>
                                            <div className="session-card used">
                                                <div className="session-number">{mapping?.usedSessions || 0}</div>
                                                <div className="session-label">사용 회기</div>
                                            </div>
                                            <div className="session-card remaining">
                                                <div className="session-number">{mapping?.remainingSessions || 0}</div>
                                                <div className="session-label">남은 회기</div>
                                            </div>
                                        </div>
                                        
                                        {detailInfo && (
                                            <div className="session-details">
                                                <div className="info-item">
                                                    <label>회기당 단가</label>
                                                    <span>{formatCurrency(detailInfo.pricePerSession)}</span>
                                                </div>
                                                <div className="progress-section">
                                                    <label>진행률</label>
                                                    <div className="session-progress">
                                                        <div className="progress-bar">
                                                            <div 
                                                                className="progress-fill"
                                                                data-progress={Math.min(100, Math.max(0, ((mapping?.usedSessions || 0) / Math.max(1, mapping?.totalSessions || 1)) * 100))}
                                                            ></div>
                                                        </div>
                                                        <span className="progress-text">
                                                            {Math.round(Math.min(100, Math.max(0, ((mapping?.usedSessions || 0) / Math.max(1, mapping?.totalSessions || 1)) * 100)))}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'erp' && (
                                <div className="erp-info-tab">
                                    <div className="info-section">
                                        <h4><i className="bi bi-graph-up"></i> ERP 연동 상태</h4>
                                        {detailInfo?.relatedTransactions && detailInfo.relatedTransactions.length > 0 ? (
                                            <div className="erp-transactions">
                                                {detailInfo.relatedTransactions.map((transaction, index) => (
                                                    <div key={index} className="transaction-card">
                                                        <div className="transaction-header">
                                                            <span className={`transaction-type ${transaction.type ? transaction.type.toLowerCase() : 'unknown'}`}>
                                                                {transaction.type === 'INCOME' ? '수입' : '지출'}
                                                            </span>
                                                            <span className={`transaction-status ${transaction.status ? transaction.status.toLowerCase() : 'unknown'}`}>
                                                                {transaction.status === 'PENDING' ? '대기중' : 
                                                                 transaction.status === 'COMPLETED' ? '완료' :
                                                                 transaction.status === 'REJECTED' ? '거부' :
                                                                 transaction.status || '알 수 없음'}
                                                            </span>
                                                        </div>
                                                        <div className="transaction-details">
                                                            <div className="transaction-amount">
                                                                {formatCurrency(transaction.amount || 0)}
                                                            </div>
                                                            <div className="transaction-date">
                                                                {formatDate(transaction.createdAt)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="no-erp-data">
                                                <i className="bi bi-exclamation-circle"></i>
                                                <p>연동된 ERP 거래가 없습니다</p>
                                                <small>입금 확인 후 자동으로 ERP 거래가 생성됩니다</small>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="history-info-tab">
                                    <div className="info-section">
                                        <h4><i className="bi bi-clock-history"></i> 변경 이력</h4>
                                        {mapping?.notes ? (
                                            <div className="notes-content">
                                                {mapping.notes.split('\n').map((note, index) => (
                                                    <div key={index} className="note-item">
                                                        <div className="note-bullet"></div>
                                                        <div className="note-text">{note}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="no-history">
                                                <i className="bi bi-info-circle"></i>
                                                <p>변경 이력이 없습니다</p>
                                            </div>
                                        )}
                                    </div>

                                    {mapping?.specialConsiderations && (
                                        <div className="info-section">
                                            <h4><i className="bi bi-exclamation-triangle"></i> 특별 고려사항</h4>
                                            <div className="special-considerations">
                                                {mapping.specialConsiderations}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="mapping-detail-footer">
                    <button 
                        className="btn-secondary"
                        onClick={onClose}
                    >
                        <i className="bi bi-x-circle"></i>
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MappingDetailModal;
