/**
 * 브랜딩 관리 컴포넌트 — 테넌트 로고, 상호명, 색상 등 설정
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentArea from '../dashboard-v2/content/ContentArea';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import UnifiedLoading from '../common/UnifiedLoading';
import UnifiedModal from '../common/modals/UnifiedModal';
import { AlertCircle } from 'lucide-react';
import { useBranding } from '../../hooks/useBranding';
import {
  updateBrandingInfo,
  uploadLogo,
  uploadFavicon,
  getBrandingInfo,
  getCustomLogoSrc
} from '../../utils/brandingUtils';
import notificationManager from '../../utils/notification';
import { toDisplayString, toErrorMessage } from '../../utils/safeDisplay';
import {
  getDefaultBrandingPrimaryHex,
  getDefaultBrandingSecondaryHex
} from '../../utils/resolveCssColorVarToHex';
import '../../styles/unified-design-tokens.css';
import './AdminDashboard/AdminDashboardB0KlA.css';
import './BrandingManagement.css';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';

const BRANDING_MGMT_TITLE_ID = 'branding-management-title';
const BRANDING_FORM_ID = 'branding-management-form';

/** 백엔드 BrandingInfo.createDefault 및 API @Size(max=7) 정합 — 디자인 토큰에서 해석 */
const RESOLVED_DEFAULT_PRIMARY_HEX = getDefaultBrandingPrimaryHex();
const RESOLVED_DEFAULT_SECONDARY_HEX = getDefaultBrandingSecondaryHex();

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

/**
 * API·레거시 값을 폼용 HEX로 정규화
 * @param {string} [value]
 * @param {string} fallbackHex
 * @returns {string}
 */
const normalizeIncomingColor = (value, fallbackHex) => {
  if (value == null || typeof value !== 'string') {
    return fallbackHex;
  }
  const t = value.trim();
  if (HEX_COLOR_RE.test(t)) {
    return t;
  }
  if (/^[0-9A-Fa-f]{6}$/i.test(t)) {
    return `#${t}`.toUpperCase();
  }
  if (t.startsWith('var(')) {
    return fallbackHex;
  }
  return fallbackHex;
};

