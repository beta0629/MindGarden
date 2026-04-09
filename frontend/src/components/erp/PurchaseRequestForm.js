import React, { useState, useEffect } from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentArea, ContentHeader } from '../dashboard-v2/content';
import MGButton from '../common/MGButton';
import UnifiedLoading from '../common/UnifiedLoading';
import ErpCard from './common/ErpCard';
import ErpButton from './common/ErpButton';
import ErpModal from './common/ErpModal';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import { useSession } from '../../hooks/useSession';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import StandardizedApi from '../../utils/standardizedApi';
import { ERP_API } from '../../constants/api';
import './ErpCommon.css';
import { PurchaseHubSubNav, normalizeErpListResponse } from './purchase/PurchaseHubSections';
import ErpPageShell from './shell/ErpPageShell';

const PURCHASE_REQUEST_TITLE_ID = 'purchase-request-title';

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
      const raw = await StandardizedApi.get(ERP_API.ITEMS);
      const list = normalizeErpListResponse(raw);
      setItems(list);
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
        setError(`${toDisplayString(item.name)}의 수량은 1개 이상이어야 합니다.`);
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

      const results = [];
      for (const request of requests) {
        const formData = new FormData();
        formData.append('requesterId', String(request.requesterId));
        formData.append('itemId', String(request.itemId));
        formData.append('quantity', String(request.quantity));
        if (request.reason) {
          formData.append('reason', request.reason);
        }
        const data = await StandardizedApi.postFormData(ERP_API.PURCHASE_REQUESTS, formData);
        results.push(data);
      }

      const allSuccess = results.every((result) => result && result.success);
      
      if (allSuccess) {
        setShowSuccessModal(true);
        // 폼 초기화
        setSelectedItems([]);
        setItemQuantities({});
        setReason('');
      } else {
        const failedItems = results
          .map((result, index) => result.success ? null : toDisplayString(selectedItems[index]?.name))
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

  const shell = (inner) => (
    <AdminCommonLayout title="구매 요청">
      <div className="mg-v2-ad-b0kla mg-v2-purchase-request-form">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel="구매 요청 본문">
            <ErpPageShell
              headerSlot={
                <ContentHeader
                  title="구매 요청"
                  subtitle="조달 허브에서 조달·품목 화면과 이동할 수 있습니다. 필요한 비품을 요청하세요."
                  titleId={PURCHASE_REQUEST_TITLE_ID}
                  actions={
                    <MGButton
                      type="button"
                      variant="secondary"
                      onClick={() => window.history.back()}
                    >
                      뒤로가기
                    </MGButton>
                  }
                />
              }
              tabsSlot={<PurchaseHubSubNav />}
              mainAriaLabel="구매 요청 본문"
            >
              {inner}
            </ErpPageShell>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );

  if (loading && items.length === 0) {
    return shell(
      <UnifiedLoading type="page" text="아이템 목록을 불러오는 중..." />
    );
  }

  return shell(
    <>
      <div
        aria-labelledby={PURCHASE_REQUEST_TITLE_ID}
        className="purchase-request-form-container"
        role="region"
      >
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
                      border: isItemSelected(item) ? '2px solid var(--mg-primary-500)' : '1px solid var(--mg-gray-200)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      backgroundColor: isItemSelected(item) ? 'var(--mg-primary-50)' : 'var(--mg-white)',
                      transition: 'all 0.3s ease',
                      boxShadow: isItemSelected(item)
                        ? 'var(--cs-shadow-primary)'
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
                        color: 'var(--mg-white)',
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
                      color: 'var(--mg-gray-900)',
                      lineHeight: '1.3'
                    }}>
                      <SafeText>{item.name}</SafeText>
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
                      <SafeText>{item.category}</SafeText>
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
                  color: 'var(--mg-gray-800)',
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
                      border: '1px solid var(--mg-gray-200)'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          <SafeText>{item.name}</SafeText>
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
                            border: '1px solid var(--mg-gray-300)',
                            borderRadius: '4px',
                            backgroundColor: 'var(--mg-white)',
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
                            border: '1px solid var(--mg-gray-300)',
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
                            border: '1px solid var(--mg-gray-300)',
                            borderRadius: '4px',
                            backgroundColor: 'var(--mg-white)',
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
                  border: '1px solid var(--mg-gray-300)',
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
                border: '1px solid var(--mg-gray-200)'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: 'var(--mg-gray-800)' }}>
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
                        backgroundColor: 'var(--mg-white)',
                        borderRadius: '6px',
                        border: '1px solid var(--mg-gray-200)'
                      }}>
                        <div>
                          <strong><SafeText>{item.name}</SafeText></strong>{' '}
                          (<SafeText>{item.category}</SafeText>)
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
                    backgroundColor: 'var(--cs-blue-50)',
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
              <div style={{ marginBottom: '16px' }}>
                <SafeErrorDisplay error={error} variant="banner" iconSize={18} />
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
      </div>

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
          <p style={{ color: 'var(--mg-gray-600)', marginBottom: '24px' }}>
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
    </>
  );
};

export default PurchaseRequestForm;
