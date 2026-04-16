import React, { useState, useEffect } from 'react';
import { Info, User, CreditCard, Calendar, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { apiGet } from '../../../utils/ajax';
import { getUserStatusKoreanNameSync } from '../../../utils/codeHelper';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import { StatusBadge } from '../../common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import './MappingDetailModal.css';

/**
 * 매칭 상세보기 모달 컴포넌트
/**
 * - 매칭의 모든 정보를 상세히 표시
/**
 * - ERP 연동 상태, 금액 일관성 등 확인
/**
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

    const loadDetailInfo = async() => {
        if (!mapping?.id) return;
        
        setLoading(true);
        try {
            const response = await apiGet(`/api/admin/amount-management/mappings/${mapping.id}/amount-info`);
            if (response.success) {
                setDetailInfo(response.data);
            }
        } catch (error) {
            console.error('매칭 상세 정보 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '0원';
        return `${new Intl.NumberFormat('ko-KR').format(amount)}원`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleString('ko-KR');
        } catch (error) {
            return dateString;
        }
    };

    const getPaymentStatusBadge = (paymentStatus) => {
        const variantMap = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' };
        const variant = variantMap[paymentStatus] || 'neutral';
        const label = getUserStatusKoreanNameSync(paymentStatus) || '알 수 없음';
        return <StatusBadge variant={variant}>{label}</StatusBadge>;
    };

    if (!isOpen) return null;

    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={onClose}
            title="매칭 상세 정보"
            size="large"
            className="mg-v2-ad-b0kla"
            backdropClick
            showCloseButton
            loading={loading}
            actions={
                <MGButton
                    type="button"
                    variant="secondary"
                    className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
                    onClick={onClose}
                    preventDoubleClick={false}
                    loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                >
                    닫기
                </MGButton>
            }
        >
                {loading ? (
                    <div className="mg-v2-modal-body">
                        <div className="mg-v2-loading-container">
                            <div className="mg-loading">로딩중...</div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 탭 네비게이션 - B0KlA pill 스타일 */}
                        <div className="mg-v2-ad-b0kla__pill-toggle mapping-detail-tabs">
                            <MGButton
                                type="button"
                                variant="outline"
                                size="small"
                                className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })} mg-v2-ad-b0kla__pill ${activeTab === 'basic' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                                onClick={() => setActiveTab('basic')}
                                preventDoubleClick={false}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            >
                                기본 정보
                            </MGButton>
                            <MGButton
                                type="button"
                                variant="outline"
                                size="small"
                                className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })} mg-v2-ad-b0kla__pill ${activeTab === 'payment' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                                onClick={() => setActiveTab('payment')}
                                preventDoubleClick={false}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            >
                                결제 정보
                            </MGButton>
                            <MGButton
                                type="button"
                                variant="outline"
                                size="small"
                                className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })} mg-v2-ad-b0kla__pill ${activeTab === 'sessions' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                                onClick={() => setActiveTab('sessions')}
                                preventDoubleClick={false}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            >
                                회기 정보
                            </MGButton>
                            <MGButton
                                type="button"
                                variant="outline"
                                size="small"
                                className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })} mg-v2-ad-b0kla__pill ${activeTab === 'erp' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                                onClick={() => setActiveTab('erp')}
                                preventDoubleClick={false}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            >
                                ERP 연동
                            </MGButton>
                            <MGButton
                                type="button"
                                variant="outline"
                                size="small"
                                className={`${buildErpMgButtonClassName({ variant: 'outline', size: 'sm', loading: false })} mg-v2-ad-b0kla__pill ${activeTab === 'history' ? 'mg-v2-ad-b0kla__pill--active' : ''}`}
                                onClick={() => setActiveTab('history')}
                                preventDoubleClick={false}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            >
                                변경 이력
                            </MGButton>
                        </div>

                        <div className="mg-v2-modal-body">

                        {/* 탭 컨텐츠 */}
                        <div className="mapping-detail-tab-content">
                            {activeTab === 'basic' && (
                                <div className="basic-info-tab">
                                    <div className="mg-v2-ad-b0kla__card info-section">
                                        <h4 className="mg-v2-ad-b0kla__section-title"><User size={18} className="mg-v2-icon-inline" /> 매칭 기본 정보</h4>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <label>매칭 ID</label>
                                                <span>#{mapping?.id}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>상태</label>
                                                <span><StatusBadge status={mapping?.status} /></span>
                                            </div>
                                            <div className="info-item">
                                                <label>결제 상태</label>
                                                <span>{getPaymentStatusBadge(mapping?.paymentStatus)}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>소속</label>
                                                <span>{mapping?.branchCode || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mg-v2-ad-b0kla__card info-section">
                                        <h4 className="mg-v2-ad-b0kla__section-title"><User size={18} className="mg-v2-icon-inline" /> 참여자 정보</h4>
                                        <div className="participants-info mg-v2-ad-b0kla__counselor-list">
                                            <div className="mg-v2-ad-b0kla__counselor-item participant-card consultant">
                                                <div className="mg-v2-ad-b0kla__counselor-avatar mg-v2-ad-b0kla__counselor-avatar--green">
                                                    <User size={18} />
                                                </div>
                                                <div className="mg-v2-ad-b0kla__counselor-data participant-details">
                                                    <p className="mg-v2-ad-b0kla__counselor-name"><strong>{mapping?.consultantName}</strong></p>
                                                    <p className="mg-v2-ad-b0kla__counselor-rating">ID: {mapping?.consultantId}</p>
                                                </div>
                                            </div>
                                            <div className="mg-v2-ad-b0kla__counselor-item participant-card client">
                                                <div className="mg-v2-ad-b0kla__counselor-avatar mg-v2-ad-b0kla__counselor-avatar--blue">
                                                    <User size={18} />
                                                </div>
                                                <div className="mg-v2-ad-b0kla__counselor-data participant-details">
                                                    <p className="mg-v2-ad-b0kla__counselor-name"><strong>{mapping?.clientName}</strong></p>
                                                    <p className="mg-v2-ad-b0kla__counselor-rating">ID: {mapping?.clientId}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mg-v2-ad-b0kla__card info-section">
                                        <h4 className="mg-v2-ad-b0kla__section-title"><Calendar size={18} className="mg-v2-icon-inline" /> 일정 정보</h4>
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
                                    <div className="mg-v2-ad-b0kla__card info-section">
                                        <h4 className="mg-v2-ad-b0kla__section-title"><CreditCard size={18} className="mg-v2-icon-inline" /> 결제 정보</h4>
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
                                        <div className="mg-v2-ad-b0kla__card info-section">
                                            <h4 className="mg-v2-ad-b0kla__section-title"><CheckCircle size={18} className="mg-v2-icon-inline" /> 금액 일관성 검사</h4>
                                            <div className="consistency-check">
                                                {detailInfo.isConsistent ? (
                                                    <div className="consistency-success">
                                                        <CheckCircle size={20} className="mg-v2-icon-inline" />
                                                        <span>모든 금액이 일관적입니다</span>
                                                    </div>
                                                ) : (
                                                    <div className="consistency-warning">
                                                        <AlertTriangle size={20} className="mg-v2-icon-inline" />
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
                                    <div className="mg-v2-ad-b0kla__card info-section">
                                        <h4 className="mg-v2-ad-b0kla__section-title"><Calendar size={18} className="mg-v2-icon-inline" /> 회기 현황</h4>
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
                                                             />
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
                                    <div className="mg-v2-ad-b0kla__card info-section">
                                        <h4 className="mg-v2-ad-b0kla__section-title"><TrendingUp size={18} className="mg-v2-icon-inline" /> ERP 연동 상태</h4>
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
                                                <AlertTriangle size={24} className="mg-v2-icon-inline" />
                                                <p>연동된 ERP 거래가 없습니다</p>
                                                <small>입금 확인 후 자동으로 ERP 거래가 생성됩니다</small>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="history-info-tab">
                                    <div className="mg-v2-ad-b0kla__card info-section">
                                        <h4 className="mg-v2-ad-b0kla__section-title"><Clock size={18} className="mg-v2-icon-inline" /> 변경 이력</h4>
                                        {mapping?.notes ? (
                                            <div className="notes-content">
                                                {mapping.notes.split('\n').map((note, index) => (
                                                    <div key={index} className="note-item">
                                                        <div className="note-bullet" />
                                                        <div className="note-text">{note}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="no-history">
                                                <Info size={24} className="mg-v2-icon-inline" />
                                                <p>변경 이력이 없습니다</p>
                                            </div>
                                        )}
                                    </div>

                                    {mapping?.specialConsiderations && (
                                        <div className="mg-v2-ad-b0kla__card info-section">
                                            <h4 className="mg-v2-ad-b0kla__section-title mg-v2-ad-b0kla__card-accent--orange"><AlertTriangle size={18} className="mg-v2-icon-inline" /> 특별 고려사항</h4>
                                            <div className="special-considerations">
                                                {mapping.specialConsiderations}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        </div>
                    </>
                )}
        </UnifiedModal>
    );
};

export default MappingDetailModal;