const BrandingManagement = () => {
  const { isLoading, refreshBranding } = useBranding();

  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);

  const [formData, setFormData] = useState({
    companyName: '',
    companyNameEn: '',
    primaryColor: RESOLVED_DEFAULT_PRIMARY_HEX,
    secondaryColor: RESOLVED_DEFAULT_SECONDARY_HEX,
    favicon: ''
  });

  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isLogoDragOver, setIsLogoDragOver] = useState(false);
  const [isFaviconDragOver, setIsFaviconDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadInitialData = async() => {
      try {
        const branding = await getBrandingInfo();
        if (branding) {
          setFormData({
            companyName: branding.companyName || '',
            companyNameEn: branding.companyNameEn || '',
            primaryColor: normalizeIncomingColor(branding.primaryColor, RESOLVED_DEFAULT_PRIMARY_HEX),
            secondaryColor: normalizeIncomingColor(branding.secondaryColor, RESOLVED_DEFAULT_SECONDARY_HEX),
            favicon: branding.favicon || ''
          });

          const logoSrc = getCustomLogoSrc(branding.logo);
          if (logoSrc) {
            setLogoPreview(logoSrc);
          }
        }
      } catch (error) {
        console.error('브랜딩 정보 로드 실패:', error);
      }
    };

    loadInitialData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateFile = (file, kind) => {
    const messages = [];

    if (file.size > 5 * 1024 * 1024) {
      messages.push('파일 크기는 5MB 이하여야 합니다.');
    }

    if (kind === 'logo') {
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        messages.push('PNG, JPG, SVG 파일만 업로드 가능합니다.');
      }
    } else {
      const name = (file.name || '').toLowerCase();
      const allowedMime = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon'];
      const okMime = !file.type || allowedMime.includes(file.type);
      const okExt = name.endsWith('.ico') || name.endsWith('.png');
      if (!okMime && !okExt) {
        messages.push('PNG 또는 ICO 파일만 업로드 가능합니다.');
      }
    }

    return messages;
  };

  const handleLogoSelect = useCallback((file) => {
    const validationErrors = validateFile(file, 'logo');

    if (validationErrors.length > 0) {
      setErrors((prev) => ({
        ...prev,
        logo: validationErrors.join(' ')
      }));
      return;
    }

    setLogoFile(file);
    setHasChanges(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    setErrors((prev) => ({
      ...prev,
      logo: null
    }));
  }, []);

  const handleFaviconSelect = useCallback((file) => {
    const validationErrors = validateFile(file, 'favicon');

    if (validationErrors.length > 0) {
      setErrors((prev) => ({
        ...prev,
        favicon: validationErrors.join(' ')
      }));
      return;
    }

    setFaviconFile(file);
    setHasChanges(true);
    setErrors((prev) => ({
      ...prev,
      favicon: null
    }));
  }, []);

  const handleLogoDragOver = useCallback((e) => {
    e.preventDefault();
    setIsLogoDragOver(true);
  }, []);

  const handleLogoDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsLogoDragOver(false);
  }, []);

  const handleLogoDrop = useCallback((e) => {
    e.preventDefault();
    setIsLogoDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleLogoSelect(files[0]);
    }
  }, [handleLogoSelect]);

  const handleFaviconDragOver = useCallback((e) => {
    e.preventDefault();
    setIsFaviconDragOver(true);
  }, []);

  const handleFaviconDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsFaviconDragOver(false);
  }, []);

  const handleFaviconDrop = useCallback((e) => {
    e.preventDefault();
    setIsFaviconDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFaviconSelect(files[0]);
    }
  }, [handleFaviconSelect]);

  const handleLogoFileInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleLogoSelect(files[0]);
    }
  };

  const handleFaviconFileInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFaviconSelect(files[0]);
    }
  };

  const handleLogoRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLogoFile(null);
    setLogoPreview(null);
    setHasChanges(true);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleFaviconRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFaviconFile(null);
    setHasChanges(true);
    if (faviconInputRef.current) {
      faviconInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const next = {};

    if (!formData.companyName.trim()) {
      next.companyName = '회사명을 입력해주세요.';
    }

    if (formData.companyName.length > 255) {
      next.companyName = '회사명은 255자 이하여야 합니다.';
    }

    if (formData.companyNameEn.length > 255) {
      next.companyNameEn = '영문 회사명은 255자 이하여야 합니다.';
    }

    if (formData.primaryColor && !HEX_COLOR_RE.test(formData.primaryColor)) {
      next.primaryColor = '주요 색상은 #RRGGBB 형식(7자)으로 입력해주세요.';
    }

    if (formData.secondaryColor && !HEX_COLOR_RE.test(formData.secondaryColor)) {
      next.secondaryColor = '보조 색상은 #RRGGBB 형식(7자)으로 입력해주세요.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    if (!validateForm()) {
      notificationManager.show('입력 정보를 확인해주세요.', 'error');
      return;
    }

    try {
      setIsSaving(true);

      if (logoFile) {
        setIsUploading(true);
        await uploadLogo(logoFile);
        setIsUploading(false);
      }

      if (faviconFile) {
        setIsUploading(true);
        const updated = await uploadFavicon(faviconFile);
        setIsUploading(false);
        if (updated && updated.favicon) {
          setFormData((prev) => ({ ...prev, favicon: updated.favicon }));
        }
      }

      await updateBrandingInfo(formData);
      await refreshBranding();

      setHasChanges(false);
      setLogoFile(null);
      setFaviconFile(null);

      notificationManager.show('브랜딩 정보가 저장되었습니다.', 'success');
    } catch (error) {
      console.error('브랜딩 정보 저장 오류:', error);
      notificationManager.show(
        toErrorMessage(error, '저장 중 오류가 발생했습니다.'),
        'error'
      );
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const handleReset = async() => {
    try {
      const branding = await getBrandingInfo();
      if (branding) {
        setFormData({
          companyName: branding.companyName || '',
          companyNameEn: branding.companyNameEn || '',
        primaryColor: normalizeIncomingColor(branding.primaryColor, RESOLVED_DEFAULT_PRIMARY_HEX),
        secondaryColor: normalizeIncomingColor(branding.secondaryColor, RESOLVED_DEFAULT_SECONDARY_HEX),
          favicon: branding.favicon || ''
        });

        const logoSrc = getCustomLogoSrc(branding.logo);
        if (logoSrc) {
          setLogoPreview(logoSrc);
        } else {
          setLogoPreview(null);
        }
      }
    } catch (error) {
      console.error('브랜딩 정보 로드 실패:', error);
    }

    setLogoFile(null);
    setFaviconFile(null);
    setHasChanges(false);
    setErrors({});
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
    if (faviconInputRef.current) {
      faviconInputRef.current.value = '';
    }
  };

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

  const onPrimaryHexInput = (raw) => {
    let v = String(raw).trim();
    if (v && !v.startsWith('#')) {
      v = `#${v}`;
    }
    handleInputChange('primaryColor', v);
  };

  const onSecondaryHexInput = (raw) => {
    let v = String(raw).trim();
    if (v && !v.startsWith('#')) {
      v = `#${v}`;
    }
    handleInputChange('secondaryColor', v);
  };

  const previewData = getPreviewData();
  const previewLogoSrc = getCustomLogoSrc(previewData.logo);
  const faviconSecondaryText = faviconFile
    ? faviconFile.name
    : (formData.favicon ? '현재 파비콘이 등록되어 있습니다.' : 'PNG 또는 ICO · 드래그하여 놓기');

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
            <main
              aria-labelledby={BRANDING_MGMT_TITLE_ID}
              className="mg-branding-settings"
              id="main-content"
              lang="ko"
            >
              {isLoading ? (
                <UnifiedLoading type="inline" text="브랜딩 정보를 불러오는 중..." />
              ) : (
                <form
                  id={BRANDING_FORM_ID}
                  className="mg-branding-settings__form"
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <section
                    className="mg-branding-settings__section"
                    aria-labelledby="branding-logo-heading"
                  >
                    <header className="mg-branding-settings__section-head">
                      <span className="mg-branding-settings__accent-bar" aria-hidden="true" />
                      <h2 id="branding-logo-heading" className="mg-branding-settings__section-title">
                        로고 업로드
                      </h2>
                    </header>
                    <div className="mg-branding-settings__section-body">
                      <p id="branding-logo-desc" className="mg-branding-settings__hint">
                        권장 형식은 PNG 또는 SVG입니다. 드래그하여 놓거나 클릭하여 파일을 선택하세요.
                      </p>
                      <input
                        ref={logoInputRef}
                        type="file"
                        id="branding-logo-file"
                        className="mg-branding-settings__file-input"
                        name="logo"
                        accept="image/png,image/svg+xml,image/jpeg,image/jpg"
                        aria-describedby="branding-logo-desc"
                        onChange={handleLogoFileInputChange}
                      />
                      <label
                        htmlFor="branding-logo-file"
                        className={`mg-branding-settings__upload-zone ${isLogoDragOver ? 'mg-branding-settings__upload-zone--drag' : ''}`}
                        onDragOver={handleLogoDragOver}
                        onDragLeave={handleLogoDragLeave}
                        onDrop={handleLogoDrop}
                      >
                        {logoPreview ? (
                          <span className="mg-branding-settings__logo-preview-inner">
                            <img
                              src={logoPreview}
                              alt="로고 미리보기"
                              className="mg-branding-settings__logo-image"
                            />
                            <MGButton
                              type="button"
                              variant="outline"
                              size="small"
                              className={buildErpMgButtonClassName({
                                variant: 'outline',
                                size: 'sm',
                                loading: false,
                                className: 'mg-branding-settings__logo-remove'
                              })}
                              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                              onClick={handleLogoRemove}
                              title="로고 제거"
                              preventDoubleClick={false}
                            >
                              제거
                            </MGButton>
                          </span>
                        ) : (
                          <>
                            <span className="mg-branding-settings__upload-icon" aria-hidden="true">
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
                                <path d="M12 16V7M12 7L8 11M12 7L16 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M4 17V18C4 18.5523 4.44772 19 5 19H19C19.5523 19 20 18.5523 20 18V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            </span>
                            <span className="mg-branding-settings__upload-text">
                              <span className="mg-branding-settings__upload-primary">파일을 여기로 끌어다 놓기</span>
                              <span className="mg-branding-settings__upload-secondary">또는 클릭하여 선택 · PNG, JPG, SVG (최대 5MB)</span>
                            </span>
                          </>
                        )}
                      </label>
                      {errors.logo && (
                        <div className="mg-branding-settings__field-error" role="alert">
                          <AlertCircle size={16} aria-hidden="true" />
                          <span>{toDisplayString(errors.logo)}</span>
                        </div>
                      )}
                    </div>
                  </section>

                  <section
                    className="mg-branding-settings__section"
                    aria-labelledby="branding-company-heading"
                  >
                    <header className="mg-branding-settings__section-head">
                      <span className="mg-branding-settings__accent-bar" aria-hidden="true" />
                      <h2 id="branding-company-heading" className="mg-branding-settings__section-title">
                        회사 정보
                      </h2>
                    </header>
                    <div className="mg-branding-settings__section-body">
                      <div className="mg-branding-settings__grid mg-branding-settings__grid--2col">
                        <div className="mg-branding-settings__field">
                          <label className="mg-branding-settings__label" htmlFor="branding-company-name">
                            회사명 (한글)
                            <span className="mg-branding-settings__required" aria-hidden="true">
                              {' '}
                              *
                            </span>
                          </label>
                          <input
                            type="text"
                            id="branding-company-name"
                            className={`mg-branding-settings__input ${errors.companyName ? 'mg-branding-settings__input--error' : ''}`}
                            name="companyName"
                            autoComplete="organization"
                            value={formData.companyName}
                            onChange={(e) => handleInputChange('companyName', e.target.value)}
                            placeholder="예: Core Solution 상담센터"
                            maxLength={255}
                          />
                          {errors.companyName && (
                            <div className="mg-branding-settings__field-error" role="alert">
                              <AlertCircle size={16} aria-hidden="true" />
                              <span>{toDisplayString(errors.companyName)}</span>
                            </div>
                          )}
                        </div>
                        <div className="mg-branding-settings__field">
                          <label className="mg-branding-settings__label" htmlFor="branding-company-name-en">
                            회사명 (영문)
                          </label>
                          <input
                            type="text"
                            id="branding-company-name-en"
                            className={`mg-branding-settings__input ${errors.companyNameEn ? 'mg-branding-settings__input--error' : ''}`}
                            name="companyNameEn"
                            value={formData.companyNameEn}
                            onChange={(e) => handleInputChange('companyNameEn', e.target.value)}
                            placeholder="예: Core Solution Counseling Center"
                            maxLength={255}
                          />
                          {errors.companyNameEn && (
                            <div className="mg-branding-settings__field-error" role="alert">
                              <AlertCircle size={16} aria-hidden="true" />
                              <span>{toDisplayString(errors.companyNameEn)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section
                    className="mg-branding-settings__section"
                    aria-labelledby="branding-colors-heading"
                  >
                    <header className="mg-branding-settings__section-head">
                      <span className="mg-branding-settings__accent-bar" aria-hidden="true" />
                      <h2 id="branding-colors-heading" className="mg-branding-settings__section-title">
                        브랜드 색상
                      </h2>
                    </header>
                    <div className="mg-branding-settings__section-body">
                      <p id="branding-colors-desc" className="mg-branding-settings__hint">
                        주요 색상과 보조 색상을 지정합니다. 미리보기에서 적용 결과를 확인할 수 있습니다.
                      </p>
                      <div className="mg-branding-settings__grid mg-branding-settings__grid--2col">
                        <div className="mg-branding-settings__field">
                          <label className="mg-branding-settings__label" htmlFor="branding-color-primary">
                            주요 색상
                          </label>
                          <div className="mg-branding-settings__color-row">
                            <input
                              type="color"
                              id="branding-color-primary"
                              className="mg-branding-settings__color-swatch"
                              name="colorPrimary"
                              value={HEX_COLOR_RE.test(formData.primaryColor) ? formData.primaryColor : RESOLVED_DEFAULT_PRIMARY_HEX}
                              onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                              aria-describedby="branding-colors-desc"
                            />
                            <input
                              type="text"
                              className={`mg-branding-settings__input mg-branding-settings__input--color-hex ${errors.primaryColor ? 'mg-branding-settings__input--error' : ''}`}
                              name="colorPrimaryHex"
                              inputMode="text"
                              spellCheck={false}
                              aria-label="주요 색상 HEX 값"
                              value={formData.primaryColor}
                              onChange={(e) => onPrimaryHexInput(e.target.value)}
                              maxLength={7}
                            />
                          </div>
                          {errors.primaryColor && (
                            <div className="mg-branding-settings__field-error" role="alert">
                              <AlertCircle size={16} aria-hidden="true" />
                              <span>{toDisplayString(errors.primaryColor)}</span>
                            </div>
                          )}
                        </div>
                        <div className="mg-branding-settings__field">
                          <label className="mg-branding-settings__label" htmlFor="branding-color-secondary">
                            보조 색상
                          </label>
                          <div className="mg-branding-settings__color-row">
                            <input
                              type="color"
                              id="branding-color-secondary"
                              className="mg-branding-settings__color-swatch"
                              name="colorSecondary"
                              value={HEX_COLOR_RE.test(formData.secondaryColor) ? formData.secondaryColor : RESOLVED_DEFAULT_SECONDARY_HEX}
                              onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                              aria-describedby="branding-colors-desc"
                            />
                            <input
                              type="text"
                              className={`mg-branding-settings__input mg-branding-settings__input--color-hex ${errors.secondaryColor ? 'mg-branding-settings__input--error' : ''}`}
                              name="colorSecondaryHex"
                              inputMode="text"
                              spellCheck={false}
                              aria-label="보조 색상 HEX 값"
                              value={formData.secondaryColor}
                              onChange={(e) => onSecondaryHexInput(e.target.value)}
                              maxLength={7}
                            />
                          </div>
                          {errors.secondaryColor && (
                            <div className="mg-branding-settings__field-error" role="alert">
                              <AlertCircle size={16} aria-hidden="true" />
                              <span>{toDisplayString(errors.secondaryColor)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section
                    className="mg-branding-settings__section"
                    aria-labelledby="branding-favicon-heading"
                  >
                    <header className="mg-branding-settings__section-head">
                      <span className="mg-branding-settings__accent-bar" aria-hidden="true" />
                      <h2 id="branding-favicon-heading" className="mg-branding-settings__section-title">
                        파비콘
                      </h2>
                    </header>
                    <div className="mg-branding-settings__section-body">
                      <p id="branding-favicon-desc" className="mg-branding-settings__hint">
                        정사각형 이미지(예: 32×32 이상)를 권장합니다. 선택 시 서버에 업로드되며 저장 시 반영됩니다.
                      </p>
                      <input
                        ref={faviconInputRef}
                        type="file"
                        id="branding-favicon-file"
                        className="mg-branding-settings__file-input"
                        name="favicon"
                        accept="image/png,image/x-icon,image/vnd.microsoft.icon,.ico"
                        aria-describedby="branding-favicon-desc"
                        onChange={handleFaviconFileInputChange}
                      />
                      <label
                        htmlFor="branding-favicon-file"
                        className={`mg-branding-settings__upload-zone mg-branding-settings__upload-zone--compact ${isFaviconDragOver ? 'mg-branding-settings__upload-zone--drag' : ''}`}
                        onDragOver={handleFaviconDragOver}
                        onDragLeave={handleFaviconDragLeave}
                        onDrop={handleFaviconDrop}
                      >
                        <span className="mg-branding-settings__upload-icon" aria-hidden="true">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
                            <path d="M12 16V7M12 7L8 11M12 7L16 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M4 17V18C4 18.5523 4.44772 19 5 19H19C19.5523 19 20 18.5523 20 18V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </span>
                        <span className="mg-branding-settings__upload-text">
                          <span className="mg-branding-settings__upload-primary">파비콘 파일 선택</span>
                          <span className="mg-branding-settings__upload-secondary">
                            {toDisplayString(faviconSecondaryText)}
                          </span>
                        </span>
                        {faviconFile && (
                          <MGButton
                            type="button"
                            variant="outline"
                            size="small"
                            className={buildErpMgButtonClassName({
                              variant: 'outline',
                              size: 'sm',
                              loading: false,
                              className: 'mg-branding-settings__favicon-remove'
                            })}
                            loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                            onClick={handleFaviconRemove}
                            title="선택한 파비콘 파일 초기화"
                            preventDoubleClick={false}
                          >
                            선택 해제
                          </MGButton>
                        )}
                      </label>
                      {errors.favicon && (
                        <div className="mg-branding-settings__field-error" role="alert">
                          <AlertCircle size={16} aria-hidden="true" />
                          <span>{toDisplayString(errors.favicon)}</span>
                        </div>
                      )}
                    </div>
                  </section>

                  <footer className="mg-branding-settings__footer" aria-labelledby="branding-actions-heading">
                    <h2 id="branding-actions-heading" className="mg-branding-settings__sr-only">
                      브랜딩 설정 작업
                    </h2>
                    <div className="mg-branding-settings__actions mg-branding-settings__actions--split mg-v2-card-actions">
                      <div className="mg-branding-settings__actions-leading">
                        <MGButton
                          type="button"
                          variant="outline"
                          className={buildErpMgButtonClassName({
                            variant: 'outline',
                            size: 'md',
                            loading: false
                          })}
                          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                          onClick={() => setShowPreview(true)}
                          disabled={isSaving || isUploading}
                          preventDoubleClick={false}
                        >
                          미리보기
                        </MGButton>
                        <MGButton
                          type="button"
                          variant="secondary"
                          className={buildErpMgButtonClassName({
                            variant: 'secondary',
                            size: 'md',
                            loading: false
                          })}
                          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                          onClick={handleReset}
                          disabled={!hasChanges || isSaving || isUploading}
                          preventDoubleClick={false}
                        >
                          초기화
                        </MGButton>
                      </div>
                      <div className="mg-branding-settings__actions-trailing">
                        <MGButton
                          type="submit"
                          variant="primary"
                          className={buildErpMgButtonClassName({
                            variant: 'primary',
                            size: 'md',
                            loading: isSaving || isUploading
                          })}
                          disabled={!hasChanges || isSaving || isUploading}
                          loading={isSaving || isUploading}
                          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                          preventDoubleClick={false}
                        >
                          저장
                        </MGButton>
                      </div>
                    </div>
                  </footer>
                </form>
              )}
            </main>
          </ContentArea>
        </div>
      </div>

      <UnifiedModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="브랜딩 미리보기"
        size="large"
        variant="detail"
      >
        <div className="mg-branding-settings__preview">
          <p className="mg-branding-settings__preview-lead">
            변경사항이 적용된 헤더의 모습입니다.
          </p>
          <div className="mg-branding-settings__preview-demo">
            <div className="mg-branding-settings__preview-header-demo">
              <div className="mg-branding-settings__preview-logo">
                {previewLogoSrc ? (
                  <img
                    src={previewLogoSrc}
                    alt={toDisplayString(previewData.companyName || 'Logo')}
                    className="mg-branding-settings__preview-logo-image"
                  />
                ) : (
                  <div className="mg-branding-settings__preview-logo-text">
                    <span className="mg-branding-settings__preview-company-name">
                      {toDisplayString(previewData.companyName || 'CoreSolution')}
                    </span>
                    <span className="mg-branding-settings__preview-subtitle">
                      {toDisplayString(previewData.companyNameEn || 'CoreSolution')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="mg-branding-settings__preview-colors">
              <div className="mg-branding-settings__preview-color-item">
                <span
                  className="mg-branding-settings__preview-swatch"
                  style={{
                    backgroundColor: HEX_COLOR_RE.test(previewData.primaryColor)
                      ? previewData.primaryColor
                      : RESOLVED_DEFAULT_PRIMARY_HEX
                  }}
                />
                <span>
                  주요 색상:
                  {' '}
                  {toDisplayString(previewData.primaryColor)}
                </span>
              </div>
              <div className="mg-branding-settings__preview-color-item">
                <span
                  className="mg-branding-settings__preview-swatch"
                  style={{
                    backgroundColor: HEX_COLOR_RE.test(previewData.secondaryColor)
                      ? previewData.secondaryColor
                      : RESOLVED_DEFAULT_SECONDARY_HEX
                  }}
                />
                <span>
                  보조 색상:
                  {' '}
                  {toDisplayString(previewData.secondaryColor)}
                </span>
              </div>
            </div>
          </div>
          <div className="mg-branding-settings__preview-actions">
            <MGButton
              type="button"
              variant="primary"
              className={buildErpMgButtonClassName({
                variant: 'primary',
                size: 'md',
                loading: false
              })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => setShowPreview(false)}
              preventDoubleClick={false}
            >
              닫기
            </MGButton>
          </div>
        </div>
      </UnifiedModal>
    </AdminCommonLayout>
  );
};

export default BrandingManagement;
