import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  ShoppingCart, 
  Clock,
  CheckCircle,
  FileText,
  Plus
} from 'lucide-react';
import { useWidget } from '../../../hooks/useWidget';
import BaseWidget from './BaseWidget';
import './ErpPurchaseRequestWidget.css';

const ErpPurchaseRequestWidget = ({ widget, user }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  // 데이터 소스 설정 (사용자별 구매 요청)
  const getDataSourceConfig = () => ({
    type: 'api',
    cache: true,
    refreshInterval: 300000, // 5분마다 새로고침 (구매 요청 상태 변경)
    url: `/api/erp/purchase-requests/requester/${user.id}`,
    params: {
      includeStatus: true
    }
  });

  // 위젯 설정에 데이터 소스 동적 설정
  const widgetWithDataSource = {
    ...widget,
    config: {
      ...widget.config,
      dataSource: getDataSourceConfig()
    }
  };

  // 표준화된 위젯 훅 사용 (구매 요청 데이터)
  const {
    data: requests,
    loading,
    error,
    hasData,
    isEmpty,
    refresh
  } = useWidget(widgetWithDataSource, user, {
    immediate: true,
    cache: true,
    retryCount: 3
  });

  // 구매 요청 통계 계산
  const calculatePurchaseStats = (requests) => {
    if (!requests || !Array.isArray(requests)) {
      return {
        pendingRequests: 0,
        approvedRequests: 0,
        totalRequests: 0
      };
    }

    const pendingCount = requests.filter(req => 
      req.status === 'PENDING' || req.status === 'SUBMITTED'
    ).length;
    
    const approvedCount = requests.filter(req => 
      req.status === 'APPROVED' || req.status === 'COMPLETED'
    ).length;
    
    return {
      pendingRequests: pendingCount,
      approvedRequests: approvedCount,
      totalRequests: requests.length
    };
  };

  const purchaseData = calculatePurchaseStats(requests);

  // 네비게이션 핸들러들
  const handleNewPurchaseRequest = () => {
    navigate('/erp/purchase-requests');
  };

  const handleViewRequestHistory = () => {
    navigate('/erp/purchase-management');
  };

  // 위젯 헤더 설정 (아코디언 방식)
  const headerConfig = {
    title: (
      <div 
        className="erp-purchase-header-title"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="erp-purchase-title-content">
          🛒 비품 구매 요청
          {purchaseData.pendingRequests > 0 && (
            <span className="erp-purchase-pending-badge">
              {purchaseData.pendingRequests}
            </span>
          )}
        </div>
        <div className="erp-purchase-expand-icon">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>
    )
  };

  // 위젯 콘텐츠 (아코디언 확장 시에만 표시)
  const renderContent = () => {
    if (!isExpanded) {
      return null;
    }

    // 빈 상태 (요청 없음)
    if (isEmpty || purchaseData.totalRequests === 0) {
      return (
        <div className="erp-purchase-empty">
          <div className="erp-purchase-empty-icon">
            <ShoppingCart size={48} />
          </div>
          <div className="erp-purchase-empty-text">
            아직 구매 요청이 없습니다
          </div>
          <div className="erp-purchase-empty-hint">
            필요한 비품이 있으시면 구매 요청을 해보세요
          </div>
          <button 
            className="erp-purchase-empty-btn"
            onClick={handleNewPurchaseRequest}
          >
            <Plus size={16} />
            새 구매 요청
          </button>
        </div>
      );
    }

    return (
      <div className="erp-purchase-content">
        {/* 통계 카드 */}
        <div className="erp-purchase-stats">
          <div className="erp-purchase-stat-card pending">
            <div className="erp-purchase-stat-icon">
              <Clock size={24} />
            </div>
            <div className="erp-purchase-stat-content">
              <div className="erp-purchase-stat-value">
                {purchaseData.pendingRequests}
              </div>
              <div className="erp-purchase-stat-label">대기 중</div>
            </div>
          </div>

          <div className="erp-purchase-stat-card approved">
            <div className="erp-purchase-stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="erp-purchase-stat-content">
              <div className="erp-purchase-stat-value">
                {purchaseData.approvedRequests}
              </div>
              <div className="erp-purchase-stat-label">승인됨</div>
            </div>
          </div>

          <div className="erp-purchase-stat-card total">
            <div className="erp-purchase-stat-icon">
              <FileText size={24} />
            </div>
            <div className="erp-purchase-stat-content">
              <div className="erp-purchase-stat-value">
                {purchaseData.totalRequests}
              </div>
              <div className="erp-purchase-stat-label">전체</div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="erp-purchase-actions">
          <button 
            className="erp-purchase-action-btn primary"
            onClick={handleNewPurchaseRequest}
          >
            <Plus size={16} />
            새 구매 요청
          </button>
          <button 
            className="erp-purchase-action-btn secondary"
            onClick={handleViewRequestHistory}
          >
            <FileText size={16} />
            요청 내역
          </button>
        </div>
      </div>
    );
  };

  return (
    <BaseWidget
      widget={widget}
      user={user}
      loading={loading}
      error={error}
      hasData={hasData}
      onRefresh={refresh}
      headerConfig={headerConfig}
      className="erp-purchase-request-widget"
      isAccordion={true}
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default ErpPurchaseRequestWidget;
