import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import notificationManager from '../../../utils/notification';
import StandardizedApi from '../../../utils/standardizedApi';
import { sessionManager } from '../../../utils/sessionManager';
import { toErrorMessage } from '../../../utils/safeDisplay';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { SESSION_EXTENSION_UI } from '../../../utils/sessionExtensionPending';
import { useTranslation } from 'react-i18next';

const MSG_USER_REQUIRED = '사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.';
const MSG_SUBMIT_FAILED = '회기 추가 요청에 실패했습니다.';
const DEFAULT_ADDITIONAL_SESSIONS = 1;
const DEFAULT_EXTENSION_AMOUNT = 0;


/**
 * 회기 추가 요청 모달 컴포넌트
/**
 * - 기존 매칭의 패키지 정보를 그대로 사용
/**
 * - 회기 수 조정 및 사유 입력
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2024-12-19
 */
const SessionExtensionModal = ({ 
    isOpen, 
    onClose, 
    mapping, 
    onSessionExtensionRequested 
}) => {
    const { t } = useTranslation();
    const [additionalSessions, setAdditionalSessions] = useState(DEFAULT_ADDITIONAL_SESSIONS);
    const [extensionAmount, setExtensionAmount] = useState(DEFAULT_EXTENSION_AMOUNT);
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 회기 추가는 기존 패키지를 승계하며 추가분 수량·결제 금액만 별도 입력한다.
    useEffect(() => {
        if (isOpen && mapping) {
            setAdditionalSessions(DEFAULT_ADDITIONAL_SESSIONS);
            setExtensionAmount(DEFAULT_EXTENSION_AMOUNT);
            setReason('');
        }
    }, [isOpen, mapping]);

    const handleSubmit = async(e) => {
        e.preventDefault();

        if (mapping?.pendingSessionExtension) {
            notificationManager.warning(SESSION_EXTENSION_UI.DUPLICATE_PENDING);
            return;
        }
        
        if (additionalSessions < 1) {
            notificationManager.error('추가할 회기 수는 1회 이상이어야 합니다.');
            return;
        }
        if (!Number.isFinite(extensionAmount) || extensionAmount < 0) {
            notificationManager.error('추가분 결제 금액을 입력해 주세요. (회기 수와 다를 수 있습니다)');
            return;
        }

        const currentUser = sessionManager.getUser();
        const requesterId = currentUser?.id;
        if (!requesterId) {
            notificationManager.error(MSG_USER_REQUIRED);
            return;
        }

        const packageName = mapping.packageName || mapping.package?.name || '';
        if (!packageName) {
            notificationManager.error('현재 매핑의 패키지 정보를 확인할 수 없습니다.');
            return;
        }

        setIsLoading(true);
        
        try {
            const requestData = {
                mappingId: mapping.id,
                requesterId,
                additionalSessions,
                extensionAmount,
                reason: reason || '회기 추가 요청'
            };

            const result = await StandardizedApi.post(
                API_ENDPOINTS.ADMIN.SESSION_EXTENSIONS.REQUESTS,
                requestData
            );

            if (result && result.success === false) {
                notificationManager.error(result.message || MSG_SUBMIT_FAILED);
                return;
            }

            notificationManager.success(SESSION_EXTENSION_UI.SUCCESS_HINT);
            onSessionExtensionRequested?.(mapping.id);
            handleClose();
        } catch (error) {
            console.error('❌ 회기 추가 실패:', error);
            const message = error?.response?.data?.message
                || error?.message
                || toErrorMessage(error, MSG_SUBMIT_FAILED);
            notificationManager.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setAdditionalSessions(DEFAULT_ADDITIONAL_SESSIONS);
        setExtensionAmount(DEFAULT_EXTENSION_AMOUNT);
        setReason('');
        setIsLoading(false);
        onClose();
    };

    if (!isOpen || !mapping) return null;

    return (
        <UnifiedModal
            isOpen={isOpen}
            onClose={handleClose}
            title="회기 추가 요청"
            subtitle="현재 패키지를 유지한 채 통합 회기에 추가합니다"
            size="large"
            backdropClick
            showCloseButton
            loading={isLoading}
            actions={
                <>
                    <MGButton
                        type="button"
                        variant="secondary"
                        size="medium"
                        className={buildErpMgButtonClassName({ variant: 'secondary', size: 'md', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        {t('admin.actions.cancel')}
                    </MGButton>
                    <MGButton
                        type="button"
                        variant="primary"
                        size="medium"
                        className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: isLoading })}
                        onClick={handleSubmit}
                        disabled={isLoading || additionalSessions <= 0}
                        loading={isLoading}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                    >
                        {additionalSessions}회기 추가 요청
                    </MGButton>
                </>
            }
        >
                <div className="mg-v2-modal-content mg-v2-modal-content--scrollable">
                    {/* 매칭 정보 표시 */}
                    <div className="mg-v2-card mg-v2-card--outlined">
                        <div className="mg-v2-card-header">
                            <Calendar size={20} />
                            <h4 className="mg-v2-card-title">현재 매칭 정보</h4>
                        </div>
                        <div className="mg-v2-card-body">
                            <div className="mg-v2-form-grid">
                                <div className="mg-v2-form-group">
                                    <label className="mg-v2-label">{t('admin.labels.client')}</label>
                                    <div className="mg-v2-text-primary">
                                        {mapping.client?.name || mapping.clientName || '알 수 없음'}
                                    </div>
                                </div>
                                <div className="mg-v2-form-group">
                                    <label className="mg-v2-label">{t('admin.labels.consultant')}</label>
                                    <div className="mg-v2-text-primary">
                                        {mapping.consultant?.name || mapping.consultantName || '알 수 없음'}
                                    </div>
                                </div>
                                <div className="mg-v2-form-group">
                                    <label className="mg-v2-label">현재 회기</label>
                                    <div className="mg-v2-text-primary mg-v2-font-weight-semibold">
                                        <span className="mg-v2-text-secondary">사용 </span>
                                        <span>{mapping.usedSessions || 0}</span>
                                        <span className="mg-v2-text-secondary"> / 남은 </span>
                                        <span>{mapping.remainingSessions ?? Math.max(
                                            0,
                                            (mapping.totalSessions || mapping.package?.sessions || 0)
                                                - (mapping.usedSessions || 0)
                                        )}</span>
                                        <span className="mg-v2-text-secondary"> / 총 </span>
                                        <span>{mapping.totalSessions || mapping.package?.sessions || 0}</span>
                                        <span className="mg-v2-text-secondary">회</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mg-v2-form-section">
                        <div className="mg-v2-section-header">
                            <h4 className="mg-v2-section-title">회기 추가 정보</h4>
                            <p className="mg-v2-section-subtitle">
                                현재 패키지와 기존 결제 정보는 변경되지 않습니다.
                            </p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="mg-v2-form">
                        <div className="mg-v2-form-group">
                            <span className="mg-v2-label">현재 패키지</span>
                            <strong className="mg-v2-text-primary">
                                {mapping.packageName || mapping.package?.name || '패키지 정보 없음'}
                            </strong>
                            <div className="mg-v2-text-secondary">
                                동일 패키지를 승계하며 패키지명·기존 가격을 덮어쓰지 않습니다.
                            </div>
                        </div>

                        <div className="mg-v2-form-group">
                            <label className="mg-v2-label" htmlFor="session-extension-additional-sessions">
                                추가 회기 수
                            </label>
                            <input
                                id="session-extension-additional-sessions"
                                type="number"
                                className="mg-v2-input"
                                value={additionalSessions}
                                min={DEFAULT_ADDITIONAL_SESSIONS}
                                step={DEFAULT_ADDITIONAL_SESSIONS}
                                onChange={(event) => setAdditionalSessions(Number(event.target.value))}
                                disabled={isLoading}
                            />
                            <div className="mg-v2-text-secondary">
                                패키지 기본 회기와 달라도 됩니다. 예: 10회 패키지에서 5회만 추가.
                            </div>
                        </div>

                        <div className="mg-v2-form-group">
                            <label className="mg-v2-label" htmlFor="session-extension-amount">
                                추가분 결제 금액(원)
                            </label>
                            <input
                                id="session-extension-amount"
                                type="number"
                                className="mg-v2-input"
                                value={extensionAmount}
                                min={DEFAULT_EXTENSION_AMOUNT}
                                onChange={(event) => setExtensionAmount(Number(event.target.value))}
                                disabled={isLoading}
                                required
                            />
                            <div className="mg-v2-text-secondary">
                                이번 요청 결제액만 저장합니다. 회기 수에 따라 금액이 달라질 수 있습니다.
                            </div>
                        </div>
                        
                        <div className="mg-v2-form-group">
                            <label className="mg-v2-label">추가 사유 (선택사항)</label>
                            <textarea
                                className="mg-v2-input"
                                rows="3"
                                placeholder="회기 추가 사유를 입력하세요..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        </form>
                    </div>
                </div>
        </UnifiedModal>
    );
};

export default SessionExtensionModal;
