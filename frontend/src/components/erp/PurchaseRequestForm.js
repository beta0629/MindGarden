import React, { useState, useEffect } from 'react';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ERP_MENU_ITEMS } from '../dashboard-v2/constants/menuItems';
import ErpCard from './common/ErpCard';
import ErpButton from './common/ErpButton';
import ErpHeader from './common/ErpHeader';
import ErpModal from './common/ErpModal';
import { useSession } from '../../hooks/useSession';

/**
 * 구매 요청 폼 컴포넌트
 */
const PurchaseRequestForm = () => {
  const { user } = useSession();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]); // 여러 아이템 선택을 위한 배열
  const [itemQuantities, setItemQuantities] = useState({}); // 각 아이템별 수량
  const [reason, setReason] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/erp/items');
      const data = await response.json();
      
      if (data.success) {
        setItems(data.data || []);
      } else {
        setError('아이템 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('아이템 로드 실패:', error);
      setError('아이템 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (item) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id);
    
    if (isSelected) {
      // 이미 선택된 아이템이면 제거
      setSelectedItems(prev => prev.filter(selected => selected.id !== item.id));
      setItemQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[item.id];
        return newQuantities;
      });
    } else {
      // 새로운 아이템 추가
      setSelectedItems(prev => [...prev, item]);
      setItemQuantities(prev => ({
        ...prev,
        [item.id]: 1
      }));
    }
  };

  const handleQuantityChange = (itemId, quantity) => {
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, quantity)
    }));
  };

  const isItemSelected = (item) => {
    return selectedItems.some(selected => selected.id === item.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      setError('최소 하나의 아이템을 선택해주세요.');
      return;
    }

    // 모든 선택된 아이템의 수량 검증
    for (const item of selectedItems) {
      const quantity = itemQuantities[item.id] || 1;
      if (quantity < 1) {
        setError(`${item.name}의 수량은 1개 이상이어야 합니다.`);
        return;
      }
    }

    try {
      setLoading(true);
      setError('');

      // 현재 사용자 ID (세션에서 가져옴)
      const requesterId = user?.id;
      
      if (!requesterId) {
        setError('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      // 여러 아이템에 대해 구매 요청 생성
      const requests = selectedItems.map(item => ({
        requesterId: requesterId,
        itemId: item.id,
        quantity: itemQuantities[item.id] || 1,
        reason: reason
      }));

      // 각 요청을 순차적으로 처리
      const results = [];
      for (const request of requests) {
        const response = await fetch('/api/v1/erp/purchase-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            requesterId: request.requesterId.toString(),
            itemId: request.itemId.toString(),
            quantity: request.quantity.toString(),
            reason: request.reason
          })
        });

        const data = await response.json();
        results.push(data);
      }

      // 모든 요청이 성공했는지 확인
      const allSuccess = results.every(result => result.success);
      
      if (allSuccess) {
        setShowSuccessModal(true);
        // 폼 초기화
        setSelectedItems([]);
        setItemQuantities({});
        setReason('');
      } else {
        const failedItems = results
          .map((result, index) => result.success ? null : selectedItems[index].name)
          .filter(Boolean);
        setError(`다음 아이템의 구매 요청에 실패했습니다: ${failedItems.join(', ')}`);
      }
    } catch (error) {
      console.error('구매 요청 생성 실패:', error);
      setError('구매 요청 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  if (loading && items.length === 0) {
    return (
      <AdminCommonLayout title="구매 요청" loading={true} loadingText="로딩중...">
        <div />
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="구매 요청">
      <div className="purchase-request-form-container">
        <ErpHeader
          title="구매 요청"
          subtitle="필요한 비품을 요청하세요"
          actions={
            <ErpButton
              variant="secondary"
              onClick={() => window.history.back()}
            >
              뒤로가기
            </ErpButton>
          }
        />

      <div className="mg-v2-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <ErpCard title="구매 요청서 작성">
          <form onSubmit={handleSubmit}>
            {/* 아이템 선택 */}
            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label">
                아이템 선택 *
              </label>
              <div className="mg-v2-form-grid" style={{ maxHeight: '400px', overflowY: 'auto', padding: '4px', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleItemSelect(item)}
                    style={{
                      padding: '20px',
                      border: isItemSelected(item) ? '2px solid var(--mg-primary-500)' : '1px solid #e9ecef',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff -> var(--mg-custom-fff)
                      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f8f9ff -> var(--mg-custom-f8f9ff)
                      backgroundColor: isItemSelected(item) ? '#f8f9ff' : '#fff',
                      transition: 'all 0.3s ease',
                      boxShadow: isItemSelected(item) 
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 123, 255, 0.15) -> var(--mg-custom-color)
                        ? '0 4px 12px rgba(0, 123, 255, 0.15)' 
                        : '0 2px 4px var(--mg-shadow-light)',
                      transform: isItemSelected(item) ? 'translateY(-2px)' : 'none',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isItemSelected(item)) {
                        e.target.style.boxShadow = '0 4px 8px var(--mg-shadow-medium)';
                        e.target.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isItemSelected(item)) {
                        e.target.style.boxShadow = '0 2px 4px var(--mg-shadow-light)';
                        e.target.style.transform = 'none';
                      }
                    }}
                  >
                    {/* 선택 표시 */}
                    {isItemSelected(item) && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'var(--mg-primary-500)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'bold'
                      }}>
                        ✓
                      </div>
                    )}
                    
                    {/* 아이템명 */}
                    <div style={{ 
                      fontWeight: '700', 
                      fontSize: 'var(--font-size-base)',
                      marginBottom: '8px',
                      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #212529 -> var(--mg-custom-212529)
                      color: '#212529',
                      lineHeight: '1.3'
                    }}>
                      {item.name}
                    </div>
                    
                    {/* 카테고리 */}
                    <div style={{ 
                      fontSize: 'var(--font-size-xs)', 
                      color: 'var(--mg-secondary-500)', 
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: '500'
                    }}>
                      {item.category}
                    </div>
                    
                    {/* 가격 */}
                    <div style={{ 
                      fontSize: 'var(--font-size-lg)', 
                      fontWeight: '700', 
                      color: 'var(--mg-primary-500)',
                      marginBottom: '8px'
                    }}>
                      {formatCurrency(item.unitPrice)}
                    </div>
                    
                    {/* 재고 */}
                    <div style={{ 
                      fontSize: 'var(--font-size-sm)', 
                      color: 'var(--mg-secondary-500)',
                      backgroundColor: 'var(--mg-gray-100)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      fontWeight: '500'
                    }}>
                      재고: {item.stockQuantity}개
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 선택된 아이템들의 수량 입력 */}
            {selectedItems.length > 0 && (
              <div className="mg-v2-form-group">
                <label style={{ 
                  display: 'block', 
                  marginBottom: '16px', 
                  fontWeight: '600',
                  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #333 -> var(--mg-custom-333)
                  color: '#333',
                  fontSize: 'var(--font-size-base)'
                }}>
                  선택된 아이템 수량 설정 *
                </label>
                <div style={{
                  display: 'grid',
                  gap: '12px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  padding: '8px'
                }}>
                  {selectedItems.map(item => (
                    <div key={item.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      backgroundColor: 'var(--mg-gray-100)',
                      borderRadius: '8px',
                      // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--mg-secondary-500)' }}>
                          {formatCurrency(item.unitPrice)} × {itemQuantities[item.id] || 1} = {formatCurrency(item.unitPrice * (itemQuantities[item.id] || 1))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, (itemQuantities[item.id] || 1) - 1)}
                          style={{
                            width: '32px',
                            height: '32px',
                            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff -> var(--mg-custom-fff)
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 'bold'
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={itemQuantities[item.id] || 1}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          style={{
                            width: '60px',
                            padding: '6px 8px',
                            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontSize: 'var(--font-size-sm)'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.id, (itemQuantities[item.id] || 1) + 1)}
                          style={{
                            width: '32px',
                            height: '32px',
                            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff -> var(--mg-custom-fff)
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 'bold'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 사유 입력 */}
            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label">
                구매 사유
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="구매 사유를 입력해주세요..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '12px',
                  // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: 'var(--font-size-sm)',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* 선택된 아이템 요약 정보 */}
            {selectedItems.length > 0 && (
              <div style={{ 
                marginBottom: '24px', 
                padding: '16px', 
                backgroundColor: 'var(--mg-gray-100)', 
                borderRadius: '8px',
                // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
                border: '1px solid #e9ecef'
              }}>
                // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #333 -> var(--mg-custom-333)
                <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>
                  선택된 아이템 요약 ({selectedItems.length}개)
                </h4>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {selectedItems.map(item => {
                    const quantity = itemQuantities[item.id] || 1;
                    const totalPrice = item.unitPrice * quantity;
                    return (
                      <div key={item.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fff -> var(--mg-custom-fff)
                        backgroundColor: '#fff',
                        borderRadius: '6px',
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e9ecef -> var(--mg-custom-e9ecef)
                        border: '1px solid #e9ecef'
                      }}>
                        <div>
                          <strong>{item.name}</strong> ({item.category})
                        </div>
                        <div style={{ color: 'var(--mg-primary-500)', fontWeight: '600' }}>
                          {formatCurrency(item.unitPrice)} × {quantity} = {formatCurrency(totalPrice)}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #e3f2fd -> var(--mg-custom-e3f2fd)
                    backgroundColor: '#e3f2fd',
                    borderRadius: '6px',
                    textAlign: 'right',
                    fontWeight: '700',
                    fontSize: 'var(--font-size-base)',
                    color: 'var(--mg-secondary-600)'
                  }}>
                    총 금액: {formatCurrency(selectedItems.reduce((total, item) => {
                      const quantity = itemQuantities[item.id] || 1;
                      return total + (item.unitPrice * quantity);
                    }, 0))}
                  </div>
                </div>
              </div>
            )}

            {/* 오류 메시지 */}
            {error && (
              <div style={{ 
                marginBottom: '16px', 
                padding: '12px', 
                // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f8d7da -> var(--mg-custom-f8d7da)
                backgroundColor: '#f8d7da', 
                // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #721c24 -> var(--mg-custom-721c24)
                color: '#721c24',
                // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f5c6cb -> var(--mg-custom-f5c6cb)
                border: '1px solid #f5c6cb',
                borderRadius: '4px'
              }}>
                {error}
              </div>
            )}

            {/* 제출 버튼 */}
            <div style={{ textAlign: 'right' }}>
              <ErpButton
                type="submit"
                variant="primary"
                size="large"
                loading={loading}
                disabled={selectedItems.length === 0}
              >
                구매 요청 제출
              </ErpButton>
            </div>
          </form>
        </ErpCard>
      </div>

      {/* 성공 모달 */}
      <ErpModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="구매 요청 완료"
        size="small"
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: 'var(--font-size-xxxl)', marginBottom: '16px' }}>✅</div>
          <h3 style={{ margin: '0 0 16px 0', color: 'var(--mg-success-500)' }}>
            구매 요청이 성공적으로 제출되었습니다!
          </h3>
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #666 -> var(--mg-custom-666)
          <p style={{ color: '#666', marginBottom: '24px' }}>
            관리자 승인 후 구매가 진행됩니다.
          </p>
          <ErpButton
            variant="primary"
            onClick={() => setShowSuccessModal(false)}
          >
            확인
          </ErpButton>
        </div>
      </ErpModal>
      </div>
    </AdminCommonLayout>
  );
};

export default PurchaseRequestForm;
