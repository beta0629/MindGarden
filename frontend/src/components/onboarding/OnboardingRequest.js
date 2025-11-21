import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UnifiedNotification from '../common/UnifiedNotification';
import {
  createOnboardingRequest,
  getRootBusinessCategories,
  getBusinessCategoryItems,
  getRiskLevelCodes,
  convertCodesToOptions
} from '../../utils/onboardingService';
import {
  DEFAULT_RISK_LEVEL,
  FORM_FIELDS,
  PLACEHOLDERS,
  HELP_TEXTS,
  MESSAGES
} from '../../constants/onboarding';
import './OnboardingRequest.css';

/**
 * 온보딩 요청 페이지
 * 테넌트 온보딩 요청을 생성하는 컴포넌트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-20
 */
const OnboardingRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingRiskLevels, setLoadingRiskLevels] = useState(true);
  const [error, setError] = useState(null);
  const [businessCategories, setBusinessCategories] = useState([]);
  const [businessCategoryItems, setBusinessCategoryItems] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [riskLevelOptions, setRiskLevelOptions] = useState([]);
  const [formData, setFormData] = useState({
    tenantName: '',
    businessType: '',
    contactPhone: '',
    riskLevel: DEFAULT_RISK_LEVEL,
    checklistJson: '{}'
  });

  // 루트 카테고리 및 위험도 코드 로드
  useEffect(() => {
    loadRootCategories();
    loadRiskLevelCodes();
  }, []);

  // 선택된 카테고리의 아이템 로드
  useEffect(() => {
    if (selectedCategoryId) {
      loadCategoryItems(selectedCategoryId);
    } else {
      setBusinessCategoryItems([]);
    }
  }, [selectedCategoryId]);

  const loadRootCategories = async () => {
    try {
      setLoadingCategories(true);
      setError(null);
      const categories = await getRootBusinessCategories();
      setBusinessCategories(categories);
    } catch (err) {
      console.error('업종 카테고리 로드 실패:', err);
      setError('업종 카테고리를 불러오는데 실패했습니다.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadCategoryItems = async (categoryId) => {
    try {
      setLoadingCategories(true);
      const items = await getBusinessCategoryItems(categoryId);
      setBusinessCategoryItems(items);
    } catch (err) {
      console.error('업종 카테고리 아이템 로드 실패:', err);
      setError('업종 상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadRiskLevelCodes = async () => {
    try {
      setLoadingRiskLevels(true);
      const codes = await getRiskLevelCodes();
      const options = convertCodesToOptions(codes);
      setRiskLevelOptions(options);
      
      // 기본값이 없으면 첫 번째 옵션을 기본값으로 설정
      if (options.length > 0 && !formData.riskLevel) {
        setFormData(prev => ({
          ...prev,
          riskLevel: options[0].value
        }));
      }
    } catch (err) {
      console.error('위험도 코드 로드 실패:', err);
      // 에러는 조용히 처리 (기본값 사용)
    } finally {
      setLoadingRiskLevels(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await createOnboardingRequest(formData);

      if (response) {
        UnifiedNotification.show({
          type: 'success',
          message: MESSAGES.SUBMIT_SUCCESS,
          duration: 3000
        });

        navigate('/onboarding/status');
      }
    } catch (err) {
      console.error('온보딩 요청 실패:', err);
      const errorMessage = err.message || MESSAGES.SUBMIT_ERROR;
      setError(errorMessage);
      UnifiedNotification.show({
        type: 'error',
        message: errorMessage,
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setFormData(prev => ({
      ...prev,
      [FORM_FIELDS.BUSINESS_TYPE]: '' // 카테고리 변경 시 선택 초기화
    }));
  };

  const handleBusinessTypeSelect = (itemCode) => {
    setFormData(prev => ({
      ...prev,
      [FORM_FIELDS.BUSINESS_TYPE]: itemCode
    }));
  };

  const getCategoryName = (category) => {
    return category.nameKo || category.categoryNameKo || category.nameEn || category.categoryName || '알 수 없음';
  };

  const getItemName = (item) => {
    return item.nameKo || item.itemNameKo || item.nameEn || item.itemName || '알 수 없음';
  };

  return (
    <div className="onboarding-request">
      <div className="onboarding-request__container">
        <h1 className="onboarding-request__title">서비스 신청</h1>
        <p className="onboarding-request__description">
          CoreSolution 서비스 이용을 위한 온보딩 요청을 제출해주세요.
        </p>

        {error && (
          <div className="onboarding-request__error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="onboarding-request__form">
          <div className="onboarding-request__field">
            <label htmlFor={FORM_FIELDS.TENANT_NAME} className="onboarding-request__label">
              회사명 <span className="onboarding-request__required">*</span>
            </label>
            <input
              type="text"
              id={FORM_FIELDS.TENANT_NAME}
              name={FORM_FIELDS.TENANT_NAME}
              value={formData.tenantName}
              onChange={handleChange}
              className="onboarding-request__input"
              placeholder={PLACEHOLDERS.TENANT_NAME}
              required
            />
          </div>

          <div className="onboarding-request__field">
            <label htmlFor="category" className="onboarding-request__label">
              업종 카테고리
            </label>
            {loadingCategories && businessCategories.length === 0 ? (
              <div className="onboarding-request__loading">{MESSAGES.LOADING}</div>
            ) : businessCategories.length === 0 ? (
              <div className="onboarding-request__error">업종 카테고리를 불러올 수 없습니다.</div>
            ) : (
              <div className="onboarding-request__category-grid">
                {businessCategories.map((category) => {
                  const categoryId = category.categoryId || String(category.id);
                  return (
                    <button
                      key={categoryId}
                      type="button"
                      onClick={() => handleCategorySelect(categoryId)}
                      className={`onboarding-request__category-button ${
                        selectedCategoryId === categoryId
                          ? 'onboarding-request__category-button--active'
                          : ''
                      }`}
                    >
                      {getCategoryName(category)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedCategoryId && (
            <div className="onboarding-request__field">
              <label htmlFor={FORM_FIELDS.BUSINESS_TYPE} className="onboarding-request__label">
                세부 업종 <span className="onboarding-request__required">*</span>
              </label>
              {loadingCategories && businessCategoryItems.length === 0 ? (
                <div className="onboarding-request__loading">{MESSAGES.LOADING}</div>
              ) : businessCategoryItems.length === 0 ? (
                <div className="onboarding-request__help">선택한 카테고리에 해당하는 업종이 없습니다.</div>
              ) : (
                <div className="onboarding-request__category-grid">
                  {businessCategoryItems.map((item) => {
                    const itemCode = item.itemCode || item.businessType;
                    return (
                      <button
                        key={item.itemId || String(item.id)}
                        type="button"
                        onClick={() => handleBusinessTypeSelect(itemCode)}
                        className={`onboarding-request__category-button ${
                          formData.businessType === itemCode
                            ? 'onboarding-request__category-button--active'
                            : ''
                        }`}
                      >
                        {getItemName(item)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="onboarding-request__field">
            <label htmlFor={FORM_FIELDS.CONTACT_PHONE} className="onboarding-request__label">
              연락처
            </label>
            <input
              type="tel"
              id={FORM_FIELDS.CONTACT_PHONE}
              name={FORM_FIELDS.CONTACT_PHONE}
              value={formData.contactPhone}
              onChange={handleChange}
              className="onboarding-request__input"
              placeholder={PLACEHOLDERS.CONTACT_PHONE}
            />
            <small className="onboarding-request__help">
              {HELP_TEXTS.CONTACT_PHONE}
            </small>
          </div>

          <div className="onboarding-request__field">
            <label htmlFor={FORM_FIELDS.RISK_LEVEL} className="onboarding-request__label">
              위험도
            </label>
            {loadingRiskLevels ? (
              <div className="onboarding-request__loading">{MESSAGES.LOADING}</div>
            ) : riskLevelOptions.length === 0 ? (
              <select
                id={FORM_FIELDS.RISK_LEVEL}
                name={FORM_FIELDS.RISK_LEVEL}
                value={formData.riskLevel}
                onChange={handleChange}
                className="onboarding-request__input"
                disabled
              >
                <option value={DEFAULT_RISK_LEVEL}>위험도 코드를 불러올 수 없습니다</option>
              </select>
            ) : (
              <select
                id={FORM_FIELDS.RISK_LEVEL}
                name={FORM_FIELDS.RISK_LEVEL}
                value={formData.riskLevel}
                onChange={handleChange}
                className="onboarding-request__input"
              >
                {riskLevelOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            <small className="onboarding-request__help">
              {HELP_TEXTS.RISK_LEVEL}
            </small>
          </div>

          <div className="onboarding-request__actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="onboarding-request__button onboarding-request__button--secondary"
              disabled={loading}
            >
              {MESSAGES.CANCEL}
            </button>
            <button
              type="submit"
              className="onboarding-request__button onboarding-request__button--primary"
              disabled={loading || !formData.tenantName || !formData.businessType}
            >
              {loading ? MESSAGES.SUBMITTING : MESSAGES.SUBMIT}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingRequest;
