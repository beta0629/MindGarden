import React, { useState } from 'react';
import { CreditCard, RefreshCcw, XCircle, Package, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { apiPost } from '../../../utils/ajax';
import notificationManager, { showNotification } from '../../../utils/notification';

/**
 * 부분 환불 모달 컴포넌트
 * 지정된 회기수만 환불 처리
 */
const PartialRefundModal = ({ mapping, isOpen, onClose, onSuccess }) => {
  const [refundSessions, setRefundSessions] = useState(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // 최근 추가된 패키지 정보 추정
  const getLastAddedPackageInfo = () => {
    if (!mapping) return { sessions: 0, price: 0, packageName: '패키지 없음' };
    
    // 표준 패키지 단위 (10회, 20회) 기준으로 추정
    const totalSessions = mapping.totalSessions || 0;
    
    if (totalSessions >= 10) {
      // 10회 단위로 추정 (가장 최근 추가분)
      const estimatedLastPackage = totalSessions % 10 === 0 ? 10 : totalSessions % 10;
      const lastPackageSessions = estimatedLastPackage === 0 ? 10 : estimatedLastPackage;
      
      // 비례 계산으로 가격 추정
      const estimatedPrice = mapping.packagePrice && totalSessions > 0 ? 
        Math.round((mapping.packagePrice * lastPackageSessions) / totalSessions) : 0;
      
      return {
        sessions: lastPackageSessions,
        price: estimatedPrice,
        packageName: `${lastPackageSessions}회 패키지 (추정)`
      };
    }
    
    return {
      sessions: totalSessions,
      price: mapping.packagePrice || 0,
      packageName: mapping.packageName || '기본 패키지'
    };
  };

  const lastAddedPackage = getLastAddedPackageInfo();
  
  // 환불 금액 계산 (최근 추가 패키지 기준)
  const refundAmount = lastAddedPackage.sessions > 0 ? 
    Math.round((lastAddedPackage.price * refundSessions) / lastAddedPackage.sessions) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      showNotification('⚠️ 환불 사유를 반드시 입력해주세요.', 'warning');
      return;
    }

    if (reason.trim().length < 5) {
      showNotification('⚠️ 환불 사유를 5자 이상 상세히 입력해주세요.', 'warning');
      return;
    }

    const maxRefundSessions = Math.min(mapping.remainingSessions, lastAddedPackage.sessions);
    
    if (refundSessions <= 0 || refundSessions > maxRefundSessions) {
      showNotification(`⚠️ 환불 회기수는 1~${maxRefundSessions} 사이여야 합니다. (최근 추가 패키지 기준)`, 'warning');
      return;
    }

    const confirmMessage = `${mapping.clientName}의 ${refundSessions}회기를 환불 처리하시겠습니까?\n\n` +
      `📦 환불 대상: ${lastAddedPackage.packageName}\n` +
      `환불 회기: ${refundSessions}회 (최근 추가 ${lastAddedPackage.sessions}회 중)\n` +
      `환불 금액: ${refundAmount.toLocaleString()}원 (회기당 ${Math.round(lastAddedPackage.price / lastAddedPackage.sessions).toLocaleString()}원)\n` +
      `환불 후 남은 회기: ${mapping.remainingSessions - refundSessions}회\n` +
      `환불 사유: ${reason.trim()}\n\n` +
      `⚠️ 가장 최근 추가된 패키지만 환불됩니다.\n` +
      `이 작업은 되돌릴 수 없습니다.`;

    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(confirmMessage, resolve);
    });
    if (!confirmed) {
        return;
    }

    try {
      setLoading(true);

      const response = await apiPost(`/api/admin/mappings/${mapping.id}/partial-refund`, {
        refundSessions: refundSessions,
        reason: reason.trim()
      });

      if (response.success) {
        showNotification(`✅ ${refundSessions}회기 부분 환불이 완료되었습니다! ERP 시스템에 환불 거래가 자동 등록되었습니다.`, 'success');
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
        showNotification(response.message || '부분 환불 처리에 실패했습니다.', 'error');
      }

    } catch (error) {
      console.error('부분 환불 처리 실패:', error);
      showNotification('부분 환불 처리 중 오류가 발생했습니다.', 'error');
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
    if (!mapping.paymentDate) return { isValid: false, message: '결제일 정보가 없습니다.' };
    
    const paymentDate = new Date(mapping.paymentDate);
    const now = new Date();
    const daysSincePayment = Math.floor((now - paymentDate) / (1000 * 60 * 60 * 24));
    
    return {
      isValid: daysSincePayment <= 15,
      daysSincePayment,
      message: daysSincePayment <= 15 ? 
        `청약 철회 기간 내 (${daysSincePayment}일 경과, 15일 이내)` :
        `청약 철회 기간 초과 (${daysSincePayment}일 경과, 15일 초과)`
    };
  };

  const withdrawalCheck = checkWithdrawalPeriod();

  return (
    <div className="mg-v2-partial-refund-modal-overlay">
      <div className="mg-v2-partial-refund-modal">
        <div className="mg-v2-partial-refund-modal-header">
          <div className="mg-v2-modal-title-wrapper">
            <RefreshCcw size={28} className="mg-v2-modal-title-icon" />
            <h3 className="mg-v2-partial-refund-modal-title">
              부분 환불 처리
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="mg-v2-partial-refund-modal-close"
          >
            <XCircle size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 매핑 정보 */}
          <div className="mg-v2-info-box">
            <h4 className="mg-v2-info-box-title">
              <Package size={20} className="mg-v2-section-title-icon" />
              매핑 정보
            </h4>
            <div className="mg-v2-info-grid">
              <div><strong>내담자:</strong> {mapping.clientName}</div>
              <div><strong>상담사:</strong> {mapping.consultantName}</div>
              <div><strong>총 회기:</strong> {mapping.totalSessions}회</div>
              <div><strong>사용 회기:</strong> {mapping.usedSessions}회</div>
              <div><strong>남은 회기:</strong> {mapping.remainingSessions}회</div>
              <div><strong>전체 패키지 가격:</strong> {mapping.packagePrice?.toLocaleString()}원</div>
            </div>
          </div>

          {/* 최근 추가 패키지 정보 */}
          <div className="mg-v2-refund-target-box">
            <h4 className="mg-v2-refund-target-title">
              <Package size={20} className="mg-v2-section-title-icon" />
              환불 대상 (최근 추가 패키지)
            </h4>
            <div className="mg-v2-refund-package-grid">
              <div><strong>패키지명:</strong> {lastAddedPackage.packageName}</div>
              <div><strong>패키지 회기수:</strong> {lastAddedPackage.sessions}회</div>
              <div><strong>패키지 가격:</strong> {lastAddedPackage.price?.toLocaleString()}원</div>
              <div><strong>회기당 단가:</strong> {lastAddedPackage.sessions > 0 ? Math.round(lastAddedPackage.price / lastAddedPackage.sessions).toLocaleString() : 0}원</div>
            </div>
            <div className="mg-v2-refund-target-warning">
              ⚠️ 부분 환불은 가장 최근에 추가된 패키지를 우선으로 처리됩니다. (단회기, 임의 회기수도 가능)
            </div>
          </div>

          {/* 청약 철회 기간 확인 */}
          <div className={`mg-v2-withdrawal-period-box mg-v2-withdrawal-period-box--${withdrawalCheck.isValid ? 'valid' : 'invalid'}`}>
            <h4 className={`mg-v2-withdrawal-period-title mg-v2-withdrawal-period-title--${withdrawalCheck.isValid ? 'valid' : 'invalid'}`}>
              <Clock size={20} className="mg-v2-section-title-icon" />
              청약 철회 기간 확인
            </h4>
            <div className={`mg-v2-withdrawal-period-message mg-v2-withdrawal-period-message--${withdrawalCheck.isValid ? 'valid' : 'invalid'}`}>
              {withdrawalCheck.message}
            </div>
            {mapping.paymentDate && (
              <div className={`mg-v2-withdrawal-period-date mg-v2-withdrawal-period-date--${withdrawalCheck.isValid ? 'valid' : 'invalid'}`}>
                결제일: {new Date(mapping.paymentDate).toLocaleDateString('ko-KR')}
              </div>
            )}
            {!withdrawalCheck.isValid && (
              <div className="mg-v2-withdrawal-period-warning">
                <AlertTriangle size={16} className="mg-v2-icon-inline" />
                15일 초과로 청약 철회 불가능합니다. 특별한 사유가 있는 경우에만 처리하세요.
              </div>
            )}
          </div>

          {/* 환불 회기수 입력 */}
          <div className="mg-v2-form-group">
            <label className="mg-v2-form-label">
              <CreditCard size={16} className="mg-v2-form-label-icon" />
              환불할 회기수
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
              최대 {Math.min(mapping.remainingSessions, lastAddedPackage.sessions)}회까지 환불 가능 (최근 추가 패키지 기준)
            </small>
          </div>

          {/* 환불 금액 미리보기 */}
          <div className="mg-v2-refund-preview">
            <div className="mg-v2-refund-preview-title">
              <DollarSign size={20} className="mg-v2-icon-inline" />
              예상 환불 금액
            </div>
            <div className="mg-v2-refund-preview-amount">
              {refundAmount.toLocaleString()}원
            </div>
            <small className="mg-v2-refund-preview-detail">
              환불 후 남은 회기: {mapping.remainingSessions - refundSessions}회
            </small>
          </div>

          {/* 환불 사유 입력 */}
          <div className="mg-v2-refund-reason-section">
            <label className="mg-v2-refund-reason-label">
              <Clock size={16} className="mg-v2-form-label-icon" />
              환불 사유 <span className="mg-v2-form-label-required">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              placeholder="환불 사유를 상세히 입력해주세요 (최소 5자 이상)"
              rows="4"
              className="mg-v2-form-textarea"
              
              
            />
            <small className="mg-v2-refund-reason-help">
              {reason.length}/500자 (최소 5자 이상 입력)
            </small>
          </div>

          {/* 버튼 */}
          <div className="mg-v2-button-group">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="mg-v2-button mg-v2-button--secondary"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim() || reason.trim().length < 5}
              className={`mg-v2-button ${loading || !reason.trim() || reason.trim().length < 5 ? 'mg-v2-button--disabled' : 
                             !withdrawalCheck.isValid ? 'mg-v2-button--warning' : 'mg-v2-button--danger'}`}
              title={!withdrawalCheck.isValid ? '청약 철회 기간 초과 - 특별 사유 시에만 처리' : ''}
            >
              {loading ? '처리 중...' : 
               !withdrawalCheck.isValid ? `⚠️ ${refundSessions}회기 특별 환불` : 
               `${refundSessions}회기 환불 처리`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartialRefundModal;
