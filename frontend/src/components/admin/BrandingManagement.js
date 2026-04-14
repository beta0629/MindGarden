/**
 * 브랜딩 관리 컴포넌트
/**
 * 관리자가 테넌트의 로고, 상호명, 색상 등을 설정할 수 있는 UI
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-26
 */

import React, { useState, useEffect, useCallback } from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import UnifiedLoading from '../common/UnifiedLoading';
import { Upload, AlertCircle } from 'lucide-react';
import { useBranding } from '../../hooks/useBranding';
import { updateBrandingInfo, uploadLogo, getBrandingInfo } from '../../utils/brandingUtils';
import notificationManager from '../../utils/notification';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './BrandingManagement.css';
import MGButton from '../common/MGButton';

const BRANDING_MGMT_TITLE_ID = 'branding-management-title';

const BrandingManagement = ({ onClose }) => {
  const { brandingInfo, isLoading, refreshBranding } = useBranding();
  
  // 폼 상태
  const [formData, setFormData] = useState({
    companyName: '',
    companyNameEn: '',
    primaryColor: 'var(--mg-primary-500)',
    secondaryColor: 'var(--mg-secondary-500)',
    favicon: ''
  });
  
  // UI 상태
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState({});

  // 브랜딩 정보 로드 시 폼 데이터 초기화
  useEffect(() => {
    const loadInitialData = async() => {
      try {
        const branding = await getBrandingInfo();
        if (branding) {
          setFormData({
            companyName: branding.companyName || '',
            companyNameEn: branding.companyNameEn || '',
            primaryColor: branding.primaryColor || 'var(--mg-primary-500)',
            secondaryColor: branding.secondaryColor || 'var(--mg-secondary-500)',
            favicon: branding.favicon || ''
          });
          
          // 현재 로고가 있으면 미리보기 설정
          if (branding.logo && branding.logo.url && 
              !branding.logo.url.includes('core-solution-logo.png')) {
            setLogoPreview(branding.logo.url);
          }
        }
      } catch (error) {
        console.error('브랜딩 정보 로드 실패:', error);
      }
    };

    loadInitialData();
  }, []);

  // 폼 데이터 변경 핸들러
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
    
    // 에러 클리어
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // 파일 검증
  const validateFile = (file) => {
    const errors = [];
    
    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.push('파일 크기는 5MB 이하여야 합니다.');
    }
    
    // 파일 형식 검증
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      errors.push('PNG, JPG, SVG 파일만 업로드 가능합니다.');
    }
    
    return errors;
  };

  // 로고 파일 선택 핸들러
  const handleLogoSelect = (file) => {
    const validationErrors = validateFile(file);
    
    if (validationErrors.length > 0) {
      setErrors(prev => ({
        ...prev,
        logo: validationErrors.join(' ')
      }));
      return;
    }
    
    setLogoFile(file);
    setHasChanges(true);
    
    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // 에러 클리어
    setErrors(prev => ({
      ...prev,
      logo: null
    }));
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleLogoSelect(files[0]);
    }
  }, []);

  // 파일 입력 핸들러
  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleLogoSelect(files[0]);
    }
  };

  // 로고 제거
  const handleLogoRemove = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setHasChanges(true);
  };

  // 폼 검증
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = '회사명을 입력해주세요.';
    }
    
    if (formData.companyName.length > 255) {
      newErrors.companyName = '회사명은 255자 이하여야 합니다.';
    }
    
    if (formData.companyNameEn.length > 255) {
      newErrors.companyNameEn = '영문 회사명은 255자 이하여야 합니다.';
    }
    
    // 색상 코드 검증
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (formData.primaryColor && !colorRegex.test(formData.primaryColor)) {
      newErrors.primaryColor = '올바른 색상 코드를 입력해주세요. (예: var(--mg-primary-500))';
    }
    
    if (formData.secondaryColor && !colorRegex.test(formData.secondaryColor)) {
      newErrors.secondaryColor = '올바른 색상 코드를 입력해주세요. (예: var(--mg-secondary-500))';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 저장 핸들러
  const handleSave = async() => {
    if (!validateForm()) {
      notificationManager.show('입력 정보를 확인해주세요.', 'error');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // 1. 로고 업로드 (파일이 있는 경우)
      if (logoFile) {
        setIsUploading(true);
        await uploadLogo(logoFile);
        setIsUploading(false);
      }
      
      // 2. 브랜딩 정보 업데이트
      await updateBrandingInfo(formData);
      
      // 3. 브랜딩 정보 새로고침
      await refreshBranding();
      
      setHasChanges(false);
      setLogoFile(null);
      
      notificationManager.show('브랜딩 정보가 저장되었습니다.', 'success');
      
    } catch (error) {
      console.error('브랜딩 정보 저장 오류:', error);
      notificationManager.show('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  // 초기화 핸들러
  const handleReset = async() => {
    try {
      const branding = await getBrandingInfo();
      if (branding) {
        setFormData({
          companyName: branding.companyName || '',
          companyNameEn: branding.companyNameEn || '',
          primaryColor: branding.primaryColor || 'var(--mg-primary-500)',
          secondaryColor: branding.secondaryColor || 'var(--mg-secondary-500)',
          favicon: branding.favicon || ''
        });
        
        if (branding.logo && branding.logo.url && 
            !branding.logo.url.includes('core-solution-logo.png')) {
          setLogoPreview(branding.logo.url);
        } else {
          setLogoPreview(null);
        }
      }
    } catch (error) {
      console.error('브랜딩 정보 로드 실패:', error);
    }
    
    setLogoFile(null);
    setHasChanges(false);
    setErrors({});
  };

  // 미리보기 데이터 생성
  const getPreviewData = () => {
    const previewBranding = {
      companyName: formData.companyName,
      companyNameEn: formData.companyNameEn,
      primaryColor: formData.primaryColor,
      secondaryColor: formData.secondaryColor,
      favicon: formData.favicon
    };
    
    if (logoPreview) {
      previewBranding.logo = {
        url: logoPreview,
        width: 200,
        height: 60,
        format: 'png'
      };
    }
    
    return previewBranding;
  };

  return (
    <AdminCommonLayout title="브랜딩 관리">
      <div className="mg-v2-ad-b0kla">
        <div className="mg-v2-ad-b0kla__container">
          <ContentArea ariaLabel="브랜딩 관리 본문">
            <ContentHeader
              title="브랜딩 관리"
              subtitle="테넌트의 로고, 상호명, 색상을 설정하여 브랜드 아이덴티티를 구축하세요."
              titleId={BRANDING_MGMT_TITLE_ID}
            />
            <main aria-labelledby={BRANDING_MGMT_TITLE_ID} className="branding-management">
      {isLoading ? (
        <UnifiedLoading type="inline" text="브랜딩 정보를 불러오는 중..." />
      ) : (
      <>
      <div className="branding-management__content">
        {/* 로고 업로드 섹션 */}
        <div className="branding-management__section">
          <h3 className="branding-management__section-title">
            <Upload size={20} />
            로고 업로드
          </h3>
          
          <div className="branding-management__logo-section">
            {/* 드래그 앤 드롭 영역 */}
            <div 
              className={`branding-management__upload-area ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('logo-file-input').click()}
            >
              {logoPreview ? (
                <div className="branding-management__logo-preview">
                  <img 
                    src={logoPreview} 
                    alt="로고 미리보기" 
                    className="branding-management__logo-image"
                  />
                  <MGButton
                    type="button"
                    variant="outline"
                    size="small"
                    className="branding-management__logo-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogoRemove();
                    }}
                    title="로고 제거"
                    preventDoubleClick={false}
                  >
                    제거
                  </MGButton>
                </div>
              ) : (
                <div className="branding-management__upload-placeholder">
                  <Upload size={48} />
                  <p>로고를 드래그하여 놓거나 클릭하여 선택하세요</p>
                  <span>PNG, JPG, SVG (최대 5MB)</span>
                </div>
              )}
              
              <input
                id="logo-file-input"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>
            
            {errors.logo && (
              <div className="branding-management__error">
                <AlertCircle size={16} />
                {errors.logo}
              </div>
            )}
          </div>
        </div>

        {/* 회사 정보 섹션 */}
        <div className="branding-management__section">
          <h3 className="branding-management__section-title">회사 정보</h3>
          
          <div className="branding-management__form-grid">
            <div className="branding-management__form-group">
              <label className="branding-management__label">
                회사명 (한글) *
              </label>
              <input
                type="text"
                className={`branding-management__input ${errors.companyName ? 'error' : ''}`}
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="예: Core Solution 상담센터"
                maxLength={255}
              />
              {errors.companyName && (
                <div className="branding-management__error">
                  <AlertCircle size={16} />
                  {errors.companyName}
                </div>
              )}
            </div>
            
            <div className="branding-management__form-group">
              <label className="branding-management__label">
                회사명 (영문)
              </label>
              <input
                type="text"
                className={`branding-management__input ${errors.companyNameEn ? 'error' : ''}`}
                value={formData.companyNameEn}
                onChange={(e) => handleInputChange('companyNameEn', e.target.value)}
                placeholder="예: Core Solution Counseling Center"
                maxLength={255}
              />
              {errors.companyNameEn && (
                <div className="branding-management__error">
                  <AlertCircle size={16} />
                  {errors.companyNameEn}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 색상 설정 섹션 */}
        <div className="branding-management__section">
          <h3 className="branding-management__section-title">색상 설정</h3>
          
          <div className="branding-management__form-grid">
                        <div className="branding-management__form-group">
                          <label className="branding-management__label">
                            주 색상 (Primary)
                          </label>
                          <ColorPicker
                            value={formData.primaryColor}
                            onChange={(color) => handleInputChange('primaryColor', color)}
                            error={errors.primaryColor}
                          />
                          {errors.primaryColor && (
                            <div className="branding-management__error">
                              <AlertCircle size={16} />
                              {errors.primaryColor}
                            </div>
                          )}
                        </div>
            
                        <div className="branding-management__form-group">
                          <label className="branding-management__label">
                            보조 색상 (Secondary)
                          </label>
                          <ColorPicker
                            value={formData.secondaryColor}
                            onChange={(color) => handleInputChange('secondaryColor', color)}
                            error={errors.secondaryColor}
                          />
                          {errors.secondaryColor && (
                            <div className="branding-management__error">
                              <AlertCircle size={16} />
                              {errors.secondaryColor}
                            </div>
                          )}
                        </div>
          </div>
        </div>

        {/* 파비콘 설정 섹션 */}
        <div className="branding-management__section">
          <h3 className="branding-management__section-title">파비콘 설정</h3>
          
          <div className="branding-management__form-group">
            <label className="branding-management__label">
              파비콘 URL
            </label>
            <input
              type="url"
              className="branding-management__input"
              value={formData.favicon}
              onChange={(e) => handleInputChange('favicon', e.target.value)}
              placeholder="https://example.com/favicon.ico"
            />
            <small className="branding-management__help-text">
              파비콘 이미지의 URL을 입력하세요. (선택사항)
            </small>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="branding-management__actions">
        <MGButton
          type="button"
          variant="outline"
          className="branding-management__button branding-management__button--preview"
          onClick={() => setShowPreview(true)}
          disabled={isSaving || isUploading}
          preventDoubleClick={false}
        >
          미리보기
        </MGButton>

        <MGButton
          type="button"
          variant="outline"
          className="branding-management__button branding-management__button--reset"
          onClick={handleReset}
          disabled={!hasChanges || isSaving || isUploading}
          preventDoubleClick={false}
        >
          초기화
        </MGButton>

        <MGButton
          type="button"
          variant="primary"
          className="branding-management__button branding-management__button--save"
          onClick={handleSave}
          disabled={!hasChanges || isSaving || isUploading}
          loading={isSaving || isUploading}
          loadingText={isUploading ? '업로드 중...' : '저장 중...'}
          preventDoubleClick={false}
        >
          저장
        </MGButton>
      </div>

      {/* 미리보기 모달 */}
      {showPreview && (
        <BrandingPreviewModal
          brandingData={getPreviewData()}
          onClose={() => setShowPreview(false)}
        />
      )}
      </>
      )}
            </main>
          </ContentArea>
        </div>
      </div>
    </AdminCommonLayout>
  );
};

// 색상 선택기 컴포넌트
const ColorPicker = ({ value, onChange, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value || 'var(--mg-primary-500)');
  
  // 미리 정의된 색상 팔레트
  const colorPalette = [
    // 기본 색상
    'var(--mg-primary-500)', 'var(--mg-secondary-500)', 'var(--mg-success-500)', 'var(--mg-error-500)', 'var(--mg-warning-500)', 'var(--mg-info-500)',
    'var(--cs-purple-500)', 'var(--cs-pink-500)', 'var(--cs-orange-500)', 'var(--cs-teal-500)', 'var(--cs-purple-600)', 'var(--cs-pink-600)',
    
    // 브랜드 색상
    'var(--mg-primary-500)', 'var(--cs-purple-600)', 'var(--mg-warning-500)', 'var(--cs-error-400)', 'var(--cs-blue-400)', 'var(--cs-teal-400)',
    'var(--cs-success-400)', 'var(--cs-teal-400)', 'var(--cs-orange-100)', 'var(--cs-orange-300)', 'var(--cs-teal-200)', 'var(--cs-pink-200)',
    
    // 비즈니스 색상
    'var(--cs-slate-800)', 'var(--cs-slate-700)', 'var(--cs-slate-500)', 'var(--cs-slate-300)', 'var(--cs-slate-100)', 'var(--mg-finance-primary)',
    'var(--mg-finance-dark)', 'var(--cs-orange-600)', 'var(--cs-error-700)', 'var(--cs-purple-700)', 'var(--cs-purple-500)', 'var(--cs-blue-500)',
    
    // 파스텔 색상
    'var(--cs-pink-200)', 'var(--cs-orange-200)', 'var(--cs-yellow-200)', 'var(--cs-success-200)', 'var(--cs-blue-200)', 'var(--cs-purple-200)',
    'var(--cs-pink-300)', 'var(--cs-pink-200)', 'var(--cs-success-200)', 'var(--cs-teal-200)', 'var(--cs-purple-200)', 'var(--cs-pink-200)'
  ];

  const handleColorSelect = (color) => {
    onChange(color);
    setCustomColor(color);
    setIsOpen(false);
  };

  const handleCustomColorChange = (e) => {
    const color = e.target.value;
    setCustomColor(color);
    onChange(color);
  };

  return (
    <div className="color-picker">
      <div className="color-picker__display" onClick={() => setIsOpen(!isOpen)}>
        <div 
          className="color-picker__swatch"
          style={{ backgroundColor: value }}
         />
        <input
          type="text"
          className={`color-picker__input ${error ? 'error' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="var(--mg-primary-500)"
          maxLength={7}
        />
        <MGButton
          type="button"
          variant="outline"
          size="small"
          className="color-picker__toggle"
          onClick={() => setIsOpen(!isOpen)}
          preventDoubleClick={false}
        >
          🎨
        </MGButton>
      </div>
      
      {isOpen && (
        <div className="color-picker__dropdown">
          <div className="color-picker__section">
            <h4>색상 팔레트</h4>
            <div className="color-picker__palette">
              {colorPalette.map((color, index) => (
                <MGButton
                  key={index}
                  type="button"
                  variant="outline"
                  className={`color-picker__color ${value === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                  aria-label={color}
                  preventDoubleClick={false}
                >
                  {'\u00A0'}
                </MGButton>
              ))}
            </div>
          </div>
          
          <div className="color-picker__section">
            <h4>사용자 정의 색상</h4>
            <div className="color-picker__custom">
              <input
                type="color"
                className="color-picker__native"
                value={customColor}
                onChange={handleCustomColorChange}
              />
              <input
                type="text"
                className="color-picker__hex"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  onChange(e.target.value);
                }}
                placeholder="var(--mg-black)"
                maxLength={7}
              />
            </div>
          </div>
          
          <div className="color-picker__actions">
            <MGButton
              type="button"
              variant="secondary"
              className="color-picker__close"
              onClick={() => setIsOpen(false)}
              preventDoubleClick={false}
            >
              닫기
            </MGButton>
          </div>
        </div>
      )}
    </div>
  );
};

// 브랜딩 미리보기 모달 컴포넌트
const BrandingPreviewModal = ({ brandingData, onClose }) => {
  return (
    <div className="mg-modal"
      isOpen={true}
      onClose={onClose}
      title="브랜딩 미리보기"
      size="large"
    >
      <div className="branding-preview">
        <div className="branding-preview__header">
          <p>변경사항이 적용된 헤더의 모습입니다.</p>
        </div>
        
        <div className="branding-preview__demo">
          {/* 헤더 미리보기 */}
          <div className="branding-preview__header-demo">
            <div className="branding-preview__logo">
              {brandingData.logo && brandingData.logo.url && 
               !brandingData.logo.url.includes('core-solution-logo.png') ? (
                <img 
                  src={brandingData.logo.url} 
                  alt={brandingData.companyName || 'Logo'}
                  className="branding-preview__logo-image"
                />
              ) : (
                <div className="branding-preview__logo-text">
                  <span className="branding-preview__company-name">
                    {brandingData.companyName || 'Core Solution'}
                  </span>
                  <span className="branding-preview__subtitle">Core Solution</span>
                </div>
              )}
            </div>
          </div>
          
          {/* 색상 미리보기 */}
          <div className="branding-preview__colors">
            <div className="branding-preview__color-item">
              <div 
                className="branding-preview__color-swatch"
                style={{ backgroundColor: brandingData.primaryColor }}
               />
              <span>주 색상: {brandingData.primaryColor}</span>
            </div>
            <div className="branding-preview__color-item">
              <div 
                className="branding-preview__color-swatch"
                style={{ backgroundColor: brandingData.secondaryColor }}
               />
              <span>보조 색상: {brandingData.secondaryColor}</span>
            </div>
          </div>
        </div>
        
        <div className="branding-preview__actions">
          <MGButton
            type="button"
            variant="primary"
            className="branding-preview__close-button"
            onClick={onClose}
            preventDoubleClick={false}
          >
            닫기
          </MGButton>
        </div>
      </div>
    </div>
  );
};

export default BrandingManagement;
