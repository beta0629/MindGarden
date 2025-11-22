/**
 * Purchase Request Widget
 * 구매 요청 목록을 표시하는 범용 위젯
 * ErpPurchaseRequestPanel을 기반으로 범용화
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../../../utils/ajax';
import UnifiedLoading from '../../common/UnifiedLoading';
import './Widget.css';

const PurchaseRequestWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [purchaseData, setPurchaseData] = useState({
    pendingRequests: 0,
    approvedRequests: 0,
    totalRequests: 0
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  const userId = user?.id || config.userId;
  const maxItems = config.maxItems || 5;
  
  useEffect(() => {
    if (dataSource.type === 'api' && dataSource.url && userId) {
      loadPurchaseData();
      
      if (dataSource.refreshInterval) {
        const interval = setInterval(loadPurchaseData, dataSource.refreshInterval);
        return () => clearInterval(interval);
      }
    } else if (config.purchaseData) {
      setPurchaseData(config.purchaseData);
      setRequests(config.requests || []);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [userId]);
  
  const loadPurchaseData = async () => {
    try {
      setLoading(true);
      
      const url = dataSource.url || `/api/erp/purchase-requests/requester/${userId}`;
      const response = await apiGet(url);
      
      if (response && response.data) {
        const requestsList = Array.isArray(response.data) ? response.data : [];
        
        const pendingCount = requestsList.filter(req => 
          req.status === 'PENDING' || req.status === 'SUBMITTED'
        ).length;
        
        const approvedCount = requestsList.filter(req => 
          req.status === 'APPROVED' || req.status === 'COMPLETED'
        ).length;
        
        setPurchaseData({
          pendingRequests: pendingCount,
          approvedRequests: approvedCount,
          totalRequests: requestsList.length
        });
        
        setRequests(requestsList.slice(0, maxItems));
      }
    } catch (err) {
      console.error('PurchaseRequestWidget 데이터 로드 실패:', err);
      setPurchaseData({ pendingRequests: 0, approvedRequests: 0, totalRequests: 0 });
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRequestClick = (request) => {
    if (config.requestUrl) {
      navigate(config.requestUrl.replace('{requestId}', request.id));
    } else {
      navigate(`/erp/purchase-requests/${request.id}`);
    }
  };
  
  const handleViewAll = () => {
    if (config.viewAllUrl) {
      navigate(config.viewAllUrl);
    } else {
      navigate('/erp/purchase-requests');
    }
  };
  
  const handleCreateRequest = () => {
    if (config.createUrl) {
      navigate(config.createUrl);
    } else {
      navigate('/erp/purchase-requests/create');
    }
  };
  
  if (loading && purchaseData.totalRequests === 0) {
    return (
      <div className="widget widget-purchase-request">
        <UnifiedLoading message="로딩 중..." />
      </div>
    );
  }
  
  return (
    <div className="widget widget-purchase-request">
      <div 
        className="widget-header widget-header-clickable"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="widget-title">
          <i className="bi bi-cart"></i>
          {config.title || '구매 요청'}
          {purchaseData.pendingRequests > 0 && (
            <span className="widget-badge widget-badge-warning">
              {purchaseData.pendingRequests}
            </span>
          )}
        </div>
        <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
      </div>
      
      {isExpanded && (
        <div className="widget-body">
          <div className="purchase-request-summary">
            <div className="purchase-summary-item">
              <div className="purchase-summary-label">대기</div>
              <div className="purchase-summary-value">{purchaseData.pendingRequests}</div>
            </div>
            <div className="purchase-summary-item">
              <div className="purchase-summary-label">승인</div>
              <div className="purchase-summary-value">{purchaseData.approvedRequests}</div>
            </div>
            <div className="purchase-summary-item">
              <div className="purchase-summary-label">전체</div>
              <div className="purchase-summary-value">{purchaseData.totalRequests}</div>
            </div>
          </div>
          
          {requests.length > 0 ? (
            <div className="purchase-request-list">
              {requests.map((request, index) => (
                <div
                  key={request.id || index}
                  className="purchase-request-item"
                  onClick={() => handleRequestClick(request)}
                >
                  <div className="purchase-request-info">
                    <div className="purchase-request-title">{request.title || request.itemName}</div>
                    <div className="purchase-request-details">
                      {request.quantity && <span>수량: {request.quantity}</span>}
                      {request.amount && <span>금액: ₩{request.amount.toLocaleString()}</span>}
                    </div>
                    {request.requestDate && (
                      <div className="purchase-request-date">
                        요청일: {new Date(request.requestDate).toLocaleDateString('ko-KR')}
                      </div>
                    )}
                  </div>
                  <div className={`purchase-request-status status-${request.status?.toLowerCase()}`}>
                    {request.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="widget-empty">
              <i className="bi bi-cart-x"></i>
              <p>{config.emptyMessage || '구매 요청이 없습니다'}</p>
            </div>
          )}
          
          <div className="purchase-request-actions">
            <button className="widget-btn widget-btn-primary" onClick={handleCreateRequest}>
              <i className="bi bi-plus-circle"></i> 새 요청
            </button>
            {config.viewAllUrl && (
              <button className="widget-btn" onClick={handleViewAll}>
                전체보기 →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequestWidget;

