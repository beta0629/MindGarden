import React, { useState, useEffect } from 'react';

import { apiGet } from '../../utils/ajax';
import MGButton from '../common/MGButton';
const ErpPurchaseRequestPanel = ({ user }) => {
  const [purchaseData, setPurchaseData] = useState({
    pendingRequests: 0,
    approvedRequests: 0,
    totalRequests: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const loadPurchaseData = async() => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const response = await apiGet(`/api/v1/erp/purchase-requests/requester/${user.id}`);
        
        if (response?.success && response?.data) {
          const requests = response.data;
          
          const pendingCount = requests.filter(req => 
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            req.status === 'PENDING' || req.status === 'SUBMITTED'
          ).length;
          
          const approvedCount = requests.filter(req => 
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. getCommonCodes('STATUS_GROUP') 사용
            req.status === 'APPROVED' || req.status === 'COMPLETED'
          ).length;
          
          setPurchaseData({
            pendingRequests: pendingCount,
            approvedRequests: approvedCount,
            totalRequests: requests.length
          });
          
        } else {
          console.warn('구매 요청 데이터 로드 실패, 기본값 사용');
          setPurchaseData({
            pendingRequests: 0,
            approvedRequests: 0,
            totalRequests: 0
          });
        }
      } catch (error) {
        console.error('ERP 구매 요청 데이터 로드 오류:', error);
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
            
            비품 구매 요청
            {purchaseData.pendingRequests > 0 && (
              <span className="mg-badge mg-badge-warning">
                {purchaseData.pendingRequests}
              </span>
            )}
          </h3>
          {isExpanded ? '접기' : '펼치기'}
        </div>
      </div>

      {/* 아코디언 바디 */}
      {isExpanded && (
        <div className="mg-card-body">{isLoading ? (
          <div className="mg-loading-container">
            <div className="mg-spinner" />
            <p>데이터 로딩 중...</p>
          </div>
        ) : (
          <>
            {/* 통계 카드 */}
            <div className="mg-dashboard-stats mg-mb-lg">
              <div className="mg-dashboard-stat-card">
                <div className="mg-dashboard-stat-icon" style={{ background: 'var(--color-warning)' }} />
                <div className="mg-dashboard-stat-content">
                  <div className="mg-dashboard-stat-value">{purchaseData.pendingRequests}</div>
                  <div className="mg-dashboard-stat-label">대기 중</div>
                </div>
              </div>

              <div className="mg-dashboard-stat-card">
                <div className="mg-dashboard-stat-icon" style={{ background: 'var(--color-success)' }} />
                <div className="mg-dashboard-stat-content">
                  <div className="mg-dashboard-stat-value">{purchaseData.approvedRequests}</div>
                  <div className="mg-dashboard-stat-label">승인됨</div>
                </div>
              </div>

              <div className="mg-dashboard-stat-card">
                <div className="mg-dashboard-stat-icon" style={{ background: 'var(--color-info)' }} />
                <div className="mg-dashboard-stat-content">
                  <div className="mg-dashboard-stat-value">{purchaseData.totalRequests}</div>
                  <div className="mg-dashboard-stat-label">전체</div>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="quick-actions-grid">
              <MGButton
                variant="primary"
                onClick={() => { window.location.href = '/erp/purchase-requests'; }}
              >
                새 구매 요청
              </MGButton>
              <MGButton
                variant="outline"
                onClick={() => { window.location.href = '/erp/purchase-management'; }}
              >
                요청 내역
              </MGButton>
            </div>
          </>
        )}
        </div>
      )}
    </div>
  );
};

export default ErpPurchaseRequestPanel;
