import React, { useState, useEffect } from 'react';
import { Info, User, CreditCard, Calendar, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { apiGet } from '../../../utils/ajax';
import { getMappingPaymentMethodDisplayLabel } from '../../../constants/billing';
import { getUserStatusKoreanNameSync } from '../../../utils/codeHelper';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import { StatusBadge } from '../../common';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import './MappingDetailModal.css';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
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
            title={t('admin:MappingDetailModal.t_693f386f')}
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
                    {t('common.actions.close')}
                </MGButton>
            }
        >
                {loading ? (
                    <div className="mg-v2-modal-body">
                        <div className="mg-v2-loading-container">
                            <div className="mg-loading">{t('admin:MappingDetailModal.t_f596b561')}</div>
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
                                {t('admin:MappingDetailModal.t_eb7f501b')}
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
                                {t('admin:MappingDetailModal.t_cc4993c8')}
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
                                {t('admin:MappingDetailModal.t_8e5a3487')}
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
                                {t('admin:MappingDetailModal.t_36c76014')}
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
                                {t('admin:MappingDetailModal.t_14bf3e5b')}
                            </MGButton>
                        </div>

                        <div className="mg-v2-modal-body">

                        {/* 탭 컨텐츠 */}
                        <div className="mapping-detail-tab-content">
                            {activeTab === 'basic' && (
                                <div className="basic-info-tab">
                                    <div className="mg-v2-ad-b0kla__card info-section">
                                        <h4 className="mg-v2-ad-b0kla__section-title"><User size={18} className="mg-v2-icon-inline" /> {t('admin:MappingDetailModal.t_fd720290')}</h4>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <label>{t('admin:MappingDetailModal.t_8fddc854')}</label>
                                                <span>#{mapping?.id}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>{t('admin.labels.status')}</label>
                                                <span><StatusBadge status={mapping?.status} /></span>
                                            </div>
                                            <div className="info-item">
                                                <label>{t('admin:MappingDetailModal.t_d39b762e')}</label>
                                                <span>{getPaymentStatusBadge(mapping?.paymentStatus)}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>{t('admin:MappingDetailModal.t_5d24a2fc')}</label>
                                                <span>{mapping?.branchCode || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mg-v2-ad-b0kla__card info-section">
                                        <h4 className="mg-v2-ad-b0kla__section-title"><User size={18} className="mg-v2-icon-inline" /> {t('admin:MappingDetailModal.t_94e68210')}</h4>
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
                                        <h4 className="mg-v2-ad-b0kla__section-title"><Calendar size={18} className="mg-v2-icon-inline" /> {t('admin:MappingDetailModal.t_615aae20')}</h4>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <label>{t('admin:MappingDetailModal.t_453c56f5')}</label>
                                                <span>{formatDate(mapping?.startDate)}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>{t('admin:MappingDetailModal.t_a5466453')}</label>
                                                <span>{formatDate(mapping?.createdAt)}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>{t('admin:MappingDetailModal.t_38313ae9')}</label>
                                                <span>{formatDate(mapping?.updatedAt)}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>{t('admin:MappingDetailModal.t_cad7c84c')}</label>
                                                <span>{formatDate(mapping?.endDate)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'payment' && (
                                <div className="payment-info-tab">
                                    <div className="mg-v2-ad-b0kla__card info-section">
                                        <h4 className="mg-v2-ad-b0kla__section-title"><CreditCard size={18} className="mg-v2-icon-inline" /> {t('admin:MappingDetailModal.t_cc4993c8')}</h4>
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <label>{t('admin:MappingDetailModal.t_86796c3d')}</label>
                                                <span>{mapping?.packageName || '-'}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>{t('admin:MappingDetailModal.t_db433938')}</label>
                                                <span className="amount-highlight">
                                                    {formatCurrency(mapping?.packagePrice)}
                                                </span>
                                            </div>
                                            <div className="info-item">
                                                <label>{t('admin:MappingDetailModal.t_5fb664c2')}</label>
                                                <span className="amount-highlight">
                                                    {formatCurrency(mapping?.paymentAmount)}
                                                </span>
                                            </div>
                                            <div className="info-item">
                                                <label>{t('admin.labels.paymentMethod')}</label>
                                                <span>{getMappingPaymentMethodDisplayLabel(mapping?.paymentMethod)}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>{t('admin:MappingDetailModal.t_45e5e4dd')}</label>
                                                <span>{mapping?.paymentReference || '-'}</span>
                                            </div>
                                            <div className="info-item">
                                                <label>{t('admin:MappingDetailModal.t_f1e49d04')}</label>
                                                <span>{formatDate(mapping?.paymentDate)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {detailInfo && (
                                        <div className="mg-v2-ad-b0kla__card info-section">
                                            <h4 className="mg-v2-ad-b0kla__section-title"><CheckCircle size={18} className="mg-v2-icon-inline" /> {t('admin:MappingDetailModal.t_6a1cd6fb')}</h4>
                                            <div className="consistency-check">
                                                {detailInfo.isConsistent ? (
                                                    <div className="consistency-success">
                                                        <CheckCircle size={20} className="mg-v2-icon-inline" />
                                                        <span>{t('admin:MappingDetailModal.t_88d7cf42')}</span>
                                                    </div>
                                                ) : (
                                                    <div className="consistency-warning">
                                                        <AlertTriangle size={20} className="mg-v2-icon-inline" />
                                                        <div>
                                                            <p><strong>{t('admin:MappingDetailModal.t_82eefca1')}</strong> {detailInfo.consistencyMessage}</p>
                                                            <p><strong>{t('admin:MappingDetailModal.t_580f3e93')}</strong> {detailInfo.consistencyRecommendation}</p>
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
                                        <h4 className="mg-v2-ad-b0kla__section-title"><Calendar size={18} className="mg-v2-icon-inline" /> {t('admin:MappingDetailModal.t_5920af29')}</h4>
                                        <div className="sessions-summary">
                                            <div className="session-card total">
                                                <div className="session-number">{mapping?.totalSessions || 0}</div>
                                                <div className="session-label">{t('admin:MappingDetailModal.t_7a0890a2')}</div>
                                            </div>
                                            <div className="session-card used">
                                                <div className="session-number">{mapping?.usedSessions || 0}</div>
                                                <div className="session-label">{t('admin:MappingDetailModal.t_28e2e19c')}</div>
                                            </div>
                                            <div className="session-card remaining">
                                                <div className="session-number">{mapping?.remainingSessions || 0}</div>
                                                <div className="session-label">{t('admin:MappingDetailModal.t_e9792c10')}</div>
                                            </div>
                                        </div>
                                        
                                        {detailInfo && (
                                            <div className="session-details">
                                                <div className="info-item">
                                                    <label>{t('admin:MappingDetailModal.t_392dbd62')}</label>
                                                    <span>{formatCurrency(detailInfo.pricePerSession)}</span>
                                                </div>
                                                <div className="progress-section">
                                                    <label>{t('admin:MappingDetailModal.t_b147953e')}</label>
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
                                        <h4 className="mg-v2-ad-b0kla__section-title"><TrendingUp size={18} className="mg-v2-icon-inline" /> {t('admin:MappingDetailModal.t_ef40fbc0')}</h4>
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
                                                <p>{t('admin:MappingDetailModal.t_8e57b798')}</p>
                                                <small>{t('admin:MappingDetailModal.t_88715daf')}</small>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="history-info-tab">
                                    <div className="mg-v2-ad-b0kla__card info-section">
                                        <h4 className="mg-v2-ad-b0kla__section-title"><Clock size={18} className="mg-v2-icon-inline" /> {t('admin:MappingDetailModal.t_14bf3e5b')}</h4>
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
                                                <p>{t('admin:MappingDetailModal.t_de40a59e')}</p>
                                            </div>
                                        )}
                                    </div>

                                    {mapping?.specialConsiderations && (
                                        <div className="mg-v2-ad-b0kla__card info-section">
                                            <h4 className="mg-v2-ad-b0kla__section-title mg-v2-ad-b0kla__card-accent--orange"><AlertTriangle size={18} className="mg-v2-icon-inline" /> {t('admin:MappingDetailModal.t_aec2075b')}</h4>
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
