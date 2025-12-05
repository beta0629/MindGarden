import React, { useState, useEffect } from 'react';
import './ConsultantTransferHistory.css';

 * 상담사 변경 이력 컴포넌트
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {number} props.clientId - 내담자 ID
 * @param {boolean} props.isOpen - 이력 표시 상태
 * @param {Function} props.onClose - 이력 닫기 함수
 */
const ConsultantTransferHistory = ({ clientId, isOpen, onClose }) => {
  const [transferHistory, setTransferHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && clientId) {
      loadTransferHistory();
    }
  }, [isOpen, clientId]);

  const loadTransferHistory = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/admin/clients/${clientId}/transfer-history`);
      const data = await response.json();
      
      if (data.success) {
        setTransferHistory(data.data);
      } else {
        setError(data.message || '이력 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('상담사 변경 이력 로드 실패:', error);
      setError('이력 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'TERMINATED':
        return 'transfer-status-badge transfer-status-terminated';
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'ACTIVE':
        return 'transfer-status-badge transfer-status-active';
      default:
        return 'transfer-status-badge transfer-status-pending';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'TERMINATED':
        return '종료됨';
      // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
      case 'ACTIVE':
        return '활성';
      default:
        return '대기중';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="transfer-history-overlay">
      <div className="transfer-history-modal">
        <div className="transfer-history-header">
          <h2 className="transfer-history-title">상담사 변경 이력</h2>
          <button 
            type="button" 
            className="transfer-history-close"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        
        <div className="transfer-history-content">
          {loading ? (
            <div className="transfer-history-loading">
              <div className="transfer-loading-spinner"></div>
              <p>이력을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="transfer-history-error">
              <p>❌ {error}</p>
              <button 
                className="transfer-btn transfer-btn-primary"
                onClick={loadTransferHistory}
              >
                다시 시도
              </button>
            </div>
          ) : transferHistory.length === 0 ? (
            <div className="transfer-history-empty">
              <p>📝 상담사 변경 이력이 없습니다.</p>
            </div>
          ) : (
            <div className="transfer-history-list">
              {transferHistory.map((history, index) => (
                <div key={history.id || index} className="transfer-history-item">
                  <div className="transfer-history-item-header">
                    <div className="transfer-history-item-info">
                      <h3 className="transfer-history-consultant-name">
                        {history.consultant?.name || '알 수 없음'}
                      </h3>
                      <span className={getStatusBadgeClass(history.status)}>
                        {getStatusText(history.status)}
                      </span>
                    </div>
                    <div className="transfer-history-item-dates">
                      <span className="transfer-history-date">
                        시작: {formatDate(history.startDate)}
                      </span>
                      <span className="transfer-history-date">
                        종료: {formatDate(history.endDate)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="transfer-history-item-content">
                    <div className="transfer-history-details">
                      <div className="transfer-history-detail-item">
                        <span className="transfer-history-detail-label">상담사 이메일:</span>
                        <span className="transfer-history-detail-value">
                          {history.consultant?.email || '-'}
                        </span>
                      </div>
                      
                      <div className="transfer-history-detail-item">
                        <span className="transfer-history-detail-label">종료 사유:</span>
                        <span className="transfer-history-detail-value">
                          {history.terminationReason || '-'}
                        </span>
                      </div>
                      
                      <div className="transfer-history-detail-item">
                        <span className="transfer-history-detail-label">처리자:</span>
                        <span className="transfer-history-detail-value">
                          {history.terminatedBy || '-'}
                        </span>
                      </div>
                      
                      <div className="transfer-history-detail-item">
                        <span className="transfer-history-detail-label">처리 일시:</span>
                        <span className="transfer-history-detail-value">
                          {formatDate(history.terminatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="transfer-history-footer">
          <button
            type="button"
            className="transfer-btn transfer-btn-secondary"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultantTransferHistory;
