import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import MGCard from '../common/MGCard';
import Button from '../ui/Button/Button';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import { Package, FileText, ShoppingCart, RefreshCw, Eye } from 'lucide-react';
import './ErpCommon.css';
import SafeErrorDisplay from '../common/SafeErrorDisplay';

/**
 * ERP 구매 관리 페이지
/**
 * 비품 구매 요청 및 주문 관리
 */
const PurchaseManagement = () => {
  const { user, isLoggedIn, isLoading: sessionLoading } = useSession();
  const [activeTab, setActiveTab] = useState('items');
  const [items, setItems] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 데이터 로드
  useEffect(() => {
    if (!sessionLoading && isLoggedIn && user?.id) {
      loadData();
    }
  }, [sessionLoading, isLoggedIn, user?.id, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      switch (activeTab) {
        case 'items':
          await loadItems();
          break;
        case 'requests':
          await loadPurchaseRequests();
          break;
        case 'orders':
          await loadPurchaseOrders();
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('데이터 로드 실패:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const response = await apiGet('/api/v1/erp/items');
      if (response.success) {
        setItems(response.data || []);
      } else {
        setError(response.message || '아이템 목록을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('아이템 로드 실패:', err);
      setError('아이템 목록을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const loadPurchaseRequests = async () => {
    try {
      const response = await apiGet('/api/v1/erp/purchase-requests');
      if (response.success) {
        setPurchaseRequests(response.data || []);
      } else {
        setError(response.message || '구매 요청 목록을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('구매 요청 로드 실패:', err);
      setError('구매 요청 목록을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      const response = await apiGet('/api/v1/erp/purchase-orders');
      if (response.success) {
        setPurchaseOrders(response.data || []);
      } else {
        setError(response.message || '구매 주문 목록을 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('구매 주문 로드 실패:', err);
      setError('구매 주문 목록을 불러오는 중 오류가 발생했습니다.');
    }
  };

  if (sessionLoading) {
    return (
      <AdminCommonLayout title="구매 관리" loading={true} loadingText="세션 정보를 불러오는 중...">
        <div />
      </AdminCommonLayout>
    );
  }

  if (!isLoggedIn) {
    return (
      <AdminCommonLayout title="구매 관리">
        <div className="erp-error">
          <h3>로그인이 필요합니다.</h3>
          <p>구매 관리 기능을 사용하려면 로그인해주세요.</p>
        </div>
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="구매 관리">
      <ContentArea className="erp-system mg-v2-content-area">
        <ContentHeader
          title="구매 관리"
          subtitle="비품 구매 요청 및 주문을 관리할 수 있습니다."
        />
        <div className="erp-container">
        {/* 탭 네비게이션 */}
        <div className="erp-tabs">
          <button
            className={`erp-tab ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            <Package size={18} aria-hidden />
            비품 목록
          </button>
          <button
            className={`erp-tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <FileText size={18} aria-hidden />
            구매 요청
          </button>
          <button
            className={`erp-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingCart size={18} aria-hidden />
            구매 주문
          </button>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="erp-content">
          {loading && (
            <div className="purchase-management-loading-container">
              <UnifiedLoading type="inline" text="로딩 중..." />
            </div>
          )}

          {error && (
            <div className="erp-error">
              <SafeErrorDisplay error={error} variant="banner" />
              <button className="btn btn-outline-primary" onClick={loadData}>
                <RefreshCw size={18} aria-hidden />
                다시 시도
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {activeTab === 'items' && (
                <div className="erp-section">
                  <h2>비품 목록</h2>
                  <div className="erp-grid">
                    {items.map((item) => (
                      <div key={item.id} className="erp-card">
                        <div className="erp-card-header">
                          <h3>{item.name}</h3>
                          <span className={`erp-status ${item.stockQuantity > 10 ? 'success' : 'warning'}`}>
                            {item.stockQuantity > 10 ? '충분' : '부족'}
                          </span>
                        </div>
                        <div className="erp-card-body">
                          <p className="erp-description">{item.description}</p>
                          <div className="erp-details">
                            <div className="erp-detail">
                              <span className="erp-label">가격:</span>
                              <span className="erp-value">{item.unitPrice?.toLocaleString()}원</span>
                            </div>
                            <div className="erp-detail">
                              <span className="erp-label">재고:</span>
                              <span className="erp-value">{item.stockQuantity}개</span>
                            </div>
                            <div className="erp-detail">
                              <span className="erp-label">카테고리:</span>
                              <span className="erp-value">{item.category}</span>
                            </div>
                            <div className="erp-detail">
                              <span className="erp-label">공급업체:</span>
                              <span className="erp-value">{item.supplier}</span>
                            </div>
                          </div>
                        </div>
                        <div className="erp-card-footer">
                          <button className="btn btn-primary btn-sm">
                            <ShoppingCart size={16} aria-hidden />
                            구매 요청
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'requests' && (
                <div className="erp-section">
                  <h2>구매 요청</h2>
                  {/* 구매 요청 카드 그리드 (표준화 원칙: 테이블 → 카드 전환) */}
                  <div className="mg-purchase-request-cards-grid">
                    {purchaseRequests.map((request) => (
                      <MGCard 
                        key={request.id}
                        variant="default"
                        className="mg-purchase-request-card"
                      >
                        <div className="mg-purchase-request-card__header">
                          <div className="mg-purchase-request-card__id">#{request.id}</div>
                          <div className="mg-purchase-request-card__date">{request.createdAt}</div>
                        </div>
                        
                        <div className="mg-purchase-request-card__body">
                          <div className="mg-purchase-request-card__field">
                            <span className="mg-purchase-request-card__label">아이템</span>
                            <span className="mg-purchase-request-card__value">{request.itemName}</span>
                          </div>
                          <div className="mg-purchase-request-card__field">
                            <span className="mg-purchase-request-card__label">수량</span>
                            <span className="mg-purchase-request-card__value">{request.quantity}개</span>
                          </div>
                          <div className="mg-purchase-request-card__field">
                            <span className="mg-purchase-request-card__label">상태</span>
                            <span className={`erp-status ${request.status?.toLowerCase()}`}>
                              {request.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mg-purchase-request-card__footer">
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => {}}
                            preventDoubleClick={true}
                          >
                            <Eye size={16} aria-hidden /> 상세
                          </Button>
                        </div>
                      </MGCard>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="erp-section">
                  <h2>구매 주문</h2>
                  {/* 구매 주문 카드 그리드 (표준화 원칙: 테이블 → 카드 전환) */}
                  <div className="mg-purchase-order-cards-grid">
                    {purchaseOrders.map((order) => (
                      <MGCard 
                        key={order.id}
                        variant="default"
                        className="mg-purchase-order-card"
                      >
                        <div className="mg-purchase-order-card__header">
                          <div className="mg-purchase-order-card__id">#{order.orderNumber}</div>
                          <div className="mg-purchase-order-card__date">{order.createdAt}</div>
                        </div>
                        
                        <div className="mg-purchase-order-card__body">
                          <div className="mg-purchase-order-card__field">
                            <span className="mg-purchase-order-card__label">공급업체</span>
                            <span className="mg-purchase-order-card__value">{order.supplier}</span>
                          </div>
                          <div className="mg-purchase-order-card__field">
                            <span className="mg-purchase-order-card__label">총 금액</span>
                            <span className="mg-purchase-order-card__value mg-purchase-order-card__value--amount">
                              {order.totalAmount?.toLocaleString()}원
                            </span>
                          </div>
                          <div className="mg-purchase-order-card__field">
                            <span className="mg-purchase-order-card__label">상태</span>
                            <span className={`erp-status ${order.status?.toLowerCase()}`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mg-purchase-order-card__footer">
                          <Button
                            variant="outline"
                            size="small"
                            onClick={() => {}}
                            preventDoubleClick={true}
                          >
                            <Eye size={16} aria-hidden /> 상세
                          </Button>
                        </div>
                      </MGCard>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default PurchaseManagement;
