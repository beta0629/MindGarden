import React, { useState } from 'react';
import { apiPost } from '../../../utils/ajax';
import { showNotification } from '../../../utils/notification';

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

    if (!window.confirm(confirmMessage)) {
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '2px solid #e9ecef'
        }}>
          <h3 style={{ margin: 0, color: '#dc3545', fontWeight: 'bold' }}>
            💸 부분 환불 처리
          </h3>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: '#6c757d'
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 매핑 정보 */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#495057' }}>📋 매핑 정보</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
              <div><strong>내담자:</strong> {mapping.clientName}</div>
              <div><strong>상담사:</strong> {mapping.consultantName}</div>
              <div><strong>총 회기:</strong> {mapping.totalSessions}회</div>
              <div><strong>사용 회기:</strong> {mapping.usedSessions}회</div>
              <div><strong>남은 회기:</strong> {mapping.remainingSessions}회</div>
              <div><strong>전체 패키지 가격:</strong> {mapping.packagePrice?.toLocaleString()}원</div>
            </div>
          </div>

          {/* 최근 추가 패키지 정보 */}
          <div style={{
            backgroundColor: '#fff3cd',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ffeaa7'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#856404' }}>📦 환불 대상 (최근 추가 패키지)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
              <div><strong>패키지명:</strong> {lastAddedPackage.packageName}</div>
              <div><strong>패키지 회기수:</strong> {lastAddedPackage.sessions}회</div>
              <div><strong>패키지 가격:</strong> {lastAddedPackage.price?.toLocaleString()}원</div>
              <div><strong>회기당 단가:</strong> {lastAddedPackage.sessions > 0 ? Math.round(lastAddedPackage.price / lastAddedPackage.sessions).toLocaleString() : 0}원</div>
            </div>
            <div style={{ 
              marginTop: '8px', 
              padding: '8px', 
              backgroundColor: '#ffeaa7', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#856404'
            }}>
              ⚠️ 부분 환불은 가장 최근에 추가된 패키지를 우선으로 처리됩니다. (단회기, 임의 회기수도 가능)
            </div>
          </div>

          {/* 청약 철회 기간 확인 */}
          <div style={{
            backgroundColor: withdrawalCheck.isValid ? '#d4edda' : '#f8d7da',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: `1px solid ${withdrawalCheck.isValid ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              color: withdrawalCheck.isValid ? '#155724' : '#721c24' 
            }}>
              ⏰ 청약 철회 기간 확인
            </h4>
            <div style={{ 
              fontSize: '14px', 
              color: withdrawalCheck.isValid ? '#155724' : '#721c24',
              fontWeight: '600'
            }}>
              {withdrawalCheck.message}
            </div>
            {mapping.paymentDate && (
              <div style={{ 
                fontSize: '12px', 
                color: withdrawalCheck.isValid ? '#155724' : '#721c24',
                marginTop: '4px'
              }}>
                결제일: {new Date(mapping.paymentDate).toLocaleDateString('ko-KR')}
              </div>
            )}
            {!withdrawalCheck.isValid && (
              <div style={{ 
                marginTop: '8px', 
                padding: '8px', 
                backgroundColor: '#f5c6cb', 
                borderRadius: '4px',
                fontSize: '12px',
                color: '#721c24'
              }}>
                ❌ 15일 초과로 청약 철회 불가능합니다. 특별한 사유가 있는 경우에만 처리하세요.
              </div>
            )}
          </div>

          {/* 환불 회기수 입력 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#495057'
            }}>
              💰 환불할 회기수
            </label>
            <input
              type="number"
              min="1"
              max={Math.min(mapping.remainingSessions, lastAddedPackage.sessions)}
              value={refundSessions}
              onChange={(e) => setRefundSessions(parseInt(e.target.value) || 1)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
            />
            <small style={{ color: '#6c757d', fontSize: '12px' }}>
              최대 {Math.min(mapping.remainingSessions, lastAddedPackage.sessions)}회까지 환불 가능 (최근 추가 패키지 기준)
            </small>
          </div>

          {/* 환불 금액 미리보기 */}
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #bbdefb'
          }}>
            <div style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: '4px' }}>
              💵 예상 환불 금액
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2' }}>
              {refundAmount.toLocaleString()}원
            </div>
            <small style={{ color: '#1976d2', fontSize: '12px' }}>
              환불 후 남은 회기: {mapping.remainingSessions - refundSessions}회
            </small>
          </div>

          {/* 환불 사유 입력 */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: 'bold',
              color: '#495057'
            }}>
              📝 환불 사유 <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              placeholder="환불 사유를 상세히 입력해주세요 (최소 5자 이상)"
              rows="4"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
            />
            <small style={{ color: '#6c757d', fontSize: '12px' }}>
              {reason.length}/500자 (최소 5자 이상 입력)
            </small>
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                padding: '12px 20px',
                border: '2px solid #6c757d',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#6c757d',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim() || reason.trim().length < 5}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: loading || !reason.trim() || reason.trim().length < 5 ? '#6c757d' : 
                             !withdrawalCheck.isValid ? '#ffc107' : '#dc3545',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading || !reason.trim() || reason.trim().length < 5 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
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
