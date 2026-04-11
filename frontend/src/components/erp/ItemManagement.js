import React, { useState, useEffect } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { ContentHeader, ContentArea } from '../dashboard-v2/content';
import CardContainer from '../common/CardContainer';
import MGButton from '../common/MGButton';
import {
  buildErpMgButtonClassName,
  ERP_MG_BUTTON_LOADING_TEXT,
  mapErpSizeToMg,
  mapErpVariantToMg
} from './common/erpMgButtonProps';
import { ErpFilterToolbar, ErpSafeNumber, ERP_NUMBER_FORMAT, useErpSilentRefresh } from './common';
import './ItemManagement.css';
import UnifiedModal from '../common/modals/UnifiedModal.js';
import BadgeSelect from '../common/BadgeSelect';
import StandardizedApi from '../../utils/standardizedApi';
import { ERP_API, COMMON_CODE_API } from '../../constants/api';
import notificationManager from '../../utils/notification';
import SafeErrorDisplay from '../common/SafeErrorDisplay';
import SafeText from '../common/SafeText';
import { toDisplayString } from '../../utils/safeDisplay';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import '../../styles/unified-design-tokens.css';
import '../admin/AdminDashboard/AdminDashboardB0KlA.css';
import './ErpCommon.css';
import { PurchaseHubSubNav, normalizeErpListResponse } from './purchase/PurchaseHubSections';
import ErpPageShell from './shell/ErpPageShell';

const ITEM_MANAGEMENT_TITLE_ID = 'item-management-title';
const ITEM_MANAGEMENT_LIST_TITLE_ID = 'item-management-list-title';

/**
 * 아이템 관리 컴포넌트 (관리자/수퍼어드민 전용)
 */
