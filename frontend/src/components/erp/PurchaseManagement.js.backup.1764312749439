import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import { useSession } from '../../contexts/SessionContext';
import { apiGet } from '../../utils/ajax';
import SimpleLayout from '../layout/SimpleLayout';
import './ErpCommon.css';

/**
 * ERP 구매 관리 페이지
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
      const response = await apiGet('/api/erp/items');
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
      const response = await apiGet('/api/erp/purchase-requests');
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
      const response = await apiGet('/api/erp/purchase-orders');
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
      <SimpleLayout 
        title="구매 관리"
        loading={true}
        loadingText="세션 정보를 불러오는 중..."
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <SimpleLayout title="구매 관리">
        <div className="erp-error">
          <h3>로그인이 필요합니다.</h3>
          <p>구매 관리 기능을 사용하려면 로그인해주세요.</p>
        </div>
      </SimpleLayout>
    );
  }

  return (
    <SimpleLayout title="구매 관리">
      <div className="erp-system">
        <div className="erp-container">
        {/* 헤더 */}
        <div className="erp-header">
          <h1 className="erp-title">
            <i className="bi bi-cart-check"></i>
            구매 관리
          </h1>
          <p className="erp-subtitle">
            비품 구매 요청 및 주문을 관리할 수 있습니다.
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="erp-tabs">
          <button
            className={`erp-tab ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            <i className="bi bi-box"></i>
            비품 목록
          </button>
          <button
            className={`erp-tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <i className="bi bi-clipboard-check"></i>
            구매 요청
          </button>
          <button
            className={`erp-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <i className="bi bi-truck"></i>
            구매 주문
          </button>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="erp-content">
          {loading && (
            <div className="purchase-management-loading-container">
              <UnifiedLoading 
                text="데이터를 불러오는 중..."
                size="medium"
                variant="default"
                inline={true}
              />
            </div>
          )}

          {error && (
            <div className="erp-error">
              <div className="alert alert-danger" role="alert">
                <i className="bi bi-exclamation-triangle-fill"></i>
                {error}
              </div>
              <button className="btn btn-outline-primary" onClick={loadData}>
                <i className="bi bi-arrow-clockwise"></i>
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
                            <i className="bi bi-cart-plus"></i>
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
                  <div className="erp-table-container">
                    <table className="erp-table">
                      <thead>
                        <tr>
                          <th>요청 번호</th>
                          <th>아이템</th>
                          <th>수량</th>
                          <th>상태</th>
                          <th>요청일</th>
                          <th>액션</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseRequests.map((request) => (
                          <tr key={request.id}>
                            <td>#{request.id}</td>
                            <td>{request.itemName}</td>
                            <td>{request.quantity}개</td>
                            <td>
                              <span className={`erp-status ${request.status?.toLowerCase()}`}>
                                {request.status}
                              </span>
                            </td>
                            <td>{request.createdAt}</td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary">
                                <i className="bi bi-eye"></i>
                                상세
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="erp-section">
                  <h2>구매 주문</h2>
                  <div className="erp-table-container">
                    <table className="erp-table">
                      <thead>
                        <tr>
                          <th>주문 번호</th>
                          <th>공급업체</th>
                          <th>총 금액</th>
                          <th>상태</th>
                          <th>주문일</th>
                          <th>액션</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseOrders.map((order) => (
                          <tr key={order.id}>
                            <td>#{order.orderNumber}</td>
                            <td>{order.supplier}</td>
                            <td>{order.totalAmount?.toLocaleString()}원</td>
                            <td>
                              <span className={`erp-status ${order.status?.toLowerCase()}`}>
                                {order.status}
                              </span>
                            </td>
                            <td>{order.createdAt}</td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary">
                                <i className="bi bi-eye"></i>
                                상세
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      </div>
    </SimpleLayout>
  );
};

export default PurchaseManagement;
