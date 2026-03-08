import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../../components/common/UnifiedLoading';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentHeader, ContentArea } from '../dashboard-v2/content';
import ErpCard from './common/ErpCard';
import ErpButton from './common/ErpButton';
import './ItemManagement.css';
import ErpModal from './common/ErpModal';
import BadgeSelect from '../common/BadgeSelect';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/ajax';
import notificationManager from '../../utils/notification';
import { Plus, Pencil, Trash2 } from 'lucide-react';

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
      const response = await apiGet('/api/v1/common-codes?codeGroup=ITEM_CATEGORY');
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
        { value: 'OFFICE_SUPPLIES', label: '사무용품', icon: 'FileText', color: 'var(--mg-primary-500)', description: '사무용품 및 문구류' },
        { value: 'COUNSELING_TOOLS', label: '상담 도구', icon: 'Brain', color: 'var(--mg-success-500)', description: '상담에 사용되는 도구 및 자료' },
        { value: 'ELECTRONICS', label: '전자제품', icon: 'Monitor', color: 'var(--mg-purple-500)', description: '전자기기 및 IT 장비' },
        { value: 'FURNITURE', label: '가구', icon: 'Armchair', color: 'var(--mg-warning-500)', description: '사무용 가구 및 인테리어' },
        { value: 'BOOKS', label: '도서', icon: 'BookOpen', color: 'var(--mg-error-500)', description: '도서 및 참고자료' },
        { value: 'MEDICAL_SUPPLIES', label: '의료용품', icon: 'Building2', color: 'var(--mg-orange-500)', description: '의료 및 건강 관련 용품' },
        { value: 'CLEANING_SUPPLIES', label: '청소용품', icon: 'Spray', color: 'var(--mg-primary-400)', description: '청소 및 위생용품' },
        { value: 'OTHER', label: '기타', icon: 'Package', color: 'var(--mg-color-text-secondary)', description: '기타 아이템' }
      ]);
    } finally {
      setLoadingCodes(false);
    }
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await apiGet('/api/v1/erp/items');
      
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
      
      const response = await apiPost('/api/v1/erp/items', {
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
      
      const response = await apiPut(`/api/v1/erp/items/${editingItem.id}`, {
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
    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(`"${item.name}" 아이템을 삭제하시겠습니까?`, resolve);
    });
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await apiDelete(`/api/v1/erp/items/${item.id}`);

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
    return (
      <AdminCommonLayout title="아이템 관리" loading={true} loadingText="데이터를 불러오는 중...">
        <div />
      </AdminCommonLayout>
    );
  }

  return (
    <AdminCommonLayout title="아이템 관리">
      <ContentHeader
        title="아이템 관리"
        subtitle="비품 아이템을 관리하세요"
        actions={
          <div className="action-buttons">
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
              <Plus size={16} /> 새 아이템 추가
            </ErpButton>
          </div>
        }
      />
      <ContentArea className="item-management-container" ariaLabel="아이템 관리 콘텐츠">
        {/* 성공/오류 메시지 */}
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* 아이템 목록 */}
        <ErpCard title={`아이템 목록 (${items.length}개)`}>
          <div className="item-management-grid">
            {items.map(item => (
              <div key={item.id} className="item-management-card">
                <div className="item-management-card-header">
                  <h4 className="item-management-card-title">{item.name}</h4>
                  <div className="item-management-card-category">
                    {getCategoryLabel(item.category)}
                  </div>
                  {item.description && (
                    <div className="item-management-card-description">
                      {item.description}
                    </div>
                  )}
                </div>
                
                <div className="item-management-card-footer">
                  <div className="item-management-card-price">
                    {formatCurrency(item.unitPrice)}
                  </div>
                  <div className="item-management-card-stock">
                    재고: {item.stockQuantity}개
                  </div>
                  {item.supplier && (
                    <div className="item-management-card-supplier">
                      공급업체: {item.supplier}
                    </div>
                  )}
                </div>
                
                <div className="item-management-card-actions">
                  <ErpButton
                    variant="outline-primary"
                    size="small"
                    onClick={() => handleEditItem(item)}
                  >
                    <Pencil size={14} /> 수정
                  </ErpButton>
                  <ErpButton
                    variant="outline-danger"
                    size="small"
                    onClick={() => handleDeleteItem(item)}
                  >
                    <Trash2 size={14} /> 삭제
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
            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label">
                아이템명 *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="mg-v2-form-input"
              />
            </div>

            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label">
                설명
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="mg-v2-form-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label">
                카테고리 *
              </label>
              <BadgeSelect
                value={formData.category}
                onChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                options={[
                  { value: '', label: '카테고리를 선택하세요' },
                  ...categoryOptions.map(option => ({
                    value: option.value,
                    label: `${option.label} (${option.value})`
                  }))
                ]}
                placeholder="카테고리를 선택하세요"
                className="mg-v2-form-badge-select"
              />
            </div>

            <div className="mg-v2-form-grid">
              <div>
                <label className="mg-v2-form-label">
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
                  className="mg-v2-form-input"
                />
              </div>

              <div>
                <label className="mg-v2-form-label">
                  재고 수량 *
                </label>
                <input
                  type="number"
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="mg-v2-form-input"
                />
              </div>
            </div>

            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label">
                공급업체
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                className="mg-v2-form-input"
              />
            </div>

            <div className="mg-v2-text-right" style={{ display: 'flex', gap: 'var(--mg-layout-gap)' }}>
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
            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label">
                아이템명 *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="mg-v2-form-input"
              />
            </div>

            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label">
                설명
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="mg-v2-form-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label">
                카테고리 *
              </label>
              <BadgeSelect
                value={formData.category}
                onChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                options={categoryOptions.map(option => ({
                  value: option.value,
                  label: `${option.label} (${option.value})`
                }))}
                placeholder="카테고리를 선택하세요"
                className="mg-v2-form-badge-select"
              />
            </div>

            <div className="mg-v2-form-grid">
              <div>
                <label className="mg-v2-form-label">
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
                  className="mg-v2-form-input"
                />
              </div>

              <div>
                <label className="mg-v2-form-label">
                  재고 수량 *
                </label>
                <input
                  type="number"
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="mg-v2-form-input"
                />
              </div>
            </div>

            <div className="mg-v2-form-group">
              <label className="mg-v2-form-label">
                공급업체
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                className="mg-v2-form-input"
              />
            </div>

            <div className="mg-v2-text-right" style={{ display: 'flex', gap: 'var(--mg-layout-gap)' }}>
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
      </ContentArea>
    </AdminCommonLayout>
  );
};

export default ItemManagement;