const ItemManagement = () => {
  const [loading, setLoading] = useState(false);
  const { silentListRefreshing, setSilentListRefreshing } = useErpSilentRefresh();
  const [itemsInitialFetchDone, setItemsInitialFetchDone] = useState(false);
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
  const loadCategoryCodes = async() => {
    try {
      setLoadingCodes(true);
      const raw = await StandardizedApi.get(COMMON_CODE_API.BASE, { codeGroup: 'ITEM_CATEGORY' });
      const codeList = normalizeErpListResponse(raw);
      if (codeList.length > 0) {
        const options = codeList.map(code => ({
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

  const loadItems = async(options = {}) => {
    const silent = options.silent === true;
    try {
      if (silent) {
        setSilentListRefreshing(true);
      } else {
        setLoading(true);
      }
      const raw = await StandardizedApi.get(ERP_API.ITEMS);
      const list = normalizeErpListResponse(raw);
      setItems(list);
    } catch (error) {
      console.error('아이템 로드 실패:', error);
      setError('아이템 목록을 불러오는데 실패했습니다.');
    } finally {
      setItemsInitialFetchDone(true);
      if (silent) {
        setSilentListRefreshing(false);
      } else {
        setLoading(false);
      }
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

  const handleCreateItem = async(e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const response = await StandardizedApi.post(ERP_API.ITEMS, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        unitPrice: parseFloat(formData.unitPrice),
        stockQuantity: parseInt(formData.stockQuantity),
        supplier: formData.supplier
      });

      if (response != null) {
        setSuccess('아이템이 성공적으로 생성되었습니다.');
        setShowCreateModal(false);
        resetForm();
        loadItems();
      } else {
        setError('아이템 생성에 실패했습니다.');
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

  const handleUpdateItem = async(e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const response = await StandardizedApi.put(ERP_API.ITEM_BY_ID(editingItem.id), {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        unitPrice: parseFloat(formData.unitPrice),
        stockQuantity: parseInt(formData.stockQuantity),
        supplier: formData.supplier
      });

      if (response != null) {
        setSuccess('아이템이 성공적으로 수정되었습니다.');
        setShowEditModal(false);
        setEditingItem(null);
        resetForm();
        loadItems();
      } else {
        setError('아이템 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('아이템 수정 실패:', error);
      setError('아이템 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async(item) => {
    const confirmed = await new Promise((resolve) => {
      notificationManager.confirm(`"${item.name}" 아이템을 삭제하시겠습니까?`, resolve);
    });
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await StandardizedApi.delete(ERP_API.ITEM_BY_ID(item.id));

      if (response != null) {
        setSuccess('아이템이 성공적으로 삭제되었습니다.');
        loadItems();
      } else {
        setError('아이템 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('아이템 삭제 실패:', error);
      setError('아이템 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category) => {
    const option = categoryOptions.find(opt => opt.value === category);
    return option ? option.label : category;
  };

  const showInitialInlineLoad =
    loading && items.length === 0 && !itemsInitialFetchDone;

  return (
    <AdminCommonLayout title="아이템 관리">
      <div className="mg-v2-ad-b0kla mg-v2-item-management">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel="아이템 관리 콘텐츠">
            <ErpPageShell
              headerSlot={
                <ContentHeader
                  title="아이템 관리"
                  subtitle="조달 허브에서 품목·구매 요청·조달 화면을 오갈 수 있습니다."
                  titleId={ITEM_MANAGEMENT_TITLE_ID}
                  actions={
                    <div className="action-buttons">
                      <MGButton
                        variant={mapErpVariantToMg('secondary')}
                        size={mapErpSizeToMg('md')}
                        className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        preventDoubleClick={false}
                        onClick={() => window.history.back()}
                      >
                        뒤로가기
                      </MGButton>
                      <MGButton
                        variant={mapErpVariantToMg('primary')}
                        size={mapErpSizeToMg('md')}
                        className={buildErpMgButtonClassName({ variant: 'primary', loading: false })}
                        loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                        preventDoubleClick={false}
                        onClick={() => setShowCreateModal(true)}
                      >
                        <Plus size={16} /> 새 아이템 추가
                      </MGButton>
                    </div>
                  }
                />
              }
              tabsSlot={<PurchaseHubSubNav />}
              mainAriaLabel="아이템 관리 목록 및 본문"
            >
            {showInitialInlineLoad ? (
              <div className="item-management__initial-load" role="status" aria-live="polite">
                <UnifiedLoading type="inline" text="데이터를 불러오는 중..." />
              </div>
            ) : (
              <div
                aria-labelledby={ITEM_MANAGEMENT_TITLE_ID}
                className="item-management-container"
                role="region"
              >
                {success && (
                  <div className="success-message">
                    <SafeText>{success}</SafeText>
                  </div>
                )}

                {error && (
                  <SafeErrorDisplay error={error} variant="inline" className="error-message" />
                )}

                <ErpFilterToolbar
                  ariaLabel="아이템 목록 도구"
                  secondaryRow={
                    <div className="item-management__toolbar-actions">
                      <MGButton
                        variant="secondary"
                        size="small"
                        className="mg-v2-button mg-v2-button--secondary"
                        onClick={() => loadItems({ silent: true })}
                        loading={silentListRefreshing}
                        loadingText="새로고침 중..."
                        disabled={loading}
                        aria-label="목록 새로고침"
                      >
                        목록 새로고침
                      </MGButton>
                    </div>
                  }
                />

                <section className="mg-v2-section" aria-labelledby={ITEM_MANAGEMENT_LIST_TITLE_ID}>
                  <CardContainer>
                    <h3 id={ITEM_MANAGEMENT_LIST_TITLE_ID} className="mg-h4">
                      {toDisplayString(`아이템 목록 (${items.length}개)`)}
                    </h3>
                    <div className="mg-v2-card-body">
                      <div className="item-management-grid">
                        {items.map(item => (
                          <div key={item.id} className="item-management-card">
                            <div className="item-management-card-header">
                              <h4 className="item-management-card-title"><SafeText>{item.name}</SafeText></h4>
                              <div className="item-management-card-category">
                                <SafeText>{getCategoryLabel(item.category)}</SafeText>
                              </div>
                              {item.description && (
                                <div className="item-management-card-description">
                                  <SafeText>{item.description}</SafeText>
                                </div>
                              )}
                            </div>

                            <div className="item-management-card-footer">
                              <div className="item-management-card-price">
                                <ErpSafeNumber value={item.unitPrice} formatType={ERP_NUMBER_FORMAT.CURRENCY} />
                              </div>
                              <div className="item-management-card-stock">
                                재고: <SafeText>{item.stockQuantity}</SafeText>개
                              </div>
                              {item.supplier && (
                                <div className="item-management-card-supplier">
                                  공급업체: <SafeText>{item.supplier}</SafeText>
                                </div>
                              )}
                            </div>

                            <div className="item-management-card-actions">
                              <MGButton
                                variant={mapErpVariantToMg('outline-primary')}
                                size={mapErpSizeToMg('small')}
                                className={buildErpMgButtonClassName({
                                  variant: 'outline-primary',
                                  size: 'small',
                                  loading: false
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                preventDoubleClick={false}
                                onClick={() => handleEditItem(item)}
                              >
                                <Pencil size={14} /> 수정
                              </MGButton>
                              <MGButton
                                variant={mapErpVariantToMg('outline-danger')}
                                size={mapErpSizeToMg('small')}
                                className={buildErpMgButtonClassName({
                                  variant: 'outline-danger',
                                  size: 'small',
                                  loading: false
                                })}
                                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                                preventDoubleClick={false}
                                onClick={() => handleDeleteItem(item)}
                              >
                                <Trash2 size={14} /> 삭제
                              </MGButton>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContainer>
                </section>
              </div>
            )}
            </ErpPageShell>

        {/* 아이템 생성 모달 */}
        <UnifiedModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="새 아이템 추가"
          size="auto"
          showCloseButton
          backdropClick
          className="mg-v2-ad-b0kla"
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
              <MGButton
                type="button"
                variant={mapErpVariantToMg('secondary')}
                size={mapErpSizeToMg('md')}
                className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                취소
              </MGButton>
              <MGButton
                type="submit"
                variant={mapErpVariantToMg('primary')}
                size={mapErpSizeToMg('md')}
                className={buildErpMgButtonClassName({ variant: 'primary', loading })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
                loading={loading}
              >
                생성
              </MGButton>
            </div>
          </form>
        </UnifiedModal>

        {/* 아이템 수정 모달 */}
        <UnifiedModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingItem(null);
            resetForm();
          }}
          title="아이템 수정"
          size="auto"
          showCloseButton
          backdropClick
          className="mg-v2-ad-b0kla"
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
              <MGButton
                type="button"
                variant={mapErpVariantToMg('secondary')}
                size={mapErpSizeToMg('md')}
                className={buildErpMgButtonClassName({ variant: 'secondary', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
                onClick={() => {
                  setShowEditModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
              >
                취소
              </MGButton>
              <MGButton
                type="submit"
                variant={mapErpVariantToMg('primary')}
                size={mapErpSizeToMg('md')}
                className={buildErpMgButtonClassName({ variant: 'primary', loading })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                preventDoubleClick={false}
                loading={loading}
              >
                수정
              </MGButton>
            </div>
          </form>
        </UnifiedModal>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default ItemManagement;
