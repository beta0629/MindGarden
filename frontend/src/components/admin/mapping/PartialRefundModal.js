import React, { useState } from 'react';
import { RefreshCcw, Package, Clock, AlertTriangle, DollarSign, CreditCard } from 'lucide-react';
import { apiPost } from '../../../utils/ajax';
import notificationManager, { showNotification } from '../../../utils/notification';
import { useConfirm } from '../../../hooks/useConfirm';
import UnifiedModal from '../../common/modals/UnifiedModal';
import MGButton from '../../common/MGButton';
import SafeText from '../../common/SafeText';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';
import { useTranslation } from 'react-i18next';

/**
 * 부분 환불 모달 컴포넌트
 * 지정된 회기수만 환불 처리
 */
const PartialRefundModal = ({ mapping, isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [confirm, ConfirmModal] = useConfirm();
  const [refundSessions, setRefundSessions] = useState(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // 최근 추가된 패키지 정보 추정
  const getLastAddedPackageInfo = () => {
    if (!mapping) {
      return { sessions: 0, price: 0, packageName: t('admin:mapping.refund.noPackageFallback') };
    }

    // 표준 패키지 단위 (10회, 20회) 기준으로 추정
    const totalSessions = mapping.totalSessions || 0;

    if (totalSessions >= 10) {
      // 10회 단위로 추정 (가장 최근 추가분)
      const estimatedLastPackage = totalSessions % 10 === 0 ? 10 : totalSessions % 10;
      const lastPackageSessions = estimatedLastPackage === 0 ? 10 : estimatedLastPackage;

      // 비례 계산으로 가격 추정
      const estimatedPrice = mapping.packagePrice && totalSessions > 0
        ? Math.round((mapping.packagePrice * lastPackageSessions) / totalSessions)
        : 0;

      return {
        sessions: lastPackageSessions,
        price: estimatedPrice,
        packageName: t('admin:mapping.refund.lastPackageFallback', {
          sessions: lastPackageSessions
        })
      };
    }

    return {
      sessions: totalSessions,
      price: mapping.packagePrice || 0,
      packageName: mapping.packageName || t('admin:mapping.refund.basicPackageFallback')
    };
  };

  const lastAddedPackage = getLastAddedPackageInfo();
  
  // 환불 금액 계산 (최근 추가 패키지 기준)
  const refundAmount = lastAddedPackage.sessions > 0 ? 
    Math.round((lastAddedPackage.price * refundSessions) / lastAddedPackage.sessions) : 0;

  const handleSubmit = async(e) => {
    e.preventDefault();

    if (!reason.trim()) {
      showNotification(t('admin:mapping.refund.msgReasonRequired'), 'warning');
      return;
    }

    if (reason.trim().length < 5) {
      showNotification(t('admin:mapping.refund.msgReasonMinLength'), 'warning');
      return;
    }

    const maxRefundSessions = Math.min(mapping.remainingSessions, lastAddedPackage.sessions);

    if (refundSessions <= 0 || refundSessions > maxRefundSessions) {
      showNotification(
        t('admin:mapping.refund.msgRefundSessionsRange', { max: maxRefundSessions }),
        'warning'
      );
      return;
    }

    const confirmMessage = t('admin:mapping.refund.confirmMessage',
      {
        clientName: mapping.clientName,
        sessions: refundSessions,
        packageName: lastAddedPackage.packageName,
        packageSessions: lastAddedPackage.sessions,
        amount: refundAmount.toLocaleString(),
        perSession: Math.round(lastAddedPackage.price / lastAddedPackage.sessions).toLocaleString(),
        remainingAfter: mapping.remainingSessions - refundSessions,
        reason: reason.trim()
      }
    );

    const confirmed = await confirm({ message: confirmMessage, variant: 'danger' });
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      // 표준화 2025-12-08: /api/v1/admin 경로로 통일
      const response = await apiPost(`/api/v1/admin/mappings/${mapping.id}/partial-refund`, {
        refundSessions: refundSessions,
        reason: reason.trim()
      });

      if (response.success) {
        showNotification(
          t('admin:mapping.refund.msgRefundSuccess', { sessions: refundSessions }),
          'success'
        );
        onSuccess?.();
        onClose();

        // 환불 처리 완료 이벤트 발송
        window.dispatchEvent(new CustomEvent('partialRefundProcessed', {
          detail: {
            mappingId: mapping.id,
            clientName: mapping.clientName,
            consultantName: mapping.consultantName,
            refundSessions: refundSessions,
            refundAmount: refundAmount,
            remainingSessions: mapping.remainingSessions - refundSessions,
            reason: reason.trim()
          }
        }));
      } else {
        showNotification(response.message || t('admin:mapping.refund.msgRefundFailed'), 'error');
      }

    } catch (error) {
      console.error('부분 환불 처리 실패:', error);
      showNotification(t('admin:mapping.refund.msgRefundError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setRefundSessions(1);
      setReason('');
      onClose();
    }
  };

  if (!isOpen || !mapping) return null;
  // ConfirmModal 은 return 끝에 sibling 으로 렌더 (UnifiedModal 과 동시 노출 가능)

  // 청약 철회 기간 확인 (15일)
  const checkWithdrawalPeriod = () => {
    if (!mapping.paymentDate) {
      return {
        isValid: false,
        message: t('admin:mapping.refund.withdrawalNoPaymentDate')
      };
    }

    const paymentDate = new Date(mapping.paymentDate);
    const now = new Date();
    const daysSincePayment = Math.floor((now - paymentDate) / (1000 * 60 * 60 * 24));

    return {
      isValid: daysSincePayment <= 15,
      daysSincePayment,
      message: daysSincePayment <= 15
        ? t('admin:mapping.refund.withdrawalValid', { days: daysSincePayment })
        : t('admin:mapping.refund.withdrawalInvalid', { days: daysSincePayment })
    };
  };

  const withdrawalCheck = checkWithdrawalPeriod();

  return (
    <>
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('admin:mapping.refund.modalTitle')}
      size="auto"
      className="mg-v2-ad-b0kla"
      backdropClick
      showCloseButton
      loading={loading}
      actions={
        <>
          <MGButton
            type="button"
            variant="outline"
            size="medium"
            className={buildErpMgButtonClassName({ variant: 'outline', size: 'md', loading: false })}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            onClick={handleClose}
            disabled={loading}
            preventDoubleClick={false}
          >
            {t('admin:mapping.refund.actionCancel')}
          </MGButton>
          <MGButton
            type="submit"
            form="partial-refund-form"
            variant={!withdrawalCheck.isValid ? 'danger' : 'primary'}
            size="medium"
            className={buildErpMgButtonClassName({
              variant: !withdrawalCheck.isValid ? 'danger' : 'primary',
              size: 'md',
              loading
            })}
            disabled={loading || !reason.trim() || reason.trim().length < 5}
            loading={loading}
            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            title={!withdrawalCheck.isValid ? t('admin:mapping.refund.tooltipExpired') : ''}
            preventDoubleClick={false}
          >
            {!withdrawalCheck.isValid
              ? t('admin:mapping.refund.actionSpecialRefund', { sessions: refundSessions })
              : t('admin:mapping.refund.actionRefund', { sessions: refundSessions })}
          </MGButton>
        </>
      }
    >
        <form id="partial-refund-form" onSubmit={handleSubmit}>
          <div className="mg-v2-modal-body">
          {/* 매핑 정보 */}
          <div className="mg-v2-ad-b0kla__card mg-v2-info-box">
            <h4 className="mg-v2-info-box-title">
              <Package size={20} className="mg-v2-section-title-icon" />
              {t('admin:mapping.refund.mappingInfoTitle')}
            </h4>
            <div className="mg-v2-info-grid">
              <div><strong>{t('admin:mapping.refund.client')}</strong> <SafeText>{mapping.clientName}</SafeText></div>
              <div><strong>{t('admin:mapping.refund.consultant')}</strong> <SafeText>{mapping.consultantName}</SafeText></div>
              <div><strong>{t('admin:mapping.refund.totalSessions')}</strong> {mapping.totalSessions}{t('admin:mapping.page.modal.sessionUnit')}</div>
              <div><strong>{t('admin:mapping.refund.usedSessions')}</strong> {mapping.usedSessions}{t('admin:mapping.page.modal.sessionUnit')}</div>
              <div><strong>{t('admin:mapping.refund.remainingSessions')}</strong> {mapping.remainingSessions}{t('admin:mapping.page.modal.sessionUnit')}</div>
              <div><strong>{t('admin:mapping.refund.packageTotalPrice')}</strong> {t('admin:mapping.refund.refundAmount', { amount: (mapping.packagePrice ?? 0).toLocaleString() })}</div>
            </div>
          </div>

          {/* 최근 추가 패키지 정보 */}
          <div className="mg-v2-ad-b0kla__card mg-v2-refund-target-box">
            <h4 className="mg-v2-refund-target-title">
              <Package size={20} className="mg-v2-section-title-icon" />
              {t('admin:mapping.refund.lastPackageTitle')}
            </h4>
            <div className="mg-v2-refund-package-grid">
              <div><strong>{t('admin:mapping.refund.packageName')}</strong> <SafeText>{lastAddedPackage.packageName}</SafeText></div>
              <div><strong>{t('admin:mapping.refund.packageSessions')}</strong> {lastAddedPackage.sessions}{t('admin:mapping.page.modal.sessionUnit')}</div>
              <div><strong>{t('admin:mapping.refund.packagePrice')}</strong> {t('admin:mapping.refund.refundAmount', { amount: (lastAddedPackage.price ?? 0).toLocaleString() })}</div>
              <div><strong>{t('admin:mapping.refund.perSessionPrice')}</strong> {t('admin:mapping.refund.refundAmount', { amount: lastAddedPackage.sessions > 0 ? Math.round(lastAddedPackage.price / lastAddedPackage.sessions).toLocaleString() : 0 })}</div>
            </div>
            <div className="mg-v2-refund-target-warning">
              {t('admin:mapping.refund.warningRecent')}
            </div>
          </div>

          {/* 청약 철회 기간 확인 */}
          <div className={`mg-v2-ad-b0kla__card mg-v2-withdrawal-period-box mg-v2-withdrawal-period-box--${withdrawalCheck.isValid ? 'valid' : 'invalid'}`}>
            <h4 className={`mg-v2-withdrawal-period-title mg-v2-withdrawal-period-title--${withdrawalCheck.isValid ? 'valid' : 'invalid'}`}>
              <Clock size={20} className="mg-v2-section-title-icon" />
              {t('admin:mapping.refund.withdrawalPeriodTitle')}
            </h4>
            <div className={`mg-v2-withdrawal-period-message mg-v2-withdrawal-period-message--${withdrawalCheck.isValid ? 'valid' : 'invalid'}`}>
              <SafeText>{withdrawalCheck.message}</SafeText>
            </div>
            {mapping.paymentDate && (
              <div className={`mg-v2-withdrawal-period-date mg-v2-withdrawal-period-date--${withdrawalCheck.isValid ? 'valid' : 'invalid'}`}>
                {t('admin:mapping.refund.paymentDateLabel', { date: new Date(mapping.paymentDate).toLocaleDateString('ko-KR') })}
              </div>
            )}
            {!withdrawalCheck.isValid && (
              <div className="mg-v2-withdrawal-period-warning">
                <AlertTriangle size={16} className="mg-v2-icon-inline" />
                {t('admin:mapping.refund.warningOver15Days')}
              </div>
            )}
          </div>

          {/* 환불 회기수 입력 */}
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">
              <CreditCard size={16} className="mg-v2-form-label-icon" />
              {t('admin:mapping.refund.refundSessionsLabel')}
            </label>
            <input
              type="number"
              min="1"
              max={Math.min(mapping.remainingSessions, lastAddedPackage.sessions)}
              value={refundSessions}
              onChange={(e) => setRefundSessions(parseInt(e.target.value) || 1)}
              disabled={loading}
              className="mg-v2-form-input"
            />
            <small className="mg-v2-form-help">
              {t('admin:mapping.refund.refundSessionsHelp', { max: Math.min(mapping.remainingSessions, lastAddedPackage.sessions) })}
            </small>
          </div>

          {/* 환불 금액 미리보기 */}
          <div className="mg-v2-refund-preview">
            <div className="mg-v2-refund-preview-title">
              <DollarSign size={20} className="mg-v2-icon-inline" />
              {t('admin:mapping.refund.expectedRefundLabel')}
            </div>
            <div className="mg-v2-refund-preview-amount">
              {t('admin:mapping.refund.refundAmount', { amount: refundAmount.toLocaleString() })}
            </div>
            <small className="mg-v2-refund-preview-detail">
              {t('admin:mapping.refund.refundAfter', { count: mapping.remainingSessions - refundSessions })}
            </small>
          </div>

          {/* 환불 사유 입력 */}
          <div className="mg-v2-refund-reason-section">
            <label className="mg-v2-refund-reason-label">
              <Clock size={16} className="mg-v2-form-label-icon" />
              {t('admin:mapping.refund.reasonLabel')}{' '}
              <span className="mg-v2-form-label-required">
                {t('admin:mapping.refund.reasonRequiredMark', '*')}
              </span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              placeholder={t('admin:mapping.refund.reasonPlaceholder')}
              rows="4"
              className="mg-v2-form-textarea"
            />
            <small className="mg-v2-refund-reason-help">
              {t('admin:mapping.refund.reasonCounter', { count: reason.length })}
            </small>
          </div>
          </div>
        </form>
    </UnifiedModal>
    <ConfirmModal />
    </>
  );
};

export default PartialRefundModal;
