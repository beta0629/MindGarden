import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { apiGet } from '../../utils/ajax';

const ErpPurchaseRequestPanel = ({ user }) => {
  const [purchaseData, setPurchaseData] = useState({
    pendingRequests: 0,
    approvedRequests: 0,
    totalRequests: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // ERP 구매 요청 데이터 로드
  useEffect(() => {
    const loadPurchaseData = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        console.log('🛒 ERP 구매 요청 데이터 로드 시작 - 사용자 ID:', user.id);
        
        // 상담사의 구매 요청 목록 조회
        const response = await apiGet(`/api/erp/purchase-requests/requester/${user.id}`);
        
        console.log('🛒 구매 요청 응답:', response);
        
        if (response?.success && response?.data) {
          const requests = response.data;
          
          // 상태별 카운트 계산
          const pendingCount = requests.filter(req => 
            req.status === 'PENDING' || req.status === 'SUBMITTED'
          ).length;
          
          const approvedCount = requests.filter(req => 
            req.status === 'APPROVED' || req.status === 'COMPLETED'
          ).length;
          
          setPurchaseData({
            pendingRequests: pendingCount,
            approvedRequests: approvedCount,
            totalRequests: requests.length
          });
          
          console.log('✅ ERP 구매 요청 데이터 로드 완료:', {
            pending: pendingCount,
            approved: approvedCount,
            total: requests.length
          });
        } else {
          console.warn('⚠️ 구매 요청 데이터 로드 실패, 기본값 사용');
          setPurchaseData({
            pendingRequests: 0,
            approvedRequests: 0,
            totalRequests: 0
          });
        }
      } catch (error) {
        console.error('❌ ERP 구매 요청 데이터 로드 오류:', error);
        setPurchaseData({
          pendingRequests: 0,
          approvedRequests: 0,
          totalRequests: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPurchaseData();
  }, [user?.id, user?.role]);

  return (
    <div className="mg-card">
      {/* 아코디언 헤더 */}
      <div 
        className="mg-card-header mg-cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="mg-flex mg-justify-between mg-align-center">
          <h3 className="mg-h4 mg-mb-0 mg-flex mg-align-center mg-gap-sm">
            🛒 비품 구매 요청
            {purchaseData.pendingRequests > 0 && (
              <span className="mg-badge mg-badge-warning">
                {purchaseData.pendingRequests}
              </span>
            )}
          </h3>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* 아코디언 바디 */}
      {isExpanded && (
        <div className="mg-card-body">{isLoading ? (
          <div className="mg-loading-container">
            <div className="mg-spinner"></div>
            <p>데이터 로딩 중...</p>
          </div>
        ) : (
          <>
            {/* 통계 카드 */}
            <div className="mg-dashboard-stats mg-mb-lg">
              <div className="mg-dashboard-stat-card">
                <div className="mg-dashboard-stat-icon" style={{ background: 'var(--color-warning)' }}>
                  ⏳
                </div>
                <div className="mg-dashboard-stat-content">
                  <div className="mg-dashboard-stat-value">{purchaseData.pendingRequests}</div>
                  <div className="mg-dashboard-stat-label">대기 중</div>
                </div>
              </div>

              <div className="mg-dashboard-stat-card">
                <div className="mg-dashboard-stat-icon" style={{ background: 'var(--color-success)' }}>
                  ✅
                </div>
                <div className="mg-dashboard-stat-content">
                  <div className="mg-dashboard-stat-value">{purchaseData.approvedRequests}</div>
                  <div className="mg-dashboard-stat-label">승인됨</div>
                </div>
              </div>

              <div className="mg-dashboard-stat-card">
                <div className="mg-dashboard-stat-icon" style={{ background: 'var(--color-info)' }}>
                  📋
                </div>
                <div className="mg-dashboard-stat-content">
                  <div className="mg-dashboard-stat-value">{purchaseData.totalRequests}</div>
                  <div className="mg-dashboard-stat-label">전체</div>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="quick-actions-grid">
              <button 
                className="mg-button mg-button-primary"
                onClick={() => window.location.href = '/erp/purchase-requests'}
              >
                새 구매 요청
              </button>
              <button 
                className="mg-button mg-button-ghost"
                onClick={() => window.location.href = '/erp/purchase-management'}
              >
                요청 내역
              </button>
            </div>
          </>
        )}
        </div>
      )}
    </div>
  );
};

export default ErpPurchaseRequestPanel;
