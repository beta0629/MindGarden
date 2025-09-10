import React, { useState, useEffect } from 'react';
import { SUMMARY_PANELS_CSS } from '../../constants/css';
import { apiGet } from '../../utils/ajax';

const ErpPurchaseRequestPanel = ({ user }) => {
  const [purchaseData, setPurchaseData] = useState({
    pendingRequests: 0,
    approvedRequests: 0,
    totalRequests: 0
  });
  const [isLoading, setIsLoading] = useState(true);

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

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <div className={`${SUMMARY_PANELS_CSS.PANEL} erp-purchase-requests`}>
        <div className={SUMMARY_PANELS_CSS.PANEL_HEADER}>
          <h3 className={SUMMARY_PANELS_CSS.PANEL_TITLE}>
            <i className={`${SUMMARY_PANELS_CSS.PANEL_ICON} bi bi-cart-plus`}></i>
            비품 구매 요청
          </h3>
        </div>
        <div className={SUMMARY_PANELS_CSS.PANEL_CONTENT}>
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            color: '#6c757d' 
          }}>
            <i className="bi bi-hourglass-split" style={{ fontSize: '1.5em' }}></i>
            <div style={{ marginTop: '8px' }}>데이터 로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${SUMMARY_PANELS_CSS.PANEL} erp-purchase-requests`}>
      <div className={SUMMARY_PANELS_CSS.PANEL_HEADER}>
        <h3 className={SUMMARY_PANELS_CSS.PANEL_TITLE}>
          <i className={`${SUMMARY_PANELS_CSS.PANEL_ICON} bi bi-cart-plus`}></i>
          비품 구매 요청
        </h3>
      </div>
      <div className={SUMMARY_PANELS_CSS.PANEL_CONTENT}>
        <div className={SUMMARY_PANELS_CSS.SUMMARY_ITEM}>
          <div className={SUMMARY_PANELS_CSS.SUMMARY_ICON}>
            <i className="bi bi-clock-history"></i>
          </div>
          <div className={SUMMARY_PANELS_CSS.SUMMARY_INFO}>
            <div className={SUMMARY_PANELS_CSS.SUMMARY_LABEL}>대기 중인 요청</div>
            <div className={SUMMARY_PANELS_CSS.SUMMARY_VALUE}>
              <div style={{ fontSize: '1.1em', fontWeight: '600', color: '#495057' }}>
                {purchaseData.pendingRequests}건
              </div>
              <div style={{ 
                fontSize: '0.85em', 
                color: '#6c757d', 
                marginTop: '6px',
                padding: '6px 10px',
                backgroundColor: '#fff3cd',
                borderRadius: '6px',
                border: '1px solid #ffeaa7',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                관리자 승인 대기 중
              </div>
            </div>
          </div>
        </div>
        
        <div className={SUMMARY_PANELS_CSS.SUMMARY_ITEM}>
          <div className={SUMMARY_PANELS_CSS.SUMMARY_ICON}>
            <i className="bi bi-check-circle"></i>
          </div>
          <div className={SUMMARY_PANELS_CSS.SUMMARY_INFO}>
            <div className={SUMMARY_PANELS_CSS.SUMMARY_LABEL}>승인된 요청</div>
            <div className={SUMMARY_PANELS_CSS.SUMMARY_VALUE}>
              <div style={{ fontSize: '1.1em', fontWeight: '600', color: '#495057' }}>
                {purchaseData.approvedRequests}건
              </div>
              <div style={{ 
                fontSize: '0.85em', 
                color: '#6c757d', 
                marginTop: '6px',
                padding: '6px 10px',
                backgroundColor: '#d1edff',
                borderRadius: '6px',
                border: '1px solid #74c0fc',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                이번 달 승인된 요청
              </div>
            </div>
          </div>
        </div>
        
        <div className={SUMMARY_PANELS_CSS.SUMMARY_ITEM}>
          <div className={SUMMARY_PANELS_CSS.SUMMARY_ICON}>
            <i className="bi bi-list-ul"></i>
          </div>
          <div className={SUMMARY_PANELS_CSS.SUMMARY_INFO}>
            <div className={SUMMARY_PANELS_CSS.SUMMARY_LABEL}>전체 요청</div>
            <div className={SUMMARY_PANELS_CSS.SUMMARY_VALUE}>
              <div style={{ fontSize: '1.1em', fontWeight: '600', color: '#495057' }}>
                {purchaseData.totalRequests}건
              </div>
              <div style={{ 
                fontSize: '0.85em', 
                color: '#6c757d', 
                marginTop: '6px',
                padding: '6px 10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #dee2e6',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                지금까지 요청한 총 건수
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginTop: '16px',
          flexWrap: 'wrap'
        }}>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => window.location.href = '/erp/purchase-requests'}
            style={{ 
              flex: '1',
              minWidth: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <i className="bi bi-plus-circle"></i> 새 구매 요청
          </button>
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={() => window.location.href = '/erp/dashboard'}
            style={{ 
              flex: '1',
              minWidth: '140px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <i className="bi bi-list-ul"></i> 요청 내역
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErpPurchaseRequestPanel;
