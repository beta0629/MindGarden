import React, { useState, useEffect } from 'react';
import SimpleLayout from '../layout/SimpleLayout';
import ErpCard from './common/ErpCard';
import ErpButton from './common/ErpButton';
import ErpLoading from './common/ErpLoading';
import ErpHeader from './common/ErpHeader';
import ErpModal from './common/ErpModal';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';

/**
 * 아이템 관리 컴포넌트 (관리자/수퍼어드민 전용)
 */
const ItemManagement = () => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 폼 데이터
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    unitPrice: '',
    stockQuantity: '',
    supplier: ''
  });

  // 카테고리 옵션
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  useEffect(() => {
    loadItems();
    loadCategoryCodes();
  }, []);

  // 아이템 카테고리 코드 로드
  const loadCategoryCodes = async () => {
    try {
      setLoadingCodes(true);
      const response = await apiGet('/api/admin/common-codes/values?groupCode=ITEM_CATEGORY');
      if (response && response.length > 0) {
        const options = response.map(code => ({
          value: code.codeValue,
          label: code.codeLabel,
          icon: code.icon,
          color: code.colorCode,
          description: code.description
        }));
        setCategoryOptions(options);
      }
    } catch (error) {
      console.error('아이템 카테고리 코드 로드 실패:', error);
      // 실패 시 기본값 설정
      setCategoryOptions([
        { value: 'OFFICE_SUPPLIES', label: '사무용품', icon: '📝', color: '#3b82f6', description: '사무용품 및 문구류' },
        { value: 'COUNSELING_TOOLS', label: '상담 도구', icon: '🧠', color: '#10b981', description: '상담에 사용되는 도구 및 자료' },
        { value: 'ELECTRONICS', label: '전자제품', icon: '💻', color: '#8b5cf6', description: '전자기기 및 IT 장비' },
        { value: 'FURNITURE', label: '가구', icon: '🪑', color: '#f59e0b', description: '사무용 가구 및 인테리어' },
        { value: 'BOOKS', label: '도서', icon: '📚', color: '#ef4444', description: '도서 및 참고자료' },
        { value: 'MEDICAL_SUPPLIES', label: '의료용품', icon: '🏥', color: '#f97316', description: '의료 및 건강 관련 용품' },
        { value: 'CLEANING_SUPPLIES', label: '청소용품', icon: '🧽', color: '#06b6d4', description: '청소 및 위생용품' },
        { value: 'OTHER', label: '기타', icon: '📦', color: '#6b7280', description: '기타 아이템' }
      ]);
    } finally {
      setLoadingCodes(false);
    }
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/api/erp/items');
      
      if (response?.success) {
        setItems(response.data || []);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      unitPrice: '',
      stockQuantity: '',
      supplier: ''
    });
    setError('');
    setSuccess('');
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const response = await apiPost('/api/erp/items', {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        unitPrice: parseFloat(formData.unitPrice),
        stockQuantity: parseInt(formData.stockQuantity),
        supplier: formData.supplier
      });

      if (response?.success) {
        setSuccess('아이템이 성공적으로 생성되었습니다.');
        setShowCreateModal(false);
        resetForm();
        loadItems();
      } else {
        setError(response?.message || '아이템 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('아이템 생성 실패:', error);
      setError('아이템 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category,
      unitPrice: item.unitPrice.toString(),
      stockQuantity: item.stockQuantity.toString(),
      supplier: item.supplier || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const response = await apiPut(`/api/erp/items/${editingItem.id}`, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        unitPrice: parseFloat(formData.unitPrice),
        stockQuantity: parseInt(formData.stockQuantity),
        supplier: formData.supplier
      });

      if (response?.success) {
        setSuccess('아이템이 성공적으로 수정되었습니다.');
        setShowEditModal(false);
        setEditingItem(null);
        resetForm();
        loadItems();
      } else {
        setError(response?.message || '아이템 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('아이템 수정 실패:', error);
      setError('아이템 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`"${item.name}" 아이템을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await apiDelete(`/api/erp/items/${item.id}`);

      if (response?.success) {
        setSuccess('아이템이 성공적으로 삭제되었습니다.');
        loadItems();
      } else {
        setError(response?.message || '아이템 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('아이템 삭제 실패:', error);
      setError('아이템 삭제에 실패했습니다.');
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

  const getCategoryLabel = (category) => {
    const option = categoryOptions.find(opt => opt.value === category);
    return option ? option.label : category;
  };

  if (loading && items.length === 0) {
    return <ErpLoading message="아이템 목록을 불러오는 중..." />;
  }

  return (
    <SimpleLayout>
      <div style={{ padding: '24px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <ErpHeader
          title="아이템 관리"
          subtitle="비품 아이템을 관리하세요"
          actions={
            <div style={{ display: 'flex', gap: '12px' }}>
              <ErpButton
                variant="secondary"
                onClick={() => window.history.back()}
              >
                뒤로가기
              </ErpButton>
              <ErpButton
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-circle"></i> 새 아이템 추가
              </ErpButton>
            </div>
          }
        />

        {/* 성공/오류 메시지 */}
        {success && (
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            backgroundColor: '#d1edff', 
            color: '#0c5460',
            border: '1px solid #74c0fc',
            borderRadius: '4px'
          }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            backgroundColor: '#f8d7da', 
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}

        {/* 아이템 목록 */}
        <ErpCard title={`아이템 목록 (${items.length}개)`}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '16px' 
          }}>
            {items.map(item => (
              <div key={item.id} style={{
                padding: '20px',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>{item.name}</h4>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>
                    {getCategoryLabel(item.category)}
                  </div>
                  {item.description && (
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                      {item.description}
                    </div>
                  )}
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#007bff' }}>
                    {formatCurrency(item.unitPrice)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6c757d' }}>
                    재고: {item.stockQuantity}개
                  </div>
                  {item.supplier && (
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      공급업체: {item.supplier}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <ErpButton
                    variant="outline-primary"
                    size="small"
                    onClick={() => handleEditItem(item)}
                  >
                    <i className="bi bi-pencil"></i> 수정
                  </ErpButton>
                  <ErpButton
                    variant="outline-danger"
                    size="small"
                    onClick={() => handleDeleteItem(item)}
                  >
                    <i className="bi bi-trash"></i> 삭제
                  </ErpButton>
                </div>
              </div>
            ))}
          </div>
        </ErpCard>

        {/* 아이템 생성 모달 */}
        <ErpModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="새 아이템 추가"
        >
          <form onSubmit={handleCreateItem}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                아이템명 *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                설명
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                카테고리 *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">카테고리를 선택하세요</option>
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label} ({option.value})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                  단가 *
                </label>
                <input
                  type="number"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                  재고 수량 *
                </label>
                <input
                  type="number"
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                공급업체
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <ErpButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                취소
              </ErpButton>
              <ErpButton
                type="submit"
                variant="primary"
                loading={loading}
              >
                생성
              </ErpButton>
            </div>
          </form>
        </ErpModal>

        {/* 아이템 수정 모달 */}
        <ErpModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
            resetForm();
          }}
          title="아이템 수정"
        >
          <form onSubmit={handleUpdateItem}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                아이템명 *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                설명
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                카테고리 *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label} ({option.value})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                  단가 *
                </label>
                <input
                  type="number"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                  재고 수량 *
                </label>
                <input
                  type="number"
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                공급업체
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <ErpButton
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
              >
                취소
              </ErpButton>
              <ErpButton
                type="submit"
                variant="primary"
                loading={loading}
              >
                수정
              </ErpButton>
            </div>
          </form>
        </ErpModal>
      </div>
    </SimpleLayout>
  );
};

export default ItemManagement;
