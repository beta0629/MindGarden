import React, { useState } from 'react';
import { RefreshCcw, Package, Clock, AlertTriangle, DollarSign, CreditCard } from 'lucide-react';
import { apiPost } from '../../../utils/ajax';
import notificationManager, { showNotification } from '../../../utils/notification';
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
  const [refundSessions, setRefundSessions] = useState(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // 최근 추가된 패키지 정보 추정
  const getLastAddedPackageInfo = () => {
    if (!mapping) {
      return { sessions: 0, price: 0, packageName: t('admin:mapping.refund.noPackageFallback', '패키지 없음') };
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
        packageName: t('admin:mapping.refund.lastPackageFallback', '{{sessions}}회 패키지 (추정)', {
          sessions: lastPackageSessions
        })
      };
    }

    return {
      sessions: totalSessions,
      price: mapping.packagePrice || 0,
      packageName: mapping.packageName || t('admin:mapping.refund.basicPackageFallback', '기본 패키지')
    };
  };

  const lastAddedPackage = getLastAddedPackageInfo();
  
  // 환불 금액 계산 (최근 추가 패키지 기준)
  const refundAmount = lastAddedPackage.sessions > 0 ? 
    Math.round((lastAddedPackage.price * refundSessions) / lastAddedPackage.sessions) : 0;

  const handleSubmit = async(e) => {
    e.preventDefault();

    if (!reason.trim()) {
      showNotification(t('admin:mapping.refund.msgReasonRequired', '⚠️ 환불 사유를 반드시 입력해주세요.'), 'warning');
      return;
    }

    if (reason.trim().length < 5) {
      showNotification(t('admin:mapping.refund.msgReasonMinLength', '⚠️ 환불 사유를 5자 이상 상세히 입력해주세요.'), 'warning');
      return;
    }

    const maxRefundSessions = Math.min(mapping.remainingSessions, lastAddedPackage.sessions);

    if (refundSessions <= 0 || refundSessions > maxRefundSessions) {
      showNotification(
        t('admin:mapping.refund.msgRefundSessionsRange', '⚠️ 환불 회기수는 1~{{max}} 사이여야 합니다. (최근 추가 패키지 기준)', { max: maxRefundSessions }),
        'warning'
      );
      return;
    }

    const confirmMessage = t(
      'admin:mapping.refund.confirmMessage',
      '{{clientName}}의 {{sessions}}회기를 환불 처리하시겠습니까?\n\n📦 환불 대상: {{packageName}}\n환불 회기: {{sessions}}회 (최근 추가 {{packageSessions}}회 중)\n환불 금액: {{amount}}원 (회기당 {{perSession}}원)\n환불 후 남은 회기: {{remainingAfter}}회\n환불 사유: {{reason}}\n\n⚠️ 가장 최근 추가된 패키지만 환불됩니다.\n이 작업은 되돌릴 수 없습니다.',
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

    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(confirmMessage, resolve);
    });
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
          t('admin:mapping.refund.msgRefundSuccess', '✅ {{sessions}}회기 부분 환불이 완료되었습니다! ERP 시스템에 환불 거래가 자동 등록되었습니다.', { sessions: refundSessions }),
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
        showNotification(response.message || t('admin:mapping.refund.msgRefundFailed', '부분 환불 처리에 실패했습니다.'), 'error');
      }

    } catch (error) {
      console.error('부분 환불 처리 실패:', error);
      showNotification(t('admin:mapping.refund.msgRefundError', '부분 환불 처리 중 오류가 발생했습니다.'), 'error');
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

  // 청약 철회 기간 확인 (15일)
  const checkWithdrawalPeriod = () => {
    if (!mapping.paymentDate) {
      return {
        isValid: false,
        message: t('admin:mapping.refund.withdrawalNoPaymentDate', '결제일 정보가 없습니다.')
      };
    }

    const paymentDate = new Date(mapping.paymentDate);
    const now = new Date();
    const daysSincePayment = Math.floor((now - paymentDate) / (1000 * 60 * 60 * 24));

    return {
      isValid: daysSincePayment <= 15,
      daysSincePayment,
      message: daysSincePayment <= 15
        ? t('admin:mapping.refund.withdrawalValid', '청약 철회 기간 내 ({{days}}일 경과, 15일 이내)', { days: daysSincePayment })
        : t('admin:mapping.refund.withdrawalInvalid', '청약 철회 기간 초과 ({{days}}일 경과, 15일 초과)', { days: daysSincePayment })
    };
  };

  const withdrawalCheck = checkWithdrawalPeriod();

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('admin:mapping.refund.modalTitle', '부분 환불 처리')}
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
            {t('admin:mapping.refund.actionCancel', '취소')}
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
            title={!withdrawalCheck.isValid ? t('admin:mapping.refund.tooltipExpired', '청약 철회 기간 초과 - 특별 사유 시에만 처리') : ''}
            preventDoubleClick={false}
          >
            {!withdrawalCheck.isValid
              ? t('admin:mapping.refund.actionSpecialRefund', '{{sessions}}회기 특별 환불', { sessions: refundSessions })
              : t('admin:mapping.refund.actionRefund', '{{sessions}}회기 환불 처리', { sessions: refundSessions })}
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
              {t('admin:mapping.refund.mappingInfoTitle', '매핑 정보')}
            </h4>
            <div className="mg-v2-info-grid">
              <div><strong>{t('admin:mapping.refund.client', '내담자:')}</strong> <SafeText>{mapping.clientName}</SafeText></div>
              <div><strong>{t('admin:mapping.refund.consultant', '상담사:')}</strong> <SafeText>{mapping.consultantName}</SafeText></div>
              <div><strong>{t('admin:mapping.refund.totalSessions', '총 회기:')}</strong> {mapping.totalSessions}{t('admin:mapping.page.modal.sessionUnit', '회')}</div>
              <div><strong>{t('admin:mapping.refund.usedSessions', '사용 회기:')}</strong> {mapping.usedSessions}{t('admin:mapping.page.modal.sessionUnit', '회')}</div>
              <div><strong>{t('admin:mapping.refund.remainingSessions', '남은 회기:')}</strong> {mapping.remainingSessions}{t('admin:mapping.page.modal.sessionUnit', '회')}</div>
              <div><strong>{t('admin:mapping.refund.packageTotalPrice', '전체 패키지 가격:')}</strong> {t('admin:mapping.refund.refundAmount', '{{amount}}원', { amount: (mapping.packagePrice ?? 0).toLocaleString() })}</div>
            </div>
          </div>

          {/* 최근 추가 패키지 정보 */}
          <div className="mg-v2-ad-b0kla__card mg-v2-refund-target-box">
            <h4 className="mg-v2-refund-target-title">
              <Package size={20} className="mg-v2-section-title-icon" />
              {t('admin:mapping.refund.lastPackageTitle', '환불 대상 (최근 추가 패키지)')}
            </h4>
            <div className="mg-v2-refund-package-grid">
              <div><strong>{t('admin:mapping.refund.packageName', '패키지명:')}</strong> <SafeText>{lastAddedPackage.packageName}</SafeText></div>
              <div><strong>{t('admin:mapping.refund.packageSessions', '패키지 회기수:')}</strong> {lastAddedPackage.sessions}{t('admin:mapping.page.modal.sessionUnit', '회')}</div>
              <div><strong>{t('admin:mapping.refund.packagePrice', '패키지 가격:')}</strong> {t('admin:mapping.refund.refundAmount', '{{amount}}원', { amount: (lastAddedPackage.price ?? 0).toLocaleString() })}</div>
              <div><strong>{t('admin:mapping.refund.perSessionPrice', '회기당 단가:')}</strong> {t('admin:mapping.refund.refundAmount', '{{amount}}원', { amount: lastAddedPackage.sessions > 0 ? Math.round(lastAddedPackage.price / lastAddedPackage.sessions).toLocaleString() : 0 })}</div>
            </div>
            <div className="mg-v2-refund-target-warning">
              {t('admin:mapping.refund.warningRecent', '⚠️ 부분 환불은 가장 최근에 추가된 패키지를 우선으로 처리됩니다. (단회기, 임의 회기수도 가능)')}
            </div>
          </div>

          {/* 청약 철회 기간 확인 */}
          <div className={`mg-v2-ad-b0kla__card mg-v2-withdrawal-period-box mg-v2-withdrawal-period-box--${withdrawalCheck.isValid ? 'valid' : 'invalid'}`}>
            <h4 className={`mg-v2-withdrawal-period-title mg-v2-withdrawal-period-title--${withdrawalCheck.isValid ? 'valid' : 'invalid'}`}>
              <Clock size={20} className="mg-v2-section-title-icon" />
              {t('admin:mapping.refund.withdrawalPeriodTitle', '청약 철회 기간 확인')}
            </h4>
            <div className={`mg-v2-withdrawal-period-message mg-v2-withdrawal-period-message--${withdrawalCheck.isValid ? 'valid' : 'invalid'}`}>
              <SafeText>{withdrawalCheck.message}</SafeText>
            </div>
            {mapping.paymentDate && (
              <div className={`mg-v2-withdrawal-period-date mg-v2-withdrawal-period-date--${withdrawalCheck.isValid ? 'valid' : 'invalid'}`}>
                {t('admin:mapping.refund.paymentDateLabel', '결제일: {{date}}', { date: new Date(mapping.paymentDate).toLocaleDateString('ko-KR') })}
              </div>
            )}
            {!withdrawalCheck.isValid && (
              <div className="mg-v2-withdrawal-period-warning">
                <AlertTriangle size={16} className="mg-v2-icon-inline" />
                {t('admin:mapping.refund.warningOver15Days', '15일 초과로 청약 철회 불가능합니다. 특별한 사유가 있는 경우에만 처리하세요.')}
              </div>
            )}
          </div>

          {/* 환불 회기수 입력 */}
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">
              <CreditCard size={16} className="mg-v2-form-label-icon" />
              {t('admin:mapping.refund.refundSessionsLabel', '환불할 회기수')}
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
              {t('admin:mapping.refund.refundSessionsHelp', '최대 {{max}}회까지 환불 가능 (최근 추가 패키지 기준)', { max: Math.min(mapping.remainingSessions, lastAddedPackage.sessions) })}
            </small>
          </div>

          {/* 환불 금액 미리보기 */}
          <div className="mg-v2-refund-preview">
            <div className="mg-v2-refund-preview-title">
              <DollarSign size={20} className="mg-v2-icon-inline" />
              {t('admin:mapping.refund.expectedRefundLabel', '예상 환불 금액')}
            </div>
            <div className="mg-v2-refund-preview-amount">
              {t('admin:mapping.refund.refundAmount', '{{amount}}원', { amount: refundAmount.toLocaleString() })}
            </div>
            <small className="mg-v2-refund-preview-detail">
              {t('admin:mapping.refund.refundAfter', '환불 후 남은 회기: {{count}}회', { count: mapping.remainingSessions - refundSessions })}
            </small>
          </div>

          {/* 환불 사유 입력 */}
          <div className="mg-v2-refund-reason-section">
            <label className="mg-v2-refund-reason-label">
              <Clock size={16} className="mg-v2-form-label-icon" />
              {t('admin:mapping.refund.reasonLabel', '환불 사유')}{' '}
              <span className="mg-v2-form-label-required">
                {t('admin:mapping.refund.reasonRequiredMark', '*')}
              </span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              placeholder={t('admin:mapping.refund.reasonPlaceholder', '환불 사유를 상세히 입력해주세요 (최소 5자 이상)')}
              rows="4"
              className="mg-v2-form-textarea"
            />
            <small className="mg-v2-refund-reason-help">
              {t('admin:mapping.refund.reasonCounter', '{{count}}/500자 (최소 5자 이상 입력)', { count: reason.length })}
            </small>
          </div>
          </div>
        </form>
    </UnifiedModal>
  );
};

export default PartialRefundModal;
